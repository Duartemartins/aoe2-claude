import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { QuotationsData, Quote, Section } from './types';

let cachedData: QuotationsData | null = null;

/**
 * Load quotations.json — checks workspace folders first, then bundled data.
 */
export function loadQuotations(extensionPath: string): QuotationsData {
  if (cachedData) {
    return cachedData;
  }

  const relativePath = path.join('aoe2-downloader', 'frontend', 'src', 'data', 'quotations.json');

  // 1. Try each open workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of workspaceFolders) {
    const candidate = path.join(folder.uri.fsPath, relativePath);
    if (fs.existsSync(candidate)) {
      cachedData = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      return cachedData!;
    }
  }

  // 2. Try relative to extension install path (dev mode / repo checkout)
  const siblingPath = path.resolve(extensionPath, '..', relativePath);
  if (fs.existsSync(siblingPath)) {
    cachedData = JSON.parse(fs.readFileSync(siblingPath, 'utf-8'));
    return cachedData!;
  }

  // 3. Bundled copy inside the extension
  const bundledPath = path.join(extensionPath, 'data', 'quotations.json');
  if (fs.existsSync(bundledPath)) {
    cachedData = JSON.parse(fs.readFileSync(bundledPath, 'utf-8'));
    return cachedData!;
  }

  throw new Error('Could not find quotations.json');
}

/**
 * List all civilization keys.
 */
export function getCivilizations(data: QuotationsData): string[] {
  return Object.keys(data.civilizations);
}

/**
 * List all unit (section) names for a civ.
 */
export function getUnits(data: QuotationsData, civKey: string): string[] {
  const civ = data.civilizations[civKey];
  if (!civ) { return []; }
  return civ.sections.map(s => s.name);
}

/**
 * Search quotes by text across all civs/units/categories.
 */
export function searchQuotes(
  data: QuotationsData,
  query: string,
  limit = 15
): Array<{ civ: string; unit: string; category: string; quote: Quote }> {
  const results: Array<{ civ: string; unit: string; category: string; quote: Quote }> = [];
  const lowerQuery = query.toLowerCase();

  for (const [civKey, civ] of Object.entries(data.civilizations)) {
    for (const section of civ.sections) {
      for (const cat of section.categories) {
        for (const quote of cat.quotes) {
          if (quote.text.toLowerCase().includes(lowerQuery)) {
            results.push({
              civ: civ.displayName,
              unit: section.name,
              category: cat.name,
              quote,
            });
            if (results.length >= limit) { return results; }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Get a random quote from across all data.
 */
export function getRandomQuote(data: QuotationsData): {
  civ: string; unit: string; category: string; quote: Quote;
} | null {
  // Collect all (civ, section, cat, quote) tuples
  const all: Array<{ civ: string; unit: string; category: string; quote: Quote }> = [];

  for (const [, civ] of Object.entries(data.civilizations)) {
    for (const section of civ.sections) {
      for (const cat of section.categories) {
        for (const quote of cat.quotes) {
          all.push({ civ: civ.displayName, unit: section.name, category: cat.name, quote });
        }
      }
    }
  }

  if (all.length === 0) { return null; }
  return all[Math.floor(Math.random() * all.length)];
}

/**
 * Get all taunt quotes (from the "general" civ, units that have "Taunt" category).
 */
export function getTaunts(data: QuotationsData): Quote[] {
  const general = data.civilizations['general'];
  if (!general) { return []; }

  const taunts: Quote[] = [];
  for (const section of general.sections) {
    for (const cat of section.categories) {
      if (cat.name.toLowerCase() === 'taunt' || section.name.toLowerCase() === 'taunt') {
        taunts.push(...cat.quotes);
      }
    }
  }
  return taunts;
}

/**
 * Get units/quotes for a specific civilization.
 */
export function getCivSections(data: QuotationsData, civKey: string): Section[] {
  const civ = data.civilizations[civKey];
  if (!civ) { return []; }
  return civ.sections;
}
