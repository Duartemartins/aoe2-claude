import * as vscode from 'vscode';
import {
  loadQuotations,
  searchQuotes,
  getRandomQuote,
  getCivilizations,
  getUnits,
  getTaunts,
  getCivSections,
} from './dataProvider';
import { QuotationsData, Quote } from './types';
import { playHookSound } from './eventHooks';

const PARTICIPANT_ID = 'aoe2-sounds.aoe2';

function formatQuoteResult(
  result: { civ: string; unit: string; category: string; quote: Quote },
  stream: vscode.ChatResponseStream
) {
  stream.markdown(`**${result.quote.text}**\n\n`);
  stream.markdown(`> 🏰 ${result.civ} · ${result.unit} · ${result.category}\n\n`);
  stream.markdown(`[▶ Play audio](${result.quote.audioUrl})\n\n---\n\n`);
}

export function registerChatParticipant(context: vscode.ExtensionContext) {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    _chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> => {
    // Play "prompt submitted" sound
    playHookSound('UserPromptSubmit');

    let data: QuotationsData;
    try {
      data = loadQuotations(context.extensionPath);
    } catch {
      stream.markdown(
        '⚠️ Could not load AoE2 sound data. Run **AoE2 Sounds: Download Sounds** from the command palette.\n'
      );
      return;
    }

    const command = request.command;
    const prompt = request.prompt.trim();

    // /search <query>
    if (command === 'search') {
      if (!prompt) {
        stream.markdown('Provide a search term. Example: `@aoe2 /search wololo`\n');
        return;
      }
      const results = searchQuotes(data, prompt, 10);
      if (results.length === 0) {
        stream.markdown(`No voice lines found matching **"${prompt}"**.\n`);
        return;
      }
      stream.markdown(`### 🔍 Results for "${prompt}"\n\n`);
      for (const r of results) {
        if (token.isCancellationRequested) { return; }
        formatQuoteResult(r, stream);
      }
      return;
    }

    // /random
    if (command === 'random') {
      const r = getRandomQuote(data);
      if (!r) {
        stream.markdown('No voice lines available.\n');
        return;
      }
      stream.markdown('### 🎲 Random Voice Line\n\n');
      formatQuoteResult(r, stream);
      return;
    }

    // /civs
    if (command === 'civs') {
      const civs = getCivilizations(data);
      stream.markdown(`### 🏰 Civilizations (${civs.length})\n\n`);
      for (const c of civs) {
        const display = data.civilizations[c].displayName;
        stream.markdown(`- **${display}** (\`${c}\`)\n`);
      }
      stream.markdown(`\nUse \`@aoe2 /units <civ>\` to list units for a civilization.\n`);
      return;
    }

    // /units <civ>
    if (command === 'units') {
      if (!prompt) {
        stream.markdown('Provide a civilization. Example: `@aoe2 /units britons`\n');
        return;
      }
      const civKey = prompt.toLowerCase().replace(/\s+/g, '');
      // try fuzzy match
      const allCivs = getCivilizations(data);
      const match = allCivs.find(
        k => k === civKey || k.startsWith(civKey) || data.civilizations[k].displayName.toLowerCase().includes(civKey)
      );
      if (!match) {
        stream.markdown(`Civilization **"${prompt}"** not found. Use \`@aoe2 /civs\` to see all.\n`);
        return;
      }
      const sections = getCivSections(data, match);
      const civ = data.civilizations[match];
      stream.markdown(`### 🏰 ${civ.displayName} — Units (${sections.length})\n\n`);
      for (const s of sections) {
        const quoteCount = s.categories.reduce((sum, c) => sum + c.quotes.length, 0);
        const catNames = s.categories.map(c => c.name).join(', ');
        stream.markdown(`- **${s.name}** — ${quoteCount} lines (${catNames})\n`);
      }
      stream.markdown(`\nUse \`@aoe2 /search <unit name>\` to find specific lines.\n`);
      return;
    }

    // /taunt
    if (command === 'taunt') {
      const taunts = getTaunts(data);
      if (taunts.length === 0) {
        stream.markdown('No taunts found.\n');
        return;
      }
      const taunt = taunts[Math.floor(Math.random() * taunts.length)];
      stream.markdown('### 📢 Random Taunt\n\n');
      stream.markdown(`**${taunt.text}**\n\n`);
      stream.markdown(`[▶ Play audio](${taunt.audioUrl})\n\n`);
      return;
    }

    // Default: free-form chat — use LLM to answer AoE2-related questions
    // with context about available data
    if (prompt) {
      // If the prompt looks like a search, do a search
      const results = searchQuotes(data, prompt, 5);
      if (results.length > 0) {
        stream.markdown(`### 🔍 Voice lines matching "${prompt}"\n\n`);
        for (const r of results) {
          if (token.isCancellationRequested) { return; }
          formatQuoteResult(r, stream);
        }
        return;
      }

      // Otherwise, provide help
      stream.markdown(`No voice lines matched **"${prompt}"**. Here's what I can do:\n\n`);
    }

    // Help / fallback
    stream.markdown('### ⚔️ AoE2 Sounds — Commands\n\n');
    stream.markdown('| Command | Description |\n');
    stream.markdown('|---------|-------------|\n');
    stream.markdown('| `/search <query>` | Search for voice lines by name |\n');
    stream.markdown('| `/random` | Get a random voice line |\n');
    stream.markdown('| `/taunt` | Get a random classic taunt |\n');
    stream.markdown('| `/civs` | List all 46 civilizations |\n');
    stream.markdown('| `/units <civ>` | List units for a civilization |\n');
    stream.markdown('\nOr just type a keyword and I\'ll search for matching voice lines.\n');
    stream.markdown('\n💡 **Tip:** Use the [AoE2 Sound Browser](command:aoe2-sounds.openBrowser) for the full experience with audio playback.\n');

    // Play "response complete" sound
    playHookSound('Stop');
  };

  const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handler);
  participant.iconPath = new vscode.ThemeIcon('megaphone');

  context.subscriptions.push(participant);
}
