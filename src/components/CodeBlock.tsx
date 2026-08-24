import React, { useState } from 'react';
import { Copy, Check, Code, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value?: string;
  code?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, code }) => {
  const [copied, setCopied] = useState(false);
  const textContent = code || value || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectedLang = language || 'code';

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-750/90 bg-[#070b13] shadow-xl font-mono text-xs ring-1 ring-white/5">
      {/* Code Header Bar */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider pl-2 flex items-center gap-1">
            {detectedLang === 'bash' || detectedLang === 'sh' ? (
              <Terminal className="w-3 h-3 text-cyan-400" />
            ) : (
              <Code className="w-3 h-3 text-violet-400" />
            )}
            <span className="text-slate-300">{detectedLang}</span>
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all font-sans font-medium text-xs shadow-sm"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier le code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono whitespace-pre select-text">
        <code>{textContent}</code>
      </div>
    </div>
  );
};
