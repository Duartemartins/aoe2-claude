import { useState, useEffect } from 'react';

export default function Sidebar({ sections, selectedUnit, onSelectUnit, selectedView, onViewChange, civKeys, civilizations, quoteSearchQuery, onQuoteSearchChange, recommendedSetup }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const isHomeView = selectedView === 'home';
  const isRecommendedView = selectedView === 'recommended';
  const isTauntsView = selectedView === 'taunts';
  const isCivView = !isHomeView && !isRecommendedView && !isTauntsView && selectedView !== 'all';

  useEffect(() => {
    if (isRecommendedView && recommendedSetup?.hooks) {
      setExpandedSections(
        recommendedSetup.hooks.reduce((acc, hook) => ({ ...acc, [hook.name]: true }), {})
      );
    } else {
      setExpandedSections(
        sections.reduce((acc, section) => ({ ...acc, [section.name]: true }), {})
      );
    }
  }, [sections, isRecommendedView, recommendedSetup]);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-aoe-dark border-r border-aoe-gold/10 flex flex-col h-screen">
      <div className="p-4 border-b border-aoe-gold/10">
        <h1 className="font-display text-lg font-bold text-aoe-gold mb-3 tracking-wide">AoE2 Sounds</h1>

        {/* Navigation */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => onViewChange('home')}
            className={`py-1.5 px-2 text-sm font-medium rounded transition-colors ${
              isHomeView
                ? 'bg-aoe-gold/20 text-aoe-gold'
                : 'text-aoe-parchment/40 hover:text-aoe-parchment/70 hover:bg-white/5'
            }`}
            title="Home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button
            onClick={() => onViewChange('all')}
            className={`py-1.5 px-3 text-sm font-display tracking-wide rounded transition-colors ${
              selectedView === 'all'
                ? 'bg-aoe-gold/20 text-aoe-gold'
                : 'text-aoe-parchment/40 hover:text-aoe-parchment/70 hover:bg-white/5'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onViewChange('taunts')}
            className={`py-1.5 px-3 text-sm font-display tracking-wide rounded transition-colors ${
              isTauntsView
                ? 'bg-aoe-red/30 text-aoe-red-light'
                : 'text-aoe-parchment/40 hover:text-aoe-parchment/70 hover:bg-white/5'
            }`}
          >
            Taunts
          </button>
        </div>

        {/* Civilization dropdown */}
        <select
          value={isCivView ? selectedView : ''}
          onChange={(e) => { if (e.target.value) onViewChange(e.target.value); }}
          className="w-full px-3 py-2 bg-aoe-darker border border-aoe-gold/15 rounded text-sm text-aoe-parchment/70 font-body focus:outline-none focus:border-aoe-gold/50 mb-2"
        >
          <option value="" disabled>Select Civilization...</option>
          {civKeys.map(key => (
            <option key={key} value={key}>
              {civilizations[key]?.displayName || key}
            </option>
          ))}
        </select>

        <button
          onClick={() => onViewChange('recommended')}
          className={`w-full py-1.5 px-2 text-sm font-display tracking-wide rounded transition-colors mb-3 flex items-center justify-center gap-1.5 ${
            isRecommendedView
              ? 'bg-aoe-gold/15 text-aoe-gold'
              : 'text-aoe-parchment/40 hover:text-aoe-parchment/70 hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Recommended Setup
        </button>

        {!isRecommendedView && !isHomeView && (
          <>
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-aoe-darker border border-aoe-gold/15 rounded text-sm text-aoe-parchment/70 placeholder-aoe-parchment/25 font-body focus:outline-none focus:border-aoe-gold/50 mb-2"
            />
            <input
              type="text"
              placeholder="Search sounds..."
              value={quoteSearchQuery}
              onChange={(e) => onQuoteSearchChange(e.target.value)}
              className="w-full px-3 py-2 bg-aoe-darker border border-aoe-gold/15 rounded text-sm text-aoe-parchment/70 placeholder-aoe-parchment/25 font-body focus:outline-none focus:border-aoe-gold/50"
            />
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isHomeView ? (
          <div className="p-4 text-center text-aoe-parchment/30">
            <p className="text-sm mb-2 font-body">Select a civilization to browse sounds</p>
            <p className="text-xs font-body">or check out the Recommended Setup</p>
          </div>
        ) : isRecommendedView ? (
          recommendedSetup?.hooks?.map((hook) => (
            <div key={hook.name} className="mb-2">
              <button
                onClick={() => {
                  toggleSection(hook.name);
                  document.getElementById(`hook-${hook.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-2 w-full text-left py-2 px-2 rounded hover:bg-white/5 transition-colors"
              >
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${expandedSections[hook.name] ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polygon points="8,5 19,12 8,19" />
                </svg>
                <span className="text-sm font-display font-semibold text-aoe-gold tracking-wide">{hook.name}</span>
                <span className="text-xs text-aoe-parchment/30">({hook.recommendations.length})</span>
              </button>

              {expandedSections[hook.name] && (
                <div className="ml-4">
                  <p className="text-xs text-aoe-parchment/30 px-2 py-1 mb-1 font-body">{hook.description}</p>
                  {hook.recommendations.map((rec, idx) => (
                    <div
                      key={`${hook.name}-${idx}`}
                      className="py-1.5 px-2 text-sm"
                    >
                      <span className="block truncate text-aoe-gold">{rec.text}</span>
                      <span className="text-xs text-aoe-parchment/30 font-body">{rec.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          filteredSections.map((section) => (
            <div key={section.name} className="mb-1">
              <button
                onClick={() => {
                  toggleSection(section.name);
                  onSelectUnit(section);
                }}
                className={`flex items-center gap-2 w-full text-left py-1.5 px-2 rounded text-sm transition-colors ${
                  selectedUnit?.name === section.name
                    ? 'bg-aoe-gold/15 text-aoe-gold'
                    : 'text-aoe-parchment/50 hover:text-aoe-parchment/80 hover:bg-white/5'
                }`}
              >
                <span className="truncate font-body">{section.name}</span>
                <span className="text-xs text-aoe-parchment/25 ml-auto">
                  {section.categories?.reduce((sum, c) => sum + c.quotes.length, 0) || 0}
                </span>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-aoe-gold/10 text-xs text-aoe-parchment/25 font-body">
        Audio from Age of Empires Wiki
      </div>
    </div>
  );
}
