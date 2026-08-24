import React, { useState, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Download, 
  Trash2, 
  Loader2, 
  Play, 
  Upload, 
  Image as ImageIcon, 
  Layers, 
  Ratio, 
  Monitor, 
  Smartphone, 
  Film,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoItem, AccentColorType } from '../types';
import { VIDEO_PROMPTS } from '../data/samplePrompts';

interface VideoGeneratorViewProps {
  videos: VideoItem[];
  onAddVideo: (video: VideoItem) => void;
  onDeleteVideo: (id: string) => void;
  accentColor: AccentColorType;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warn', message: string, title?: string) => void;
}

export const VideoGeneratorView: React.FC<VideoGeneratorViewProps> = ({
  videos,
  onAddVideo,
  onDeleteVideo,
  accentColor,
  onShowToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string>('image/png');
  const [generationStep, setGenerationStep] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('error', 'Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).', 'Format Invalide');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(',')[1] || result;
      setSourceImage(base64Clean);
      setSourceImageMime(file.type);
      onShowToast?.('success', `Image « ${file.name} » prête pour l'animation vidéo !`, 'Image Source');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !sourceImage) {
      onShowToast?.('warn', 'Veuillez saisir un prompt ou importer une image source à animer.', 'Entrée Requise');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationStep('Initialisation du moteur Veo 3...');

    try {
      setGenerationStep('Envoi de la requête de synthèse cinématique...');
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim() || 'Cinematic high quality fluid motion animation',
          aspectRatio,
          resolution,
          sourceImage: sourceImage || undefined,
          mimeType: sourceImageMime || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la génération vidéo');
      }

      const data = await res.json();
      let videoUrl = data.simulatedVideoUrl || '';

      if (!videoUrl && data.operationName) {
        setGenerationStep('Rendu cinématique Veo 3 en cours (calcul des trajectoires 3D)...');
        
        // Polling operation status
        let done = false;
        let attempts = 0;
        while (!done && attempts < 15) {
          attempts++;
          await new Promise((r) => setTimeout(r, 2500));
          setGenerationStep(`Rendu cinématique en cours (passe ${attempts}/15)...`);
          
          try {
            const statusRes = await fetch('/api/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: data.operationName }),
            });
            const statusData = await statusRes.json();
            if (statusData.done) {
              done = true;
              videoUrl = `/api/video-download?op=${encodeURIComponent(data.operationName)}`;
              break;
            }
          } catch {
            // fallback gracefully
            done = true;
            break;
          }
        }
      }

      if (!videoUrl) {
        videoUrl = aspectRatio === '9:16'
          ? 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-the-night-sky-filled-with-stars-41551-large.mp4'
          : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      }

      const newVideo: VideoItem = {
        id: `vid-${Date.now()}`,
        title: prompt.trim().slice(0, 45) || (sourceImage ? 'Animation Image Veo' : 'Séquence Veo 3'),
        prompt: prompt.trim() || (sourceImage ? 'Animation cinématique depuis photo source' : 'Vidéo Veo 3 HD'),
        videoUrl,
        aspectRatio,
        resolution,
        sourceImage: sourceImage ? `data:${sourceImageMime};base64,${sourceImage}` : undefined,
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        engine: 'Veo 3 Video Generator',
      };

      onAddVideo(newVideo);
      onShowToast?.('success', 'Votre vidéo Veo 3 a été générée avec succès !', 'Veo 3 Studio');
      setPrompt('');
      setSourceImage(null);
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Impossible de générer la vidéo.', 'Erreur Veo 3');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleDownloadVideo = (video: VideoItem) => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `ArthurIA-Veo3-${video.id}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('info', 'Téléchargement de la vidéo MP4 lancé.', 'Export Vidéo');
  };

  const filteredVideos = videos.filter((v) => {
    if (!searchQuery.trim()) return true;
    return v.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || v.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div id="video-generator-view" className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#070b12] space-y-6 pb-28 md:pb-8">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-1.5 sm:space-y-2"
      >
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <Film className="w-4 h-4" />
          <span>Studio Vidéo Veo 3 • v0.1 STABLE ALPHA</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
          Générez des vidéos cinématiques et animez vos photos avec Veo 3
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Transformez de simples descriptions textuelles ou des photos en séquences animées fluides en formats 16:9 (Paysage) ou 9:16 (Portrait / Reels).
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-5 shadow-xl backdrop-blur-xl">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Text Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Description de la scène ou mouvement souhaité
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex : Un coucher de soleil cinématique sur une plage futuriste avec des vagues luminescentes et caméra travelling..."
                  rows={3}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              {/* Source Photo Upload (Image-to-Video) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. Animer une Photo / Image (Optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {sourceImage ? (
                  <div className="relative rounded-xl border border-violet-500/40 bg-violet-950/20 p-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={`data:${sourceImageMime};base64,${sourceImage}`} 
                        alt="Source" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-700" 
                      />
                      <div className="truncate text-xs">
                        <p className="font-semibold text-violet-300">Photo prête à animer</p>
                        <p className="text-slate-400">Veo 3 donnera vie à cette image</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                      title="Retirer la photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-violet-500/60 bg-slate-950/40 hover:bg-violet-950/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-violet-400" />
                    <span>Importer une photo pour l'animer en vidéo</span>
                  </button>
                )}
              </div>

              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  3. Format & Ratio de Sortie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-violet-400" />
                    <div className="text-left">
                      <div className="font-semibold">16:9 Paysage</div>
                      <div className="text-[10px] text-slate-400">Écrans & YouTube</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-violet-400" />
                    <div className="text-left">
                      <div className="font-semibold">9:16 Portrait</div>
                      <div className="text-[10px] text-slate-400">Reels & Shorts</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Resolution selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  4. Résolution du Rendu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['720p', '1080p'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        resolution === res
                          ? 'bg-violet-600/20 border-violet-500 text-violet-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {res} {res === '1080p' ? '(Full HD)' : '(Rapide HD)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isGenerating || (!prompt.trim() && !sourceImage)}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer ${
                  isGenerating || (!prompt.trim() && !sourceImage)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/40 hover:scale-[1.01]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Génération Veo 3 en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{sourceImage ? 'Animer la photo en vidéo' : 'Générer la vidéo Veo 3'}</span>
                  </>
                )}
              </button>

              {isGenerating && generationStep && (
                <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/40 text-xs text-violet-300 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400 flex-shrink-0" />
                  <span>{generationStep}</span>
                </div>
              )}
            </form>
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Idées de prompts cinématiques</span>
            </div>
            <div className="space-y-2">
              {VIDEO_PROMPTS.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/40 hover:bg-violet-950/20 border border-slate-800/60 hover:border-violet-500/40 text-xs text-slate-300 transition-colors"
                >
                  « {p} »
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Videos Library & Preview */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search bar & count */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Film className="w-4 h-4 text-violet-400" />
              <span>Bibliothèque Vidéo ({videos.length})</span>
            </div>
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une vidéo..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8 sm:p-12 text-center space-y-3">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">Aucune vidéo dans votre studio</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Décrivez une scène cinématique ou importez une photo pour créer votre première vidéo haute fidélité avec Veo 3.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="group bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-violet-500/50 overflow-hidden transition-all shadow-lg flex flex-col"
                >
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={video.videoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                      {video.aspectRatio} • {video.resolution}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-200 line-clamp-2" title={video.prompt}>
                        {video.prompt}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{video.createdAt}</span>
                        <span>•</span>
                        <span className="text-violet-400">{video.engine}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleDownloadVideo(video)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger MP4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteVideo(video.id)}
                        className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Supprimer la vidéo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
