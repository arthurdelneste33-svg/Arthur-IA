import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Trash2, 
  Loader2, 
  Maximize2, 
  Wand2, 
  LayoutGrid, 
  Ratio,
  Columns,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedImage, AccentColorType } from '../types';
import { IMAGE_STYLES, SAMPLE_IMAGE_PROMPTS } from '../data/samplePrompts';
import { ImageCompareModal } from './ImageCompareModal';

interface ImageGeneratorViewProps {
  images: GeneratedImage[];
  onAddImage: (image: GeneratedImage) => void;
  onDeleteImage: (id: string) => void;
  accentColor: AccentColorType;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warn', message: string, title?: string) => void;
}

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
  images,
  onAddImage,
  onDeleteImage,
  accentColor,
  onShowToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photoréaliste HD');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '1:1' | '9:16' | '4:3'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareTargetImage, setCompareTargetImage] = useState<GeneratedImage | null>(null);

  const aspectRatios = [
    { value: '1:1' as const, label: '1:1', desc: 'Carré (Réseaux / Profil)' },
    { value: '16:9' as const, label: '16:9', desc: 'Paysage Panoramique' },
    { value: '9:16' as const, label: '9:16', desc: 'Portrait / Story' },
    { value: '4:3' as const, label: '4:3', desc: 'Standard Photo' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onShowToast?.('warn', 'Veuillez saisir une description pour créer l\'illustration HD.', 'Description Requise');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la génération de l\'image');
      }

      const data = await res.json();

      const newImg: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio: selectedRatio,
        quality: 'Ultra',
        imageUrl: data.imageUrl,
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      onAddImage(newImg);
      onShowToast?.('success', 'Visuel haute définition rendu avec succès !', 'Studio Images');
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Impossible de créer le visuel.', 'Erreur Studio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `ArthurIA-${image.style.replace(/\s+/g, '_')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('info', 'Image PNG enregistrée sur votre appareil.', 'Téléchargement');
  };

  const openCompareModal = (img?: GeneratedImage) => {
    if (images.length < 1) {
      onShowToast?.('warn', 'Générez au moins une image pour utiliser le comparateur.', 'Comparateur');
      return;
    }
    setCompareTargetImage(img || images[0]);
    setCompareModalOpen(true);
  };

  const filteredImages = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return img.prompt.toLowerCase().includes(q) || img.style.toLowerCase().includes(q);
  });

  const getAccentBtn = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40';
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/40';
      default: return 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950/40';
    }
  };

  return (
    <div id="image-generator-view" className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#0a0f18] space-y-5 sm:space-y-7 pb-24 md:pb-8">
      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-1.5 sm:space-y-2"
      >
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <ImageIcon className="w-4 h-4" />
          <span>Studio Visuel & Synthèse Graphique • v0.1 STABLE ALPHA</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
          Générez des visuels ultra-réalistes et créatifs
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Exploitez la puissance d'Arthur IA pour composer des illustrations, photographies et rendus 3D à partir de prompts détaillés.
        </p>
      </motion.div>

      {/* Main Generator Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 sm:p-6 shadow-xl space-y-5 sm:space-y-6 backdrop-blur-xl ring-1 ring-white/5"
      >
        <form onSubmit={handleGenerate} className="space-y-4 sm:space-y-6">
          {/* Prompt input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description Textuelle du Visuel (Prompt)
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPrompt = SAMPLE_IMAGE_PROMPTS[Math.floor(Math.random() * SAMPLE_IMAGE_PROMPTS.length)];
                  setPrompt(randomPrompt);
                }}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors p-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Idée créative aléatoire</span>
              </button>
            </div>

            <textarea
              id="image-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Une métropole futuriste baignée par les lumières dorées du crépuscule, reflets sur l'eau, architecture organique hyper-détaillée 8K..."
              className="w-full p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none transition-all min-h-[80px]"
            />

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Suggestions :</span>
              {SAMPLE_IMAGE_PROMPTS.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/60 truncate max-w-[220px] sm:max-w-[260px] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Style Artistique & Rendu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {IMAGE_STYLES.map((st) => {
                const isSelected = selectedStyle === st.name;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.name)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-h-[56px] ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm ring-1 ring-violet-500/30'
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

          {/* Ratio Selector & Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <Ratio className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">Format :</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {aspectRatios.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRatio(r.value)}
                    className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium border transition-all ${
                      selectedRatio === r.value
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
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
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all disabled:opacity-40 shadow-lg min-h-[44px] ${getAccentBtn()}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendu graphique en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer l'illustration HD</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Gallery Section */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-violet-400" />
            <span>Galerie & Historique Graphique ({filteredImages.length})</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par mot-clé..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 w-44 sm:w-56"
              />
            </div>

            {/* Compare Button */}
            {images.length > 1 && (
              <button
                onClick={() => openCompareModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-violet-300 font-medium transition-all"
              >
                <Columns className="w-3.5 h-3.5 text-violet-400" />
                <span>Comparateur</span>
              </button>
            )}
          </div>
        </div>

        {/* Skeleton Loader during Generation */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-video max-h-[300px] w-full rounded-2xl border border-violet-500/40 bg-slate-900/90 shadow-2xl p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-600/30 flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-slate-200 animate-pulse">
              Génération du rendu en haute résolution...
            </p>
            <p className="text-[11px] text-slate-500">
              Style appliqué : {selectedStyle} • Format : {selectedRatio}
            </p>
          </motion.div>
        )}

        {images.length === 0 && !isGenerating ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 text-slate-500 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Aucun visuel généré dans cette session.</p>
            <p className="text-xs text-slate-600">
              Entrez un prompt ci-dessus pour donner vie à vos créations visuelles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                id={`image-card-${image.id}`}
                className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-lg hover:border-violet-500/50 hover:shadow-violet-950/30 transition-all flex flex-col"
              >
                {/* Image Box */}
                <div 
                  onClick={() => setPreviewImage(image)}
                  className="relative aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/10">
                      {image.style}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-violet-300 font-mono text-[10px] border border-white/10">
                      {image.aspectRatio}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                      className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-lg"
                      title="Agrandir"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    {images.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCompareModal(image);
                        }}
                        className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-lg"
                        title="Comparer"
                      >
                        <Columns className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                      className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-lg"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {image.prompt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                    <span>{image.createdAt}</span>
                    <button
                      onClick={() => onDeleteImage(image.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
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

      {/* Lightbox / Fullscreen Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 text-xs font-mono">
                    {previewImage.style}
                  </span>
                  <span className="text-xs text-slate-400">Rendu Arthur IA 1.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewImage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger HD</span>
                  </button>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
                <img
                  src={previewImage.imageUrl}
                  alt={previewImage.prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>

              <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-white">Prompt : </span>
                {previewImage.prompt}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {compareModalOpen && (
          <ImageCompareModal
            images={images}
            initialImage={compareTargetImage}
            onClose={() => setCompareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
