import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Columns, SplitSquareVertical, Download, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageCompareModalProps {
  images: GeneratedImage[];
  initialImage?: GeneratedImage | null;
  onClose: () => void;
}

export const ImageCompareModal: React.FC<ImageCompareModalProps> = ({
  images,
  initialImage,
  onClose,
}) => {
  const [leftId, setLeftId] = useState<string>(initialImage?.id || (images[0]?.id ?? ''));
  const [rightId, setRightId] = useState<string>(
    images.length > 1 ? (images[1]?.id !== leftId ? images[1]?.id : images[0]?.id) : leftId
  );
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('side-by-side');

  const leftImg = images.find((i) => i.id === leftId) || images[0];
  const rightImg = images.find((i) => i.id === rightId) || images[1] || images[0];

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `ArthurIA-${img.style.replace(/\s+/g, '_')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-5xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Comparateur de Visuels HD</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-700/50 font-mono">
                  Avant / Après
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Comparez les détails graphiques, ambiances et styles de vos créations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'side-by-side'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Côte à côte
              </button>
              <button
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'slider'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Curseur Split
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-violet-400">Image A :</span>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 focus:outline-none focus:border-violet-500"
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.style} — {img.prompt.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400">Image B :</span>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 focus:outline-none focus:border-cyan-500"
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.style} — {img.prompt.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Stage */}
        <div className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full max-h-[55vh]">
              {/* Left Image */}
              <div className="relative rounded-2xl overflow-hidden border border-violet-500/40 bg-slate-950 flex flex-col">
                <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-semibold text-violet-300 border border-violet-500/30">
                  Image A: {leftImg?.style}
                </div>
                <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                  {leftImg && (
                    <img
                      src={leftImg.imageUrl}
                      alt={leftImg.prompt}
                      referrerPolicy="no-referrer"
                      className="max-h-[45vh] w-full object-contain rounded-xl"
                    />
                  )}
                </div>
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                  <p className="text-slate-300 truncate max-w-[200px]">{leftImg?.prompt}</p>
                  {leftImg && (
                    <button
                      onClick={() => handleDownload(leftImg)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      title="Télécharger"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Image */}
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 flex flex-col">
                <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-semibold text-cyan-300 border border-cyan-500/30">
                  Image B: {rightImg?.style}
                </div>
                <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                  {rightImg && (
                    <img
                      src={rightImg.imageUrl}
                      alt={rightImg.prompt}
                      referrerPolicy="no-referrer"
                      className="max-h-[45vh] w-full object-contain rounded-xl"
                    />
                  )}
                </div>
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                  <p className="text-slate-300 truncate max-w-[200px]">{rightImg?.prompt}</p>
                  {rightImg && (
                    <button
                      onClick={() => handleDownload(rightImg)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      title="Télécharger"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Slider Compare */
            <div className="relative w-full max-w-2xl aspect-square max-h-[55vh] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 select-none">
              {/* Right image in background */}
              {rightImg && (
                <img
                  src={rightImg.imageUrl}
                  alt={rightImg.prompt}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Left image overlay with clip path */}
              {leftImg && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={leftImg.imageUrl}
                    alt={leftImg.prompt}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}

              {/* Split Line Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-lg">
                  ⟷
                </div>
              </div>

              {/* Input range overlay */}
              <input
                type="range"
                min={0}
                max={100}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-black/70 text-violet-300 text-[10px] font-bold">
                Image A ({sliderPos}%)
              </div>
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-black/70 text-cyan-300 text-[10px] font-bold">
                Image B ({100 - sliderPos}%)
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
