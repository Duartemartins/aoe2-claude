import * as vscode from 'vscode';
import { loadQuotations, getRandomQuote, searchQuotes } from './dataProvider';
import { downloadSound, ensureSoundDirs, getSoundCounts, HookName } from './audioPlayer';
import { RecommendedSetup } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Default sounds to download per hook (from recommendedSetup.json style data).
 */
const DEFAULT_SOUNDS: Record<HookName, Array<{ text: string; audioUrl: string }>> = {
  SessionStart: [
    { text: 'Start the game', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/0/04/Start_the_game.ogg/revision/latest?cb=20170605130600' },
    { text: 'All hail', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/d/d6/All_hail.ogg/revision/latest?cb=20170605130305' },
    { text: 'Create extra villagers', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/6/6e/Create_extra_villagers.ogg/revision/latest?cb=20170605130310' },
  ],
  UserPromptSubmit: [
    { text: 'Yes', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/e/e1/Yes.ogg/revision/latest?cb=20170605130608' },
    { text: 'Britons Soldier Move 1', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/7/7a/Britons_Soldier_Move_1_AoE2.ogg/revision/latest?cb=20210117215908' },
    { text: 'Britons Villager Male Task 1', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/c/cf/Britons_Villager_Male_Task_1_AoE2.ogg/revision/latest?cb=20210117220102' },
  ],
  Stop: [
    { text: 'It is good', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/3/33/It_is_good.ogg/revision/latest?cb=20170605130346' },
    { text: 'Build a wonder', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/2/27/Build_a_wonder.ogg/revision/latest?cb=20170605130307' },
    { text: 'Britons Villager Male Build', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/e/e6/Britons_Villager_Male_Build_AoE2.ogg/revision/latest?cb=20210117220022' },
  ],
  PreCompact: [
    { text: 'Wololo', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/a/a1/Wololo.ogg/revision/latest?cb=20170605130607' },
    { text: 'Britons Monk Select 1', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/e/e7/Britons_Monk_Select_1_AoE2.ogg/revision/latest?cb=20210117215844' },
    { text: 'Long time no siege', audioUrl: 'https://static.wikia.nocookie.net/ageofempires/images/9/94/Long_time_no_siege.ogg/revision/latest?cb=20170605130353' },
  ],
};

/**
 * Download all default sounds for every hook. Shows progress.
 */
export async function downloadDefaultSounds(extensionPath: string): Promise<number> {
  ensureSoundDirs();

  let downloaded = 0;
  const totalSounds = Object.values(DEFAULT_SOUNDS).reduce((sum, arr) => sum + arr.length, 0);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'AoE2 Sounds: Downloading sounds...',
      cancellable: false,
    },
    async (progress) => {
      for (const [hookName, sounds] of Object.entries(DEFAULT_SOUNDS) as Array<[HookName, typeof DEFAULT_SOUNDS[HookName]]>) {
        for (const sound of sounds) {
          try {
            progress.report({
              message: `${sound.text} (${downloaded + 1}/${totalSounds})`,
              increment: (1 / totalSounds) * 100,
            });
            await downloadSound(sound.audioUrl, hookName, sound.text);
            downloaded++;
          } catch (err: any) {
            console.error(`Failed to download ${sound.text}:`, err.message);
          }
        }
      }
    }
  );

  // Also try to load additional sounds from quotations data and
  // add more variety (random picks from each category)
  try {
    const data = loadQuotations(extensionPath);
    const extraSounds: Partial<Record<HookName, Array<{ text: string; audioUrl: string }>>> = {
      UserPromptSubmit: [],
      Stop: [],
    };

    // Add a few random "Move" and "Task" quotes for UserPromptSubmit
    // Add a few random "Build" and "Select" quotes for Stop
    for (const [, civ] of Object.entries(data.civilizations)) {
      for (const section of civ.sections) {
        for (const cat of section.categories) {
          if (['Move', 'Task'].includes(cat.name) && extraSounds.UserPromptSubmit!.length < 5) {
            const pick = cat.quotes[Math.floor(Math.random() * cat.quotes.length)];
            extraSounds.UserPromptSubmit!.push(pick);
          }
          if (['Build', 'Select'].includes(cat.name) && extraSounds.Stop!.length < 5) {
            const pick = cat.quotes[Math.floor(Math.random() * cat.quotes.length)];
            extraSounds.Stop!.push(pick);
          }
        }
      }
    }

    for (const [hookName, sounds] of Object.entries(extraSounds) as Array<[HookName, Array<{ text: string; audioUrl: string }>]>) {
      for (const sound of sounds) {
        try {
          await downloadSound(sound.audioUrl, hookName, sound.text);
          downloaded++;
        } catch { /* skip failures */ }
      }
    }
  } catch { /* no quotations data — default sounds are enough */ }

  return downloaded;
}
