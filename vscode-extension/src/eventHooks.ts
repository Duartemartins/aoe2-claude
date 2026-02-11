import * as vscode from 'vscode';
import { playRandomSound, HookName } from './audioPlayer';

let enabled = true;
let statusBarItem: vscode.StatusBarItem;

/**
 * Register VS Code event listeners that map to AoE2 sound hooks.
 *
 * Mapping (Claude Code hooks → VS Code/Copilot events):
 *   SessionStart      → extension activation
 *   UserPromptSubmit   → chat participant request received
 *   Stop              → chat participant response complete / file save
 *   PreCompact        → (manual via command)
 */
export function registerEventHooks(context: vscode.ExtensionContext): void {
  // Status bar toggle
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  statusBarItem.command = 'aoe2-sounds.toggle';
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Toggle command
  context.subscriptions.push(
    vscode.commands.registerCommand('aoe2-sounds.toggle', () => {
      enabled = !enabled;
      updateStatusBar();
      vscode.window.showInformationMessage(
        enabled ? '⚔️ AoE2 Sounds enabled!' : '🔇 AoE2 Sounds disabled.'
      );
    })
  );

  // Wololo command (plays PreCompact sound)
  context.subscriptions.push(
    vscode.commands.registerCommand('aoe2-sounds.wololo', () => {
      playHookSound('PreCompact');
    })
  );

  // Play SessionStart on activation
  playHookSound('SessionStart');

  // File save → "Stop" / task-complete sound
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      if (vscode.workspace.getConfiguration('aoe2Sounds').get<boolean>('playOnSave', true)) {
        playHookSound('Stop');
      }
    })
  );

  // Terminal command started → "UserPromptSubmit" sound
  context.subscriptions.push(
    vscode.window.onDidStartTerminalShellExecution?.(() => {
      if (vscode.workspace.getConfiguration('aoe2Sounds').get<boolean>('playOnTerminalCommand', true)) {
        playHookSound('UserPromptSubmit');
      }
    }) ?? { dispose: () => {} }
  );
}

/**
 * Play a sound for a hook if sounds are enabled.
 */
export function playHookSound(hookName: HookName): void {
  if (!enabled) { return; }
  if (!vscode.workspace.getConfiguration('aoe2Sounds').get<boolean>('enabled', true)) { return; }
  playRandomSound(hookName);
}

function updateStatusBar(): void {
  if (enabled) {
    statusBarItem.text = '$(megaphone) AoE2';
    statusBarItem.tooltip = 'AoE2 Sounds: ON (click to toggle)';
  } else {
    statusBarItem.text = '$(mute) AoE2';
    statusBarItem.tooltip = 'AoE2 Sounds: OFF (click to toggle)';
  }
}
