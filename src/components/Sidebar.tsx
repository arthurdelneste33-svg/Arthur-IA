import React from 'react';
import { 
  MessageSquare, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Sparkles, 
  Zap, 
  Cpu, 
  ShieldCheck,
  Radio,
  X,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType, ThinkingMode, AccentColorType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  thinkingMode: ThinkingMode;
  accentColor: AccentColorType;
  systemStatus: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  thinkingMode,
  accentColor,
  systemStatus,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const getAccentClass = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'amber': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cyan': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default: return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
    }
  };

  const getActiveIndicatorColor = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-500';
      case 'cyan': return 'bg-cyan-500';
      default: return 'bg-violet-500';
    }
  };

  const navItems: Array<{ id: TabType; label: string; icon: React.FC<{ className?: string }>; desc: string }> = [
    { id: 'chat', label: 'Arthur Chat', icon: MessageSquare, desc: 'Conversation & Réflexion' },
    { id: 'audio', label: 'Studio Audio', icon: Music, desc: 'Générateur Musical' },
    { id: 'images', label: 'Studio Images', icon: ImageIcon, desc: 'Génération Visuelle HD' },
    { id: 'documents', label: 'Documents IA', icon: FileText, desc: 'Synthèse & Analyse' },
    { id: 'settings', label: 'Paramètres & Logs', icon: Settings, desc: 'Système & Diagnostics' },
  ];

  const getModeBadge = () => {
    switch (thinkingMode) {
      case 'fast':
        return { 
          label: 'Rapide', 
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-700/50 shadow-sm shadow-cyan-950/40', 
          icon: Zap 
        };
      case 'advanced':
        return { 
          label: 'Réflexion Avancée', 
          color: 'text-amber-400 bg-amber-950/40 border-amber-600/50 shadow-sm shadow-amber-950/40 ring-1 ring-amber-500/20', 
          icon: Brain 
        };
      default:
        return { 
          label: 'Normal', 
          color: 'text-violet-400 bg-violet-950/40 border-violet-700/50 shadow-sm shadow-violet-950/40', 
          icon: Sparkles 
        };
    }
  };

  const modeBadge = getModeBadge();
  const ModeIcon = modeBadge.icon;

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none bg-[#090e18]/80 backdrop-blur-xl border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900 text-white shadow-xl shadow-violet-950/60 border border-violet-400/30">
            <Sparkles className="w-5 h-5 text-violet-200 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">Arthur IA</h1>
              <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/20 to-violet-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                v0.1 STABLE ALPHA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Par Arthur Delneste</p>
          </div>
        </div>

        {/* Close Button on Mobile */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Status Pill */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ModeIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Mode actif :</span>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${modeBadge.color}`}>
            {modeBadge.label}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Espace de Travail
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <motion.button
              key={item.id}
              id={`nav-btn-${item.id}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-150 relative group ${
                isActive
                  ? `${getAccentClass()} border shadow-md backdrop-blur-sm`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-slate-900/80' : 'group-hover:bg-slate-800/70'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-inherit' : 'text-slate-400 group-hover:text-slate-200'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight truncate">{item.label}</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-400 truncate">{item.desc}</div>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className={`w-1.5 h-6 rounded-full ${getActiveIndicatorColor()}`} 
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer Info & System Status */}
      <div className="p-4 border-t border-slate-800/70 bg-slate-950/40 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium">Noyau IA</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
            {systemStatus}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" /> Modèle IA
          </span>
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">Arthur IA 0.1 Stable Alpha</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        id="sidebar-nav" 
        className="hidden md:flex w-72 h-screen select-none shrink-0 z-20"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Slide-out Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs h-full shadow-2xl z-10 flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
