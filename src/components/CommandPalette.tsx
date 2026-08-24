import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MessageSquare, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Zap, 
  Sparkles, 
  Brain, 
  Command, 
  Trash2, 
  Download, 
  Volume2, 
  ArrowRight,
  Globe,
  X
} from 'lucide-react';
import { TabType, ThinkingMode } from '../types';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onSelectMode: (mode: ThinkingMode) => void;
  onToggleWebSearch?: () => void;
  onClearHistory?: () => void;
  onClearChat?: () => void;
  onExportChat?: () => void;
  webSearchActive?: boolean;
  currentMode?: ThinkingMode;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen = true,
  onClose,
  onSelectTab,
  onSelectMode,
  onToggleWebSearch,
  onClearHistory,
  onClearChat,
  onExportChat,
  webSearchActive,
  currentMode,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items = [
    {
      id: 'tab-chat',
      title: 'Arthur Chat',
      category: 'Navigation',
      subtitle: 'Ouvrir la vue conversationnelle',
      icon: MessageSquare,
      action: () => { onSelectTab('chat'); onClose(); },
    },
    {
      id: 'tab-audio',
      title: 'Studio Musical',
      category: 'Navigation',
      subtitle: 'Générer des morceaux audio et nappes Lo-Fi / Synthwave',
      icon: Music,
      action: () => { onSelectTab('audio'); onClose(); },
    },
    {
      id: 'tab-images',
      title: 'Studio Images HD',
      category: 'Navigation',
      subtitle: 'Créer des visuels haute définition avec Imagen 3',
      icon: ImageIcon,
      action: () => { onSelectTab('images'); onClose(); },
    },
    {
      id: 'tab-documents',
      title: 'Analyseur de Documents',
      category: 'Navigation',
      subtitle: 'Interroger et synthétiser des fichiers PDF, DOCX, CSV',
      icon: FileText,
      action: () => { onSelectTab('documents'); onClose(); },
    },
    {
      id: 'tab-settings',
      title: 'Paramètres & Audit Système',
      category: 'Navigation',
      subtitle: 'Configurer le thème, la voix et inspecter la santé',
      icon: Settings,
      action: () => { onSelectTab('settings'); onClose(); },
    },
    {
      id: 'mode-fast',
      title: 'Activer Mode Rapide',
      category: 'Modes de Réflexion',
      subtitle: 'Flash Lite — Latence ultra-réduite et concision',
      icon: Zap,
      badge: 'CYAN',
      action: () => { onSelectMode('fast'); onSelectTab('chat'); onClose(); },
    },
    {
      id: 'mode-normal',
      title: 'Activer Mode Normal',
      category: 'Modes de Réflexion',
      subtitle: 'Gemini 3.7 Flash — Équilibre parfait',
      icon: Sparkles,
      badge: 'VIOLET',
      action: () => { onSelectMode('normal'); onSelectTab('chat'); onClose(); },
    },
    {
      id: 'mode-advanced',
      title: 'Activer Mode Réflexion Avancée',
      category: 'Modes de Réflexion',
      subtitle: 'Gemini 3.7 Thinking Pro — Raisonnement logique pas-à-pas',
      icon: Brain,
      badge: 'GOLD',
      action: () => { onSelectMode('advanced'); onSelectTab('chat'); onClose(); },
    },
    ...(onToggleWebSearch ? [{
      id: 'action-web-search',
      title: webSearchActive ? 'Désactiver Recherche Web Google' : 'Activer Recherche Web Google',
      category: 'Actions Rapides',
      subtitle: 'Recherche Google en direct avec sources indexées',
      icon: Globe,
      action: () => { onToggleWebSearch(); onClose(); },
    }] : []),
    ...(onExportChat ? [{
      id: 'action-export',
      title: 'Exporter la discussion',
      category: 'Actions Rapides',
      subtitle: 'Télécharger l’historique en Markdown ou TXT',
      icon: Download,
      action: () => { onExportChat(); onClose(); },
    }] : []),
    ...(onClearHistory || onClearChat ? [{
      id: 'action-clear',
      title: 'Effacer l’historique du chat',
      category: 'Actions Rapides',
      subtitle: 'Remettre à zéro les messages en cours',
      icon: Trash2,
      action: () => {
        if (onClearHistory) onClearHistory();
        else if (onClearChat) onClearChat();
        onClose();
      },
    }] : []),
  ];

  const filteredItems = query.trim()
    ? items.filter((it) =>
        it.title.toLowerCase().includes(query.toLowerCase()) ||
        it.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        it.category.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 backdrop-blur-2xl ring-1 ring-white/10"
          >
            {/* Search Input Bar */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
              <Search className="w-5 h-5 text-violet-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une vue, action ou raccourci (ex: Audio, Mode, Exporter)..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                Échap
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Aucun résultat pour « {query} ».
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full text-left p-3 rounded-xl hover:bg-violet-600/20 border border-transparent hover:border-violet-500/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-800 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white group-hover:text-violet-200 truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-violet-300 transition-opacity shrink-0 ml-2" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Shortcuts */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>Raccourcis :</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                  Ctrl+K
                </kbd>
                <span className="text-slate-500">ou</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                  Cmd+K
                </kbd>
              </span>
              <span className="text-emerald-400 font-medium font-mono">Arthur IA v0.1 STABLE ALPHA</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
