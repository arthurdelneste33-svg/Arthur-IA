import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss?: (id: string) => void;
  onCloseToast?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onCloseToast }) => {
  const handleClose = (id: string) => {
    if (onDismiss) onDismiss(id);
    if (onCloseToast) onCloseToast(id);
  };
  return (
    <div
      aria-live="polite"
      className="fixed bottom-16 md:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarn = toast.type === 'warn';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
                isError
                  ? 'bg-rose-950/90 border-rose-600/50 text-rose-100 shadow-rose-950/50 ring-1 ring-rose-500/30'
                  : isSuccess
                  ? 'bg-emerald-950/90 border-emerald-600/50 text-emerald-100 shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                  : isWarn
                  ? 'bg-amber-950/90 border-amber-600/50 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/95 border-violet-500/40 text-slate-100 shadow-violet-950/50 ring-1 ring-white/10'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isError && !isSuccess && !isWarn && <Info className="w-5 h-5 text-violet-400" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h5 className="text-xs font-bold tracking-tight mb-0.5 text-white">
                    {toast.title}
                  </h5>
                )}
                <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleClose(toast.id)}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
