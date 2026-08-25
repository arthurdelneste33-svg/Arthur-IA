import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Copy, 
  Sparkles,
  Timer,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThinkingMode } from '../types';

interface ThinkingVisualizerProps {
  thinkingText: string;
  defaultExpanded?: boolean;
  modelUsed?: string;
  isStreaming?: boolean;
  mode?: ThinkingMode;
  thinkingDurationMs?: number;
}

export const ThinkingVisualizer: React.FC<ThinkingVisualizerProps> = ({
  thinkingText,
  defaultExpanded = false,
  modelUsed,
  isStreaming = false,
  mode = 'normal',
  thinkingDurationMs,
}) => {
  const [isOpen, setIsOpen] = useState(isStreaming || defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [elapsedStreamSeconds, setElapsedStreamSeconds] = useState(0);

  // Live timer while streaming
  useEffect(() => {
    if (!isStreaming) return;
    setIsOpen(true);
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedStreamSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Keep open when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  // Parse structured phases cleanly
  const sections = thinkingText
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const phases = sections.map((sec, i) => {
    const lines = sec.split('\n');
    const header = lines[0].replace(/^[#\-*\[\]0-9.: ]+/g, '').trim();
    const content = lines.slice(1).join('\n').trim() || sec;
    return {
      id: i + 1,
      title: header.length > 70 || header.length === 0 ? `Étape ${i + 1} • Analyse` : header,
      content,
    };
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(thinkingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDuration = isStreaming 
    ? `${elapsedStreamSeconds.toFixed(1)}s` 
    : thinkingDurationMs
    ? `${(thinkingDurationMs / 1000).toFixed(2)}s`
    : mode === 'advanced'
    ? '2.1s'
    : '0.8s';

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl overflow-hidden text-left mb-3 transition-all border ${
        isStreaming
          ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm shadow-indigo-950/30'
          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between transition-colors text-xs group cursor-pointer hover:bg-slate-800/40"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Subtle status dot / icon */}
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 shrink-0">
            {isStreaming ? (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-300" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-200 group-hover:text-white transition-colors text-xs">
              {isStreaming ? 'Réflexion en cours…' : 'Processus de réflexion'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
              <Timer className="w-2.5 h-2.5 text-slate-400" />
              <span>{formattedDuration}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 group-hover:text-slate-300 hidden sm:inline transition-colors">
            {isOpen ? 'Masquer' : 'Afficher'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-slate-400 group-hover:text-slate-200"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Thinking Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-t border-slate-800/80 bg-slate-950/60"
          >
            <div className="p-3.5 space-y-2.5 text-xs">
              {phases.length > 0 ? (
                phases.map((phase, idx) => {
                  const isLatestPhase = idx === phases.length - 1;
                  return (
                    <div
                      key={phase.id}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        isStreaming && isLatestPhase
                          ? 'bg-slate-900/80 border-indigo-500/30'
                          : 'bg-slate-900/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-indigo-400">
                          {isStreaming && isLatestPhase ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-200 text-[11px] truncate">
                          {phase.title}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap pl-5 border-l border-slate-800/80">
                        {phase.content}
                        {isStreaming && isLatestPhase && (
                          <span className="inline-block w-1 h-3 bg-indigo-400 animate-pulse ml-1 align-middle" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {thinkingText || 'Initialisation de la réflexion...'}
                  {isStreaming && (
                    <span className="inline-block w-1 h-3 bg-indigo-400 animate-pulse ml-1 align-middle" />
                  )}
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-3.5 py-2 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px] text-slate-400">
                {isStreaming ? 'Raisonnement en temps réel' : 'Raisonnement terminé'}
              </span>
              {!isStreaming && thinkingText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors text-[10px] cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copied ? 'Copié' : 'Copier'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
