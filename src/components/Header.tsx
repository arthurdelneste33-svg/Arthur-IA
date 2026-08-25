import React from 'react';
import { 
  Zap, 
  Sparkles, 
  Brain, 
  Globe, 
  MapPin,
  Menu,
  CheckCircle2,
  Command,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, ThinkingMode, AccentColorType } from '../types';

interface HeaderProps {
  currentTab: TabType;
  thinkingMode: ThinkingMode;
  onModeChange: (mode: ThinkingMode) => void;
  accentColor: AccentColorType;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  useMaps?: boolean;
  onToggleMaps?: () => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
  systemHealthy: boolean;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  thinkingMode,
  onModeChange,
  accentColor,
  webSearch,
  onToggleWebSearch,
  useMaps = false,
  onToggleMaps,
  onOpenSettings,
  onToggleMobileMenu,
  systemHealthy,
  onOpenCommandPalette,
}) => {
  const getTabDetails = () => {
    switch (currentTab) {
      case 'chat':
        return {
          title: 'Arthur Chat',
          subtitle: 'Assistant conversationnel & réflexion cognitive multi-niveaux',
        };
      case 'video':
        return {
          title: 'Studio Vidéo Veo 3',
          subtitle: 'Génération de vidéos cinématiques 16:9 / 9:16 & animation de photos',
        };
      case 'audio':
        return {
          title: 'Studio Audio & Voix',
          subtitle: 'Compositions musicales Lyria 3 & transcription audio',
        };
      case 'images':
        return {
          title: 'Studio Images HD',
          subtitle: 'Création visuelle, styles artistiques & retouche d\'images',
        };
      case 'settings':
        return {
          title: 'Paramètres & Surveillance',
          subtitle: 'Configuration, audit système & voix de synthèse',
        };
    }
  };

  const getModeActiveClass = (mode: ThinkingMode) => {
    if (thinkingMode !== mode) {
      return 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
    }
    switch (mode) {
      case 'fast':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/50 font-semibold border border-cyan-400/40';
      case 'advanced':
        return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/50 font-semibold border border-amber-400/40 ring-1 ring-amber-400/30';
      default:
        return 'bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#db2777] text-white shadow-md shadow-indigo-950/60 font-semibold border border-white/20';
    }
  };

  const tabInfo = getTabDetails();

  return (
    <header 
      id="app-header" 
      className="h-16 px-2.5 sm:px-4 md:px-6 bg-[#090e18]/85 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-10 shrink-0 select-none shadow-md gap-2"
    >
      {/* Left: Mobile Drawer Trigger + Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Ouvrir le menu"
          className="md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {tabInfo.title}
            </h2>
            {systemHealthy && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Opérationnel</span>
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 hidden lg:block truncate">{tabInfo.subtitle}</p>
        </div>
      </div>

      {/* Right Controls: Command Palette, Web Search & Reflection Mode Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
        {/* Quick Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            id="open-cmd-palette-btn"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-all shadow-xs"
            title="Ouvrir la palette de commandes (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="font-medium text-slate-300 hidden md:inline">Recherche</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Google Grounding Toggles (Search & Maps) */}
        {currentTab === 'chat' && (
          <div className="flex items-center gap-1.5">
            {/* Web Search Grounding */}
            <motion.button
              id="toggle-web-search"
              whileTap={{ scale: 0.95 }}
              onClick={onToggleWebSearch}
              title={webSearch ? 'Recherche Web Google active' : 'Activer la recherche Web en direct'}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 ${
                webSearch
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-sm shadow-blue-950/30'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 shrink-0 ${webSearch ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Google Web</span>
            </motion.button>

            {/* Google Maps Grounding */}
            {onToggleMaps && (
              <motion.button
                id="toggle-maps-grounding"
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMaps}
                title={useMaps ? 'Ancrage Google Maps actif' : 'Activer la recherche de lieux Google Maps'}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 ${
                  useMaps
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950/30'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${useMaps ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Maps</span>
              </motion.button>
            )}
          </div>
        )}

        {/* 3 Reflection Modes Segmented Control */}
        <div className="flex items-center bg-slate-950/90 p-0.5 sm:p-1 rounded-xl border border-slate-800/80 text-xs backdrop-blur-md shadow-inner">
          {/* Mode Rapide - Cyan/Blue */}
          <button
            id="mode-btn-fast"
            onClick={() => onModeChange('fast')}
            className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all border border-transparent min-h-[32px] ${getModeActiveClass('fast')}`}
            title="Mode Rapide : Flash Lite, réponses instantanées"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Rapide</span>
          </button>

          {/* Mode Normal - Violet */}
          <button
            id="mode-btn-normal"
            onClick={() => onModeChange('normal')}
            className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all border border-transparent min-h-[32px] ${getModeActiveClass('normal')}`}
            title="Mode Normal : Flash 3.7, équilibre parfait"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Normal</span>
          </button>

          {/* Mode Réflexion Avancée - Gold/Amber */}
          <button
            id="mode-btn-advanced"
            onClick={() => onModeChange('advanced')}
            className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all border border-transparent min-h-[32px] ${getModeActiveClass('advanced')}`}
            title="Mode Réflexion Avancée : Thinking 3.7, raisonnement étape par étape"
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Réflexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};
