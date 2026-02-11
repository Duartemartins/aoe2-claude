import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UnitPanel from './components/UnitPanel';
import quotations from './data/quotations.json';
import initialRecommendedSetup from './data/recommendedSetup.json';

const STORAGE_KEY = 'aoe2-sounds-recommended-setup';

function getInitialRecommendedSetup() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return initialRecommendedSetup;
    }
  }
  return initialRecommendedSetup;
}

// Build list of civilization keys (sorted, with 'general' and 'taunts' as special entries)
const civKeys = Object.keys(quotations.civilizations).sort((a, b) => {
  if (a === 'general') return 1;
  if (b === 'general') return -1;
  return a.localeCompare(b);
});

function App() {
  const [selectedView, setSelectedView] = useState('home');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [recommendedSetup, setRecommendedSetup] = useState(getInitialRecommendedSetup);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendedSetup));
  }, [recommendedSetup]);

  const handleRemoveRecommendation = (hookName, audioUrl) => {
    setRecommendedSetup(prev => ({
      ...prev,
      hooks: prev.hooks.map(hook =>
        hook.name === hookName
          ? { ...hook, recommendations: hook.recommendations.filter(rec => rec.audioUrl !== audioUrl) }
          : hook
      )
    }));
  };

  const handleMoveRecommendation = (fromHookName, toHookName, recommendation) => {
    setRecommendedSetup(prev => ({
      ...prev,
      hooks: prev.hooks.map(hook => {
        if (hook.name === fromHookName) {
          return { ...hook, recommendations: hook.recommendations.filter(rec => rec.audioUrl !== recommendation.audioUrl) };
        }
        if (hook.name === toHookName) {
          const exists = hook.recommendations.some(rec => rec.audioUrl === recommendation.audioUrl);
          if (exists) return hook;
          return { ...hook, recommendations: [...hook.recommendations, recommendation] };
        }
        return hook;
      })
    }));
  };

  const handleReorderRecommendations = (hookName, oldIndex, newIndex) => {
    setRecommendedSetup(prev => ({
      ...prev,
      hooks: prev.hooks.map(hook => {
        if (hook.name !== hookName) return hook;
        const newRecs = [...hook.recommendations];
        const [removed] = newRecs.splice(oldIndex, 1);
        newRecs.splice(newIndex, 0, removed);
        return { ...hook, recommendations: newRecs };
      })
    }));
  };

  const handleAddRecommendation = (hookName, recommendation) => {
    setRecommendedSetup(prev => ({
      ...prev,
      hooks: prev.hooks.map(hook => {
        if (hook.name !== hookName) return hook;
        const exists = hook.recommendations.some(rec => rec.audioUrl === recommendation.audioUrl);
        if (exists) return hook;
        return { ...hook, recommendations: [...hook.recommendations, recommendation] };
      })
    }));
  };

  const handleImportSetup = (newSetup) => {
    setRecommendedSetup(newSetup);
  };

  const isHomeView = selectedView === 'home';
  const isRecommendedView = selectedView === 'recommended';
  const isTauntsView = selectedView === 'taunts';
  const isAllView = selectedView === 'all';
  const isCivView = !isHomeView && !isRecommendedView && !isTauntsView && !isAllView;

  // Build sections based on current view
  let currentSections = [];
  let currentCiv = null;

  if (isCivView) {
    currentCiv = selectedView;
    const civData = quotations.civilizations[currentCiv];
    if (civData) {
      currentSections = civData.sections.map(section => ({
        ...section,
        units: section.categories ? [{ ...section, race: currentCiv }] : [],
        name: section.name,
        race: currentCiv,
      }));
      // For AoE2, each section IS a unit (e.g., "Villager Male")
      // with categories (actions like Select, Move, Attack)
      currentSections = civData.sections.map(section => ({
        ...section,
        race: currentCiv,
      }));
    }
  } else if (isAllView) {
    // Flatten all civilizations
    currentSections = [];
    for (const [civKey, civData] of Object.entries(quotations.civilizations)) {
      for (const section of civData.sections) {
        currentSections.push({
          ...section,
          name: `${civData.displayName} - ${section.name}`,
          race: civKey,
        });
      }
    }
  } else if (isTauntsView) {
    // Taunts as a single "section" with one category
    currentSections = [{
      name: 'Taunts',
      categories: [{
        name: 'All Taunts',
        quotes: quotations.taunts,
      }],
      race: 'taunts',
    }];
  }

  const handleViewChange = (view) => {
    setSelectedView(view);
    setSelectedUnit(null);
    setQuoteSearchQuery('');
  };

  return (
    <div className="flex h-screen bg-aoe-darker">
      <Sidebar
        sections={currentSections}
        selectedUnit={selectedUnit}
        onSelectUnit={setSelectedUnit}
        selectedView={selectedView}
        onViewChange={handleViewChange}
        civKeys={civKeys}
        civilizations={quotations.civilizations}
        quoteSearchQuery={quoteSearchQuery}
        onQuoteSearchChange={setQuoteSearchQuery}
        recommendedSetup={recommendedSetup}
      />
      <UnitPanel
        unit={selectedUnit}
        civ={currentCiv || 'all'}
        sections={currentSections}
        quoteSearchQuery={quoteSearchQuery}
        isHomeView={isHomeView}
        isRecommendedView={isRecommendedView}
        isTauntsView={isTauntsView}
        recommendedSetup={recommendedSetup}
        onRemoveRecommendation={handleRemoveRecommendation}
        onMoveRecommendation={handleMoveRecommendation}
        onReorderRecommendations={handleReorderRecommendations}
        onAddRecommendation={handleAddRecommendation}
        onImportSetup={handleImportSetup}
        onNavigate={handleViewChange}
      />
    </div>
  );
}

export default App;
