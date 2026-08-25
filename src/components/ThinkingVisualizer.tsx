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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl overflow-hidden text-left mb-3 transition-all duration-200 border ${
        isStreaming
          ? 'bg-slate-950/90 border-indigo-500/50 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/20'
          : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700/90'
      }`}
    >
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between transition-colors text-xs group cursor-pointer hover:bg-slate-800/40 active:bg-slate-800/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Subtle status dot / icon */}
          <div className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors shrink-0 ${
            isStreaming 
              ? 'bg-indigo-950 border border-indigo-400/40 text-indigo-300 shadow-xs shadow-indigo-500/20' 
              : 'bg-slate-800/80 border border-slate-700/60 text-indigo-300'
          }`}>
            {isStreaming ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
              </span>
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-300" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-200 group-hover:text-white transition-colors text-xs tracking-tight">
              {isStreaming ? 'Raisonnement en cours…' : 'Processus de réflexion analytique'}
            </span>

            <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800/80">
              <Timer className="w-2.5 h-2.5 text-indigo-400" />
              <span>{formattedDuration}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 group-hover:text-slate-300 hidden sm:inline transition-colors">
            {isOpen ? 'Masquer' : 'Déplier'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="text-slate-400 group-hover:text-slate-200"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Thinking Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-slate-800/80 bg-slate-950/70"
          >
            <div className="p-3.5 space-y-2.5 text-xs">
              {phases.length > 0 ? (
                phases.map((phase, idx) => {
                  const isLatestPhase = idx === phases.length - 1;
                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={`p-2.5 rounded-lg border text-xs transition-colors duration-150 ${
                        isStreaming && isLatestPhase
                          ? 'bg-indigo-950/30 border-indigo-500/40 shadow-xs'
                          : 'bg-slate-900/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-indigo-400">
                          {isStreaming && isLatestPhase ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-200 text-[11.5px] truncate">
                          {phase.title}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap pl-5 border-l border-slate-800/90 font-mono">
                        {phase.content}
                        {isStreaming && isLatestPhase && (
                          <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-1 align-middle rounded-xs" />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
                  {thinkingText || 'Initialisation de la matrice réflexive...'}
                  {isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-1 align-middle rounded-xs" />
                  )}
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-3.5 py-2 bg-slate-900/70 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
                {isStreaming ? 'Raisonnement en cours' : 'Raisonnement validé'}
              </span>
              {!isStreaming && thinkingText && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors text-[10.5px] cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copied ? 'Copié' : 'Copier la réflexion'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
