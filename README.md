# AoE2 Sounds for Claude Code

Get "Wololo" and 2,700 other Age of Empires II voice lines playing in your terminal while you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

Every time Claude finishes a task, starts a session, or compacts context, you hear a random AoE2 sound. Monks chanting during compaction. Villagers acknowledging your prompts. Taunts when a session starts. That sort of thing.

Based on [starcraft-claude](https://github.com/duartemartins/starcraft-claude).

## What you get

2,700+ unit dialogue lines scraped from the AoE2 wiki, covering 46 civilizations and 42 taunts. A web UI to browse, preview, and pick which sounds go where. A watcher script that actually plays them in your terminal.

You can also download everything as a ZIP, or save individual sounds to `~/.claude/sounds/` and wire them up manually.

## Setup

You need Node 18+, ffmpeg, and fswatch:

```bash
# macOS
brew install ffmpeg fswatch
```

Then:

```bash
cd aoe2-downloader
npm run install:all
npm run dev
```

Frontend runs at http://localhost:5173, backend at http://localhost:3001.

Open the frontend and hit "One-Click Setup". This writes the Claude Code hooks to `~/.claude/settings.json`, downloads a default set of sounds, and installs the fswatch listener. Restart your terminal after.

## How it works

A scraper (`scripts/scrape-wiki.js`) pulls file listings from the [AoE2 Wiki](https://ageofempires.fandom.com/) using the MediaWiki API. The frontend is React + Vite + Tailwind. The Express backend proxies audio to avoid CORS issues and converts OGG to MP3 via ffmpeg. A zsh script (`claude-sounds.zsh`) watches for hook trigger files and plays a random sound from the right folder.

## Re-scraping

```bash
cd aoe2-downloader
npm run scrape
```

Writes to `frontend/src/data/quotations.json`.

## Credits

Voice lines from the [Age of Empires Wiki](https://ageofempires.fandom.com/) on Fandom. AoE2:DE by Xbox Game Studios and Forgotten Empires.
