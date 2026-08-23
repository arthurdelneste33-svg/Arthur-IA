import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Trash2, 
  Loader2, 
  Wand2, 
  Maximize2, 
  X, 
  Check, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage, AccentColorType } from '../types';
import { IMAGE_STYLES, SAMPLE_IMAGE_PROMPTS } from '../data/samplePrompts';

interface ImageGeneratorViewProps {
  images: GeneratedImage[];
  onAddImage: (img: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  accentColor: AccentColorType;
}

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
  images,
  onAddImage,
  onDeleteImage,
  accentColor,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Digital Art Cyberpunk');
  const [selectedAspect, setSelectedAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState<GeneratedImage | null>(null);

  const aspects: Array<{ value: '1:1' | '16:9' | '9:16' | '4:3'; label: string; desc: string }> = [
    { value: '1:1', label: '1:1', desc: 'Carré (Avatar / Post)' },
    { value: '16:9', label: '16:9', desc: 'Paysage (Bannière / Fond)' },
    { value: '9:16', label: '9:16', desc: 'Portrait (Story / Mobile)' },
    { value: '4:3', label: '4:3', desc: 'Standard Photo' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedAspect,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la génération d’image');
      }

      const data = await res.json();

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio: selectedAspect,
        quality: 'HD',
        imageUrl: data.imageUrl,
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      onAddImage(newImage);
    } catch (err: any) {
      alert(err.message || 'Impossible de générer l’image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `ArthurIA-Image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAccentBtn = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-500 text-white';
      default: return 'bg-violet-600 hover:bg-violet-500 text-white';
    }
  };

  return (
    <div id="image-generator-view" className="flex-1 overflow-y-auto p-3 sm:p-8 bg-[#0a0f18] space-y-6 sm:space-y-8 pb-28 md:pb-8">
      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-2"
      >
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <ImageIcon className="w-4 h-4" />
          <span>Génération Visuelle Haute Définition</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Studio Graphique & Création Visuelle
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Donnez vie à vos concepts visuels avec les modèles Imagen 3 et flux artistiques personnalisés.
        </p>
      </motion.div>

      {/* Main Generator Form Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-6"
      >
        <form onSubmit={handleGenerate} className="space-y-5 sm:space-y-6">
          {/* Prompt input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description de la Scène
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPrompt = SAMPLE_IMAGE_PROMPTS[Math.floor(Math.random() * SAMPLE_IMAGE_PROMPTS.length)];
                  setPrompt(randomPrompt);
                }}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Idée aléatoire</span>
              </button>
            </div>

            <textarea
              id="image-prompt-input"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Un renard néon mystique dans une forêt bioluminescente, reflets d'eau, rendu 8K hyperdétaillé..."
              className="w-full p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Exemples :</span>
              {SAMPLE_IMAGE_PROMPTS.slice(0, 2).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/60 truncate max-w-[260px] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Style Artistique
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {IMAGE_STYLES.map((st) => {
                const isSelected = selectedStyle === st.name;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{st.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{st.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio & Generate Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Format :</span>
              <div className="flex items-center gap-1.5">
                {aspects.map((asp) => (
                  <button
                    key={asp.value}
                    type="button"
                    onClick={() => setSelectedAspect(asp.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedAspect === asp.value
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {asp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              id="generate-image-btn"
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!prompt.trim() || isGenerating}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-40 shadow-lg min-h-[44px] ${getAccentBtn()}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération HD en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer l’image</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Generated Images Gallery */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            <span>Galerie Graphique ({images.length})</span>
          </h3>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 text-slate-500 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Aucune image générée pour le moment.</p>
            <p className="text-xs text-slate-600">
              Tapez une description de scène ci-dessus pour lancer votre première création visuelle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                id={`img-card-${img.id}`}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/60 transition-all shadow-md"
              >
                {/* Image Display */}
                <div className="aspect-square w-full bg-slate-950 overflow-hidden relative cursor-pointer" onClick={() => setSelectedModalImage(img)}>
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white line-clamp-2">{img.prompt}</span>
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="p-3 bg-slate-900/90 flex items-center justify-between gap-2 border-t border-slate-800/80">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{img.style}</div>
                    <div className="text-[10px] text-slate-500">{img.aspectRatio} • {img.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedModalImage(img)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                      title="Agrandir l'image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(img)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                      title="Télécharger l'image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteImage(img.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedModalImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedModalImage(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h4 className="text-sm font-semibold text-white truncate">{selectedModalImage.prompt}</h4>
                  <p className="text-xs text-slate-400">{selectedModalImage.style} • {selectedModalImage.aspectRatio}</p>
                </div>
                <button
                  onClick={() => setSelectedModalImage(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] flex items-center justify-center bg-black/50 p-2 overflow-hidden">
                <img
                  src={selectedModalImage.imageUrl}
                  alt={selectedModalImage.prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[68vh] max-w-full object-contain rounded-xl"
                />
              </div>
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Généré par Arthur IA</span>
                <button
                  onClick={() => handleDownload(selectedModalImage)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger l’image</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
