import { useState, useRef } from 'react';
import { useSelection } from '../contexts/SelectionContext';

function createQuoteSuffix(text, maxLength = 50) {
  if (!text) return '';
  const sanitized = text
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/['\u2018\u2019]/g, '')
    .replace(/[.,!;:]+$/g, '')
    .trim();
  if (sanitized.length <= maxLength) return sanitized;
  const truncated = sanitized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;
}

export default function QuoteLine({ quote, civ = 'general', unitName = '', categoryName = '', recommendedSetup = null, onAddRecommendation = null }) {
  const { isSelected, toggleSelection, selectedCount } = useSelection();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  const proxyUrl = `http://localhost:3001/api/audio?url=${encodeURIComponent(quote.audioUrl)}`;

  const handlePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Play error:', error);
          audioRef.current.load();
          try {
            await audioRef.current.play();
          } catch (retryError) {
            console.error('Retry play error:', retryError);
          }
        }
      }
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const urlParts = quote.audioUrl.split('/');
      const audioFilename = urlParts.find(part => /\.(ogg|mp3|wav)$/.test(part)) || 'audio.ogg';
      const baseName = audioFilename.replace(/\.(ogg|mp3|wav)$/, '');
      const quoteSuffix = createQuoteSuffix(quote.text);
      const mp3Filename = quoteSuffix ? `${baseName} - ${quoteSuffix}.mp3` : `${baseName}.mp3`;

      const response = await fetch(
        `http://localhost:3001/api/download?url=${encodeURIComponent(quote.audioUrl)}&filename=${encodeURIComponent(mp3Filename)}`
      );

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mp3Filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Make sure the backend server is running.');
    } finally {
      setIsDownloading(false);
    }
  };

  const selected = isSelected(quote);
  const showCheckbox = selectedCount > 0 || selected;

  const handleToggleSelection = (e) => {
    e.stopPropagation();
    toggleSelection(quote, { unitName, categoryName, civ });
  };

  const availableHooks = recommendedSetup?.hooks?.filter(hook =>
    !hook.recommendations.some(rec => rec.audioUrl === quote.audioUrl)
  ) || [];

  const handleAddToHook = (hookName) => {
    onAddRecommendation?.(hookName, {
      text: quote.text,
      unit: unitName,
      civ,
      audioUrl: quote.audioUrl
    });
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded hover:bg-aoe-stone/30 group">
      <audio
        ref={audioRef}
        src={proxyUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      <input
        type="checkbox"
        checked={selected}
        onChange={handleToggleSelection}
        className={`flex-shrink-0 w-4 h-4 rounded border-gray-500 bg-transparent cursor-pointer accent-current text-aoe-gold ${
          showCheckbox ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity`}
      />

      <button
        onClick={handlePlay}
        disabled={hasError}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          hasError
            ? 'bg-red-500/20 cursor-not-allowed'
            : 'bg-aoe-gold/20 hover:bg-aoe-gold/40'
        }`}
        title={hasError ? 'Audio unavailable' : isPlaying ? 'Stop' : 'Play'}
      >
        {hasError ? (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-4 h-4 text-aoe-gold" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-aoe-gold ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      <span className="text-aoe-parchment/60 text-sm font-body">{quote.text}</span>

      {availableHooks.length > 0 && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {availableHooks.map(hook => (
            <button
              key={hook.name}
              onClick={() => handleAddToHook(hook.name)}
              className="px-2 py-0.5 text-xs rounded bg-aoe-gold/10 text-aoe-gold/70 hover:bg-aoe-gold/25 transition-colors font-body"
              title={`Add to ${hook.name}`}
            >
              +{hook.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0 w-8 h-8 rounded bg-aoe-brown/30 hover:bg-aoe-brown/50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
        title="Download MP3"
      >
        {isDownloading ? (
          <svg className="w-4 h-4 text-aoe-parchment animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-aoe-parchment" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>
    </div>
  );
}
