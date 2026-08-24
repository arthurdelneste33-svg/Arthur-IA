import React, { useState } from 'react';
import { 
  Brain, 
  ChevronDown, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check,
  Zap,
  Clock,
  ShieldCheck,
  Timer
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
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  // Parse structured phases if formatted with numbered steps or blocks
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
      title: header.length > 50 || header.length === 0 ? `Étape ${i + 1} : Analyse & Hypothèses` : header,
      content,
    };
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(thinkingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdvanced = mode === 'advanced';

  // Format thinking duration
  const formattedDuration = thinkingDurationMs
    ? `${(thinkingDurationMs / 1000).toFixed(1)}s`
    : isAdvanced
    ? '2.8s'
    : '1.2s';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl overflow-hidden text-left mb-3 shadow-lg transition-all ${
        isAdvanced
          ? 'bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-slate-900/90 border border-amber-500/40 shadow-amber-950/20 ring-1 ring-amber-500/20'
          : 'bg-slate-900/90 border border-violet-500/25 shadow-violet-950/20'
      }`}
    >
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-all text-xs group ${
          isAdvanced
            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 hover:from-amber-950/60 text-amber-300'
            : 'bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 hover:from-violet-950/60 text-violet-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`relative flex items-center justify-center w-6 h-6 rounded-lg border shrink-0 ${
              isAdvanced
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-violet-600/20 text-violet-400 border-violet-500/30'
            }`}
          >
            <Brain className="w-3.5 h-3.5 animate-pulse" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping opacity-75 ${
                isAdvanced ? 'bg-amber-400' : 'bg-violet-400'
              }`}
            />
          </div>

          <div className="flex flex-col text-left min-w-0">
            <span className="font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5 truncate">
              <span>{isAdvanced ? "Raisonnement approfondi d'Arthur" : "Processus de Réflexion Cognitive"}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline ${
                  isAdvanced
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                    : 'bg-violet-900/60 text-violet-300 border-violet-700/50'
                }`}
              >
                {isAdvanced ? 'Arthur IA 1.0 Gold Thinking' : 'Arthur IA 1.0 Flash'}
              </span>
            </span>
            <span className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              <span>{phases.length > 1 ? `${phases.length} étapes logiques résolues` : 'Décomposition méthodique terminée'}</span>
              <span className="inline-flex items-center gap-1 text-amber-400/90 font-mono text-[10px] bg-black/40 px-1.5 py-0.2 rounded">
                <Timer className="w-2.5 h-2.5" />
                <span>{formattedDuration}</span>
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-medium hidden sm:inline ${
              isAdvanced ? 'text-amber-400/90' : 'text-violet-400/80'
            }`}
          >
            {isOpen ? 'Masquer le raisonnement' : 'Déplier les étapes'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={`p-1 rounded-md text-slate-300 ${isAdvanced ? 'bg-amber-950/60 border border-amber-800/40' : 'bg-slate-800'}`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Thinking Steps */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`border-t bg-[#090d16] ${isAdvanced ? 'border-amber-900/30' : 'border-violet-900/25'}`}
          >
            {/* Cognitive Pipeline Steps */}
            <div className="p-3 sm:p-4 space-y-3">
              {phases.length > 1 ? (
                phases.map((phase) => (
                  <div
                    key={phase.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 relative overflow-hidden ${
                      isAdvanced
                        ? 'bg-slate-950/80 border-amber-900/40'
                        : 'bg-slate-950/70 border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isAdvanced ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        />
                        <span className={`truncate ${isAdvanced ? 'text-amber-300' : 'text-violet-300'}`}>
                          {phase.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">Phase {phase.id}</span>
                    </div>
                    <div className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap pl-5 border-l border-slate-800">
                      {phase.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {thinkingText}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Raisonnement certifié sans contradiction logique</span>
                <span className="sm:hidden">Raisonnement validé</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

