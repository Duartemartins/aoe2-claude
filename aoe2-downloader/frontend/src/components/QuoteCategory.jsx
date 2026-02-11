import { useState, useMemo } from 'react';
import QuoteLine from './QuoteLine';
import { useSelection } from '../contexts/SelectionContext';

export default function QuoteCategory({ category, civ = 'general', unitName = '', recommendedSetup = null, onAddRecommendation = null }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isSelected, selectAll, deselectAll, selectedCount } = useSelection();

  const allSelected = useMemo(() => {
    return category.quotes.length > 0 && category.quotes.every(q => isSelected(q));
  }, [category.quotes, isSelected]);

  const handleSelectAll = (e) => {
    e.stopPropagation();
    const metadata = { unitName, categoryName: category.name, civ };
    if (allSelected) {
      deselectAll(category.quotes);
    } else {
      selectAll(category.quotes, metadata);
    }
  };

  const showSelectAll = selectedCount > 0 || allSelected;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-grow text-left py-2 px-3 rounded hover:bg-aoe-stone/30 transition-colors"
        >
          <svg
            className={`w-4 h-4 text-aoe-parchment/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="8,5 19,12 8,19" />
          </svg>
          <span className="text-aoe-gold font-display tracking-wide">{category.name}</span>
          <span className="text-aoe-parchment/30 text-sm font-body">({category.quotes.length})</span>
        </button>
        <button
          onClick={handleSelectAll}
          className={`text-xs px-2 py-1 rounded bg-aoe-gold/10 hover:bg-aoe-gold/25 text-aoe-parchment/50 transition-opacity font-body ${
            showSelectAll ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4 border-l border-aoe-gold/10 pl-2">
          {category.quotes.map((quote, index) => (
            <QuoteLine
              key={index}
              quote={quote}
              civ={civ}
              unitName={unitName}
              categoryName={category.name}
              recommendedSetup={recommendedSetup}
              onAddRecommendation={onAddRecommendation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
