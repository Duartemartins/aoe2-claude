const fs = require('fs');
const path = require('path');

// ── AoE2 Wiki Scraper ──────────────────────────────────────────────────
// Scrapes unit dialogue and taunt audio files from the Age of Empires wiki
// using the MediaWiki API, then structures them by civilization/unit/action.

const API_BASE = 'https://ageofempires.fandom.com/api.php';

const CATEGORIES = {
  dialogue: 'Category:Unit_dialogue_(Age_of_Empires_II)',
  taunts: 'Category:Taunts_(Age_of_Empires_II)',
};

// Known civilizations in AoE2 (used for parsing filenames)
const CIVILIZATIONS = [
  'Armenians', 'Aztecs', 'Bengalis', 'Berbers', 'Bohemians', 'Britons',
  'Bulgarians', 'Burgundians', 'Burmese', 'Byzantines', 'Celts', 'Chinese',
  'Cumans', 'Dravidians', 'Ethiopians', 'Franks', 'Georgians', 'Goths',
  'Gurjaras', 'Hindustanis', 'Huns', 'Incas', 'Indians', 'Italians',
  'Japanese', 'Khmer', 'Koreans', 'Lithuanians', 'Magyars', 'Malay',
  'Malians', 'Mayans', 'Mongols', 'Norse', 'Persians', 'Poles', 'Portuguese',
  'Romans', 'Saracens', 'Sicilians', 'Slavs', 'Spanish', 'Tatars',
  'Teutons', 'Turks', 'Vietnamese', 'Vikings',
];

// Sort longest first so we match "South Asian" before "South" etc.
const CIV_SORTED = [...CIVILIZATIONS].sort((a, b) => b.length - a.length);

// Actions found in filenames
const ACTIONS = [
  'Select', 'Task', 'Move', 'Attack', 'Build', 'Chop', 'Farm', 'Fish',
  'Forage', 'Hunt', 'Mine', 'Repair', 'Dead', 'Monk', 'Convert', 'Heal',
  'Relic', 'Military',
];
const ACTION_SORTED = [...ACTIONS].sort((a, b) => b.length - a.length);

// ── API helpers ─────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

// Fetch all files in a wiki category (handles pagination)
async function fetchCategoryFiles(category) {
  const files = [];
  let cmcontinue = '';

  while (true) {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmtype: 'file',
      cmlimit: '500',
      format: 'json',
    });
    if (cmcontinue) params.set('cmcontinue', cmcontinue);

    const url = `${API_BASE}?${params}`;
    console.log(`  Fetching category page... (${files.length} files so far)`);
    const data = await fetchJson(url);

    const members = data.query?.categorymembers || [];
    files.push(...members);

    if (data.continue?.cmcontinue) {
      cmcontinue = data.continue.cmcontinue;
      await sleep(200); // Be polite to the API
    } else {
      break;
    }
  }

  return files;
}

// Resolve CDN URLs for file titles in batches of 50
async function resolveFileUrls(fileTitles) {
  const urlMap = {};
  const batchSize = 50;

  for (let i = 0; i < fileTitles.length; i += batchSize) {
    const batch = fileTitles.slice(i, i + batchSize);
    const titles = batch.join('|');

    const params = new URLSearchParams({
      action: 'query',
      titles,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
    });

    const url = `${API_BASE}?${params}`;
    console.log(`  Resolving URLs: ${i + 1}-${Math.min(i + batchSize, fileTitles.length)} of ${fileTitles.length}`);
    const data = await fetchJson(url);

    const pages = data.query?.pages || {};
    for (const page of Object.values(pages)) {
      if (page.imageinfo?.[0]?.url) {
        urlMap[page.title] = page.imageinfo[0].url;
      }
    }

    if (i + batchSize < fileTitles.length) {
      await sleep(200);
    }
  }

  return urlMap;
}

// ── Filename parsing ────────────────────────────────────────────────────

// Pattern: "Britons Villager Male Select 1 AoE2.ogg"
// Pattern: "Alfred the Alpaca Attack 1.mp3"
// Taunts: "Wololo.ogg", "All hail.ogg"

function parseDialogueFilename(title) {
  // Remove "File:" prefix and extension
  let name = title.replace(/^File:/, '').replace(/\.(ogg|mp3|wav)$/, '');

  // Remove "AoE2" or "AoE2DE" suffix if present
  name = name.replace(/\s+AoE2(?:DE)?$/i, '');

  // Try to match civilization
  let civilization = null;
  let remainder = name;

  for (const civ of CIV_SORTED) {
    if (name.startsWith(civ + ' ')) {
      civilization = civ;
      remainder = name.slice(civ.length + 1);
      break;
    }
  }

  // If no civilization matched, it might be a special unit (e.g., "Alfred the Alpaca")
  if (!civilization) {
    civilization = 'General';
  }

  // Try to extract action and number from the end
  // Pattern: "... Action N" or "... Action"
  let action = null;
  let number = null;

  // Check for trailing number
  const numberMatch = remainder.match(/\s+(\d+)$/);
  if (numberMatch) {
    number = parseInt(numberMatch[1]);
    remainder = remainder.slice(0, -numberMatch[0].length);
  }

  // Try to find action keyword
  for (const act of ACTION_SORTED) {
    if (remainder.endsWith(' ' + act) || remainder === act) {
      action = act;
      remainder = remainder.endsWith(' ' + act)
        ? remainder.slice(0, -(act.length + 1))
        : '';
      break;
    }
  }

  // What's left is the unit type (e.g., "Villager Male", "Villager Female", "King")
  const unitType = remainder || 'Unit';

  // If no action found, try to infer from the full name
  if (!action) {
    action = 'Other';
  }

  return {
    civilization,
    unitType,
    action,
    number,
    displayText: title.replace(/^File:/, '').replace(/\.(ogg|mp3|wav)$/, ''),
  };
}

function parseTauntFilename(title) {
  const name = title.replace(/^File:/, '').replace(/\.(ogg|mp3|wav)$/, '');
  return {
    text: name,
    displayText: name,
  };
}

// ── Main scraping logic ─────────────────────────────────────────────────

async function scrapeDialogue() {
  console.log('Scraping unit dialogue files...');
  const files = await fetchCategoryFiles(CATEGORIES.dialogue);
  console.log(`Found ${files.length} dialogue files`);

  // Resolve URLs
  const titles = files.map(f => f.title);
  console.log('Resolving CDN URLs...');
  const urlMap = await resolveFileUrls(titles);
  console.log(`Resolved ${Object.keys(urlMap).length} URLs`);

  // Parse and group by civilization -> unitType -> action
  const civData = {};

  for (const file of files) {
    const url = urlMap[file.title];
    if (!url) continue;

    const parsed = parseDialogueFilename(file.title);

    if (!civData[parsed.civilization]) {
      civData[parsed.civilization] = {};
    }
    if (!civData[parsed.civilization][parsed.unitType]) {
      civData[parsed.civilization][parsed.unitType] = {};
    }
    if (!civData[parsed.civilization][parsed.unitType][parsed.action]) {
      civData[parsed.civilization][parsed.unitType][parsed.action] = [];
    }

    civData[parsed.civilization][parsed.unitType][parsed.action].push({
      text: parsed.displayText,
      audioUrl: url,
    });
  }

  // Convert to structured format matching the plan
  const civilizations = {};

  for (const [civName, units] of Object.entries(civData)) {
    const sections = [];

    for (const [unitName, actions] of Object.entries(units)) {
      const actionList = [];

      for (const [actionName, sounds] of Object.entries(actions)) {
        // Sort sounds by number if present
        sounds.sort((a, b) => {
          const numA = a.text.match(/(\d+)$/)?.[1] || 0;
          const numB = b.text.match(/(\d+)$/)?.[1] || 0;
          return numA - numB;
        });

        actionList.push({
          name: actionName,
          quotes: sounds,
        });
      }

      // Sort actions alphabetically
      actionList.sort((a, b) => a.name.localeCompare(b.name));

      sections.push({
        name: unitName,
        categories: actionList,
      });
    }

    // Sort sections alphabetically
    sections.sort((a, b) => a.name.localeCompare(b.name));

    civilizations[civName.toLowerCase()] = {
      displayName: civName,
      sections,
    };
  }

  return civilizations;
}

async function scrapeTaunts() {
  console.log('\nScraping taunt files...');
  const files = await fetchCategoryFiles(CATEGORIES.taunts);
  console.log(`Found ${files.length} taunt files`);

  // Resolve URLs
  const titles = files.map(f => f.title);
  console.log('Resolving CDN URLs...');
  const urlMap = await resolveFileUrls(titles);
  console.log(`Resolved ${Object.keys(urlMap).length} URLs`);

  const taunts = [];
  for (const file of files) {
    const url = urlMap[file.title];
    if (!url) continue;

    const parsed = parseTauntFilename(file.title);
    taunts.push({
      text: parsed.text,
      audioUrl: url,
    });
  }

  // Sort alphabetically
  taunts.sort((a, b) => a.text.localeCompare(b.text));

  return taunts;
}

async function main() {
  console.log('=== AoE2 Wiki Audio Scraper ===\n');

  const civilizations = await scrapeDialogue();
  const taunts = await scrapeTaunts();

  // Build the output matching the data structure the frontend expects.
  // The SC2 project uses { races: { protoss: { sections: [...] } } }.
  // We use { civilizations: { britons: { displayName, sections: [...] } }, taunts: [...] }.
  // But to keep the frontend code as close to the SC2 version as possible,
  // we also build a flat "races" equivalent where each civ acts like a "race".
  const output = {
    civilizations,
    taunts,
  };

  // Summary
  let totalFiles = 0;
  let totalCivs = Object.keys(civilizations).length;
  for (const civ of Object.values(civilizations)) {
    for (const section of civ.sections) {
      for (const cat of section.categories) {
        totalFiles += cat.quotes.length;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Civilizations: ${totalCivs}`);
  console.log(`Unit dialogue files: ${totalFiles}`);
  console.log(`Taunts: ${taunts.length}`);
  console.log(`Total: ${totalFiles + taunts.length}`);

  const outputPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'quotations.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten to: ${outputPath}`);
}

main().catch(err => {
  console.error('Scraper error:', err);
  process.exit(1);
});
