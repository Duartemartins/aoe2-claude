import { useState, useEffect } from 'react';

import recommendedSetup from '../data/recommendedSetup.json';

const HOOK_TO_FOLDER = {
  SessionStart: 'start',
  UserPromptSubmit: 'userpromptsubmit',
  Stop: 'done',
  PreCompact: 'precompact',
};

export default function LandingPage({ onNavigate }) {
  const [listenerStatus, setListenerStatus] = useState(null);
  const [hooksStatus, setHooksStatus] = useState(null);
  const [soundsStatus, setSoundsStatus] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [setupResult, setSetupResult] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const refreshStatus = async () => {
    try {
      const [listenerRes, hooksRes, soundsRes] = await Promise.all([
        fetch('http://localhost:3001/api/listener-status'),
        fetch('http://localhost:3001/api/hooks-status'),
        fetch('http://localhost:3001/api/sounds-info'),
      ]);
      setListenerStatus(await listenerRes.json());
      setHooksStatus(await hooksRes.json());
      const soundsInfo = await soundsRes.json();
      const allFoldersExist = soundsInfo.folders?.every(f => f.exists);
      setSoundsStatus({ configured: allFoldersExist });
    } catch {
      // Ignore errors
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleToggleSounds = async () => {
    setIsToggling(true);
    try {
      await fetch('http://localhost:3001/api/toggle-sounds', { method: 'POST' });
      await refreshStatus();
    } catch (error) {
      console.error('Toggle failed:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleOneClickSetup = async () => {
    setIsSettingUp(true);
    setSetupResult(null);

    try {
      // Step 1: Setup hooks
      setCurrentStep('hooks');
      await fetch('http://localhost:3001/api/setup-hooks', { method: 'POST' });

      // Step 2: Download sounds
      setCurrentStep('sounds');
      const quotes = [];
      for (const hook of recommendedSetup.hooks) {
        const folderName = HOOK_TO_FOLDER[hook.name] || hook.name.toLowerCase();
        for (const rec of hook.recommendations) {
          const urlMatch = rec.audioUrl.match(/\/([^\/]+)\.(ogg|mp3|wav)\//);
          const baseFilename = urlMatch ? urlMatch[1] : `audio_${quotes.length}`;
          const filename = `${baseFilename} - ${rec.text.replace(/[\/\\:*?"<>|]/g, '')}.mp3`;
          quotes.push({
            audioUrl: rec.audioUrl,
            filename,
            folder: folderName,
          });
        }
      }
      await fetch('http://localhost:3001/api/save-to-sounds-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotes }),
      });

      // Step 3: Setup listener
      setCurrentStep('listener');
      await fetch('http://localhost:3001/api/setup-listener', { method: 'POST' });

      await refreshStatus();

      setSetupResult({
        success: true,
        message: 'Setup complete! Restart your terminal to activate the sound listener.'
      });
    } catch (error) {
      setSetupResult({ error: error.message });
    } finally {
      setIsSettingUp(false);
      setCurrentStep(null);
    }
  };

  const features = [
    {
      title: 'Browse by civilization',
      description: '46 civilizations, each with their own language. Pick one from the dropdown and hear what Briton villagers or Mongol soldiers actually sound like.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      title: 'Preview before downloading',
      description: 'Click play on any line. The audio proxies through the backend so you won\'t run into CORS issues.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Download as MP3',
      description: 'The wiki stores everything as OGG. The backend converts to MP3 on the fly so the files work everywhere.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
    {
      title: 'Batch ZIP',
      description: 'Select a bunch of sounds, download them all as one ZIP. Organized by unit and action type.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
    {
      title: 'Recommended setup',
      description: 'A curated starter pack wired to each hook. Drag to reorder, move between hooks, or swap in your own picks.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      title: 'Save to .claude',
      description: 'Writes files straight into ~/.claude/sounds/ so Claude Code picks them up immediately. No manual copying.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto mb-16 text-center animate-fade-up">
        <p className="font-display text-aoe-gold-dim tracking-[0.3em] uppercase text-xs mb-6">Age of Empires II</p>
        <h1 className="font-display text-5xl font-bold text-aoe-gold mb-6 leading-tight tracking-wide">
          Sounds for Claude Code
        </h1>
        <hr className="ornament-divider max-w-xs mx-auto" />
        <p className="text-lg text-aoe-parchment/70 mb-10 max-w-xl mx-auto font-body leading-relaxed">
          2,700+ voice lines from 46 civilizations. Browse, preview, and wire them up as terminal notifications.
          Save to <code className="text-aoe-gold bg-aoe-stone px-1.5 py-0.5 rounded text-sm font-mono">.claude/sounds</code> and they'll play automatically.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => onNavigate('recommended')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-gradient-to-b from-aoe-gold/25 to-aoe-gold/10 text-aoe-gold hover:from-aoe-gold/35 hover:to-aoe-gold/20 transition-all text-lg font-display tracking-wide border border-aoe-gold/20 hover:border-aoe-gold/40 animate-glow"
          >
            Get Started
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button
            onClick={handleOneClickSetup}
            disabled={isSettingUp}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-lg font-display tracking-wide border border-green-500/20 hover:border-green-500/30 disabled:opacity-50"
          >
            {isSettingUp ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {currentStep === 'hooks' && 'Setting up hooks...'}
                {currentStep === 'sounds' && 'Downloading sounds...'}
                {currentStep === 'listener' && 'Setting up listener...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                One-Click Setup
              </>
            )}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentStep === 'hooks' ? 'bg-aoe-gold animate-pulse' :
              hooksStatus?.allConfigured ? 'bg-green-400' : 'bg-aoe-stone-light'
            }`} />
            <span className="text-sm text-aoe-parchment/50 font-body">Hooks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentStep === 'sounds' ? 'bg-aoe-gold animate-pulse' :
              soundsStatus?.configured ? 'bg-green-400' : 'bg-aoe-stone-light'
            }`} />
            <span className="text-sm text-aoe-parchment/50 font-body">Sounds</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              currentStep === 'listener' ? 'bg-aoe-gold animate-pulse' :
              listenerStatus?.scriptInstalled ? 'bg-green-400' : 'bg-aoe-stone-light'
            }`} />
            <span className="text-sm text-aoe-parchment/50 font-body">Listener</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              listenerStatus?.inShellConfig ? 'bg-green-400' : 'bg-aoe-stone-light'
            }`} />
            <span className="text-sm text-aoe-parchment/50 font-body">
              {listenerStatus?.shellConfigs?.zshrc ? '.zshrc' :
               listenerStatus?.shellConfigs?.bashrc ? '.bashrc' :
               listenerStatus?.shellConfigs?.bash_profile ? '.bash_profile' :
               'Shell'}
            </span>
          </div>
          {listenerStatus?.scriptInstalled && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-aoe-gold/10">
              <button
                onClick={handleToggleSounds}
                disabled={isToggling}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  listenerStatus?.running ? 'bg-green-500' : 'bg-aoe-stone-light'
                } ${isToggling ? 'opacity-50' : ''}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    listenerStatus?.running ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
              <span className="text-sm text-aoe-parchment/50 font-body">
                {isToggling ? 'Toggling...' : listenerStatus?.running ? 'On' : 'Off'}
              </span>
            </div>
          )}
        </div>
        {setupResult && (
          <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-body ${
            setupResult.success ? 'bg-green-800/30 text-green-200 border border-green-700/30' : 'bg-red-800/30 text-red-200 border border-red-700/30'
          }`}>
            {setupResult.message || setupResult.error}
          </div>
        )}
      </div>

      {/* Feature Cards Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="card-hover bg-gradient-to-b from-aoe-stone/60 to-aoe-stone/30 border border-aoe-gold/8 rounded-xl p-6 group"
          >
            <div className="w-11 h-11 rounded-lg bg-aoe-gold/10 flex items-center justify-center mb-4 text-aoe-gold group-hover:bg-aoe-gold/20 transition-colors">
              {feature.icon}
            </div>
            <h3 className="font-display text-base font-semibold text-aoe-parchment-light mb-2 tracking-wide">
              {feature.title}
            </h3>
            <p className="text-aoe-parchment/50 text-sm leading-relaxed font-body">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
