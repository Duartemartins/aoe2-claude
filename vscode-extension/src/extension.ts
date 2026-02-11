import * as vscode from 'vscode';
import { registerChatParticipant } from './chatParticipant';
import { registerEventHooks } from './eventHooks';
import { ensureSoundDirs, getSoundCounts } from './audioPlayer';
import { downloadDefaultSounds } from './soundSetup';

export function activate(context: vscode.ExtensionContext) {
  // Ensure sound cache directories exist
  ensureSoundDirs();

  // Check if sounds are downloaded — prompt setup if not
  const counts = getSoundCounts();
  const totalSounds = Object.values(counts).reduce((a, b) => a + b, 0);

  if (totalSounds === 0) {
    vscode.window
      .showInformationMessage(
        '⚔️ AoE2 Sounds: No sounds downloaded yet. Download default sound pack?',
        'Download Sounds',
        'Later'
      )
      .then((choice) => {
        if (choice === 'Download Sounds') {
          downloadDefaultSounds(context.extensionPath).then((count) => {
            vscode.window.showInformationMessage(`⚔️ Downloaded ${count} AoE2 sounds! Wololo!`);
          });
        }
      });
  }

  // Register the @aoe2 Copilot Chat participant
  registerChatParticipant(context);

  // Register event-driven sound hooks (like Claude Code hooks)
  registerEventHooks(context);

  // Command to download/refresh sounds
  context.subscriptions.push(
    vscode.commands.registerCommand('aoe2-sounds.downloadSounds', async () => {
      const count = await downloadDefaultSounds(context.extensionPath);
      vscode.window.showInformationMessage(`⚔️ Downloaded ${count} AoE2 sounds!`);
    })
  );

  // Command to open the web-based sound browser
  context.subscriptions.push(
    vscode.commands.registerCommand('aoe2-sounds.openBrowser', () => {
      vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173'));
    })
  );
}

export function deactivate() {}
