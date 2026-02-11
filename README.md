# Wololo

AoE2 sound effects for your coding tools. Hear villager acknowledgments, monk chants, and taunts while you code — in [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and [GitHub Copilot](https://github.com/features/copilot).

Claude finishes a task? "It is good." Context compaction? Wololo. You submit a prompt? A villager grunts and gets to work.

2,700+ voice lines from 46 civilizations. 42 classic taunts. All scraped from the [AoE2 Wiki](https://ageofempires.fandom.com/).

Originally forked from [starcraft-claude](https://github.com/rubenflamshepherd/starcraft-claude).

## How it works

There are two ways to use this:

**Claude Code** — A zsh script watches for Claude's hook trigger files and plays a random sound via `afplay`. A web UI lets you pick which sounds go on which hook.

**GitHub Copilot** — A VS Code extension plays the same sounds on editor events (file save, terminal commands, chat messages). It also adds an `@aoe2` participant to Copilot Chat for browsing the sound library.

Both share the same sound files in `~/.claude/sounds/`.

## Setup (Claude Code)

You need Node 18+, ffmpeg, and fswatch:

```bash
brew install ffmpeg fswatch
```

```bash
npm run install:all
npm run dev
```

Frontend at http://localhost:5173, backend at http://localhost:3001.

Hit "One-Click Setup" in the UI. This writes hooks to `~/.claude/settings.json`, downloads sounds, and installs the fswatch listener. Restart your terminal after.

## Setup (VS Code / Copilot)

```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package
code --install-extension aoe2-sounds-0.1.0.vsix
```

Reload VS Code. The extension will ask to download sounds on first run, or you can run "AoE2 Sounds: Download Sounds" from the command palette.

If you already set up Claude Code sounds, the extension uses those same files automatically.

### What fires when

| Event | Sound folder | Example |
|-------|-------------|---------|
| Extension activates | `start/` | "Start the game" |
| File save | `done/` | "It is good" |
| Terminal command | `userpromptsubmit/` | Villager task acknowledgment |
| `@aoe2` chat message | `userpromptsubmit/` + `done/` | Plays on send and on response |
| Wololo command (`Cmd+Shift+P`) | `precompact/` | Monk chants |

Volume and individual triggers are configurable in VS Code settings under "AoE2 Sounds".

### Chat commands

Type `@aoe2` in Copilot Chat:

| Command | What it does |
|---------|-------------|
| `/search wololo` | Search voice lines by keyword |
| `/random` | Random line from 2,700+ |
| `/taunt` | Random taunt |
| `/civs` | List all civilizations |
| `/units britons` | List units for a civ |

## Under the hood

A scraper (`scripts/scrape-wiki.js`) pulls file listings from the AoE2 Wiki via the MediaWiki API. The frontend is React + Vite + Tailwind. The Express backend proxies audio (CORS) and converts OGG to MP3 with ffmpeg. The zsh watcher (`claude-sounds.zsh`) uses fswatch to detect hook trigger files and plays a random `.mp3` from the matching folder.

To re-scrape:

```bash
npm run scrape
```

Writes to `aoe2-downloader/frontend/src/data/quotations.json`.

## Credits

Voice lines from the [Age of Empires Wiki](https://ageofempires.fandom.com/) on Fandom. AoE2:DE by Xbox Game Studios and Forgotten Empires.
