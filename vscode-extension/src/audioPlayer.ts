import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execFile } from 'child_process';
import { homedir } from 'os';

const SOUNDS_CACHE_DIR = path.join(homedir(), '.claude', 'sounds');

export type HookName = 'SessionStart' | 'UserPromptSubmit' | 'Stop' | 'PreCompact';

const HOOK_DIRS: Record<HookName, string> = {
  SessionStart: path.join(SOUNDS_CACHE_DIR, 'start'),
  UserPromptSubmit: path.join(SOUNDS_CACHE_DIR, 'userpromptsubmit'),
  Stop: path.join(SOUNDS_CACHE_DIR, 'done'),
  PreCompact: path.join(SOUNDS_CACHE_DIR, 'precompact'),
};

/**
 * Ensure all sound directories exist.
 */
export function ensureSoundDirs(): void {
  for (const dir of Object.values(HOOK_DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Download a URL to a local file. Returns the local path.
 */
export async function downloadSound(url: string, hookName: HookName, filename: string): Promise<string> {
  const dir = HOOK_DIRS[hookName];
  fs.mkdirSync(dir, { recursive: true });

  // Sanitize filename
  const safeName = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  const ext = url.match(/\.(mp3|ogg|wav|m4a)/i)?.[1] ?? 'ogg';
  const localPath = path.join(dir, `${safeName}.${ext}`);

  if (fs.existsSync(localPath)) {
    return localPath;
  }

  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, { headers: { 'User-Agent': 'AoE2-Sounds-VSCode/0.1' } }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadSound(res.headers.location, hookName, filename).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const ws = fs.createWriteStream(localPath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(localPath); });
      ws.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Get all local sound files for a hook.
 */
function getSoundsForHook(hookName: HookName): string[] {
  const dir = HOOK_DIRS[hookName];
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir)
    .filter(f => /\.(mp3|ogg|wav|m4a|aiff|aac)$/i.test(f))
    .map(f => path.join(dir, f));
}

/**
 * Play a random sound for the given hook. Returns true if a sound was played.
 */
export function playRandomSound(hookName: HookName): boolean {
  const files = getSoundsForHook(hookName);
  if (files.length === 0) { return false; }

  const file = files[Math.floor(Math.random() * files.length)];
  const volume = vscode.workspace.getConfiguration('aoe2Sounds').get<number>('volume', 0.3);

  if (process.platform === 'darwin') {
    execFile('afplay', ['-v', String(volume), file], (err) => {
      if (err) { console.error('afplay error:', err.message); }
    });
  } else if (process.platform === 'linux') {
    // Try paplay (PulseAudio) or aplay (ALSA)
    execFile('paplay', [file], (err) => {
      if (err) {
        execFile('aplay', [file], (err2) => {
          if (err2) { console.error('audio playback error:', err2.message); }
        });
      }
    });
  } else if (process.platform === 'win32') {
    // PowerShell media player
    const ps = `(New-Object Media.SoundPlayer '${file.replace(/'/g, "''")}').PlaySync()`;
    execFile('powershell', ['-Command', ps], (err) => {
      if (err) { console.error('audio playback error:', err.message); }
    });
  }

  return true;
}

/**
 * Count how many sounds are cached for each hook.
 */
export function getSoundCounts(): Record<HookName, number> {
  return {
    SessionStart: getSoundsForHook('SessionStart').length,
    UserPromptSubmit: getSoundsForHook('UserPromptSubmit').length,
    Stop: getSoundsForHook('Stop').length,
    PreCompact: getSoundsForHook('PreCompact').length,
  };
}

/**
 * Get the sounds cache directory.
 */
export function getSoundsCacheDir(): string {
  return SOUNDS_CACHE_DIR;
}
