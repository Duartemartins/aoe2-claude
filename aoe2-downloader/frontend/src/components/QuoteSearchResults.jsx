import { useMemo } from 'react';
import QuoteLine from './QuoteLine';

export default function QuoteSearchResults({ sections, searchQuery, civ = 'all' }) {
  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matches = [];

    for (const section of sections) {
      for (const category of (section.categories || [])) {
        for (const quote of category.quotes) {
          if (quote.text.toLowerCase().includes(query)) {
            matches.push({
              quote,
              unitName: section.name,
              categoryName: category.name,
              civ: section.race || civ,
            });
          }
        }
      }
    }

    return matches;
  }, [sections, searchQuery, civ]);

  if (!searchQuery.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center text-aoe-parchment/30">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="font-body">Type to search sounds...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-aoe-parchment/30">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-body">No sounds found for &ldquo;{searchQuery}&rdquo;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-aoe-gold tracking-wide">Search Results</h1>
        <span className="text-aoe-parchment/40 text-sm font-body">{results.length} sounds found</span>
      </div>

      <div className="space-y-1">
        {results.map((result, index) => (
          <div key={index} className="rounded hover:bg-aoe-stone/30">
            <div className="flex items-center gap-2 px-3 pt-2">
              <span className="text-xs px-2 py-0.5 rounded bg-aoe-gold/20 text-aoe-gold">
                {result.unitName}
              </span>
              <span className="text-xs text-aoe-parchment/30 font-body">{result.categoryName}</span>
            </div>
            <QuoteLine quote={result.quote} civ={result.civ} unitName={result.unitName} categoryName={result.categoryName} />
          </div>
        ))}
      </div>
    </div>
  );
}
