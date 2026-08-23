import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Volume2, 
  Disc, 
  Clock, 
  Radio, 
  Sliders,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MusicTrack, AccentColorType } from '../types';
import { MUSIC_STYLES, SAMPLE_MUSIC_PROMPTS } from '../data/samplePrompts';
import { AudioManager } from '../utils/audioPlayer';

interface AudioGeneratorViewProps {
  tracks: MusicTrack[];
  onAddTrack: (track: MusicTrack) => void;
  onDeleteTrack: (id: string) => void;
  accentColor: AccentColorType;
}

export const AudioGeneratorView: React.FC<AudioGeneratorViewProps> = ({
  tracks,
  onAddTrack,
  onDeleteTrack,
  accentColor,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Lo-Fi Relax');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const durations = [
    { value: 10, label: '10s', desc: 'Court jingle / Boucle' },
    { value: 15, label: '15s', desc: 'Format standard' },
    { value: 30, label: '30s', desc: 'Composition étendue' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          duration: selectedDuration,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur de génération musicale');
      }

      const data = await res.json();

      const newTrack: MusicTrack = {
        id: `track-${Date.now()}`,
        title: prompt.trim().slice(0, 45),
        style: selectedStyle,
        prompt: prompt.trim(),
        duration: data.duration || selectedDuration,
        audioUrl: data.audioUrl || '',
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      onAddTrack(newTrack);
      handlePlayTrack(newTrack);
    } catch (err: any) {
      alert(err.message || 'Impossible de générer le morceau audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayTrack = async (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      AudioManager.stopCurrentAudio();
      setPlayingTrackId(null);
      return;
    }

    AudioManager.stopCurrentAudio();
    setPlayingTrackId(track.id);

    await AudioManager.playBase64Audio(
      track.audioBase64,
      track.mimeType || 'audio/wav',
      track.id,
      1,
      () => setPlayingTrackId(null)
    );
  };

  const handleDownloadTrack = (track: MusicTrack) => {
    const link = document.createElement('a');
    link.href = `data:${track.mimeType || 'audio/wav'};base64,${track.audioBase64}`;
    link.download = `ArthurIA-${track.style.replace(/\s+/g, '_')}-${Date.now()}.wav`;
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
    <div id="audio-generator-view" className="flex-1 overflow-y-auto p-3 sm:p-8 bg-[#0a0f18] space-y-6 sm:space-y-8 pb-28 md:pb-8">
      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-2"
      >
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <Music className="w-4 h-4" />
          <span>Studio Audio & Synthèse Harmonique</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Composez des paysages sonores avec Arthur IA
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Transformez vos descriptions textuelles en pistes audio WAV harmonieuses, rythmes Lo-Fi et ambiances cinématiques.
        </p>
      </motion.div>

      {/* Main Generator Card */}
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
                Ambiance & Description du Morceau
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPrompt = SAMPLE_MUSIC_PROMPTS[Math.floor(Math.random() * SAMPLE_MUSIC_PROMPTS.length)];
                  setPrompt(randomPrompt);
                }}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Idée aléatoire</span>
              </button>
            </div>

            <textarea
              id="music-prompt-input"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Une nappe spatiale mystérieuse avec des basses profondes et un synthétiseur analogique doux..."
              className="w-full p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Exemples :</span>
              {SAMPLE_MUSIC_PROMPTS.slice(0, 2).map((p, idx) => (
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
              Style Musical & Structure
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MUSIC_STYLES.map((st) => {
                const isSelected = selectedStyle === st.name;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.name)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
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

          {/* Duration Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Durée :</span>
              <div className="flex items-center gap-1.5">
                {durations.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDuration(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedDuration === d.value
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              id="generate-music-btn"
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!prompt.trim() || isGenerating}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-40 shadow-lg min-h-[44px] ${getAccentBtn()}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Composition en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer le morceau audio</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Generated Tracks Library */}
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Disc className="w-4 h-4 text-violet-400" />
            <span>Bibliothèque Musicale ({tracks.length})</span>
          </h3>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 text-slate-500 space-y-2">
            <Music className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Aucun morceau généré pour le moment.</p>
            <p className="text-xs text-slate-600">
              Sélectionnez un style ci-dessus et écrivez votre première description sonore.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  id={`track-card-${track.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPlaying
                      ? 'bg-slate-900/95 border-violet-500 shadow-lg shadow-violet-950/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Play / Pause Big Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePlayTrack(track)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                          isPlaying
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-950/50'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </motion.button>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {track.style}
                          </span>
                          <span>• {track.duration}s</span>
                          <span>• {track.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownloadTrack(track)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Télécharger le fichier WAV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Soundwave Bars Visualizer */}
                  {isPlaying && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 px-1">
                      <div className="flex items-center gap-1">
                        {[...Array(24)].map((_, i) => (
                          <span
                            key={i}
                            className="w-1 bg-violet-400 rounded-full"
                            style={{
                              height: `${Math.max(6, Math.sin(i * 0.4) * 16 + 10)}px`,
                              animation: `soundWave${(i % 3) + 1} ${0.6 + (i % 4) * 0.15}s ease-in-out infinite`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-violet-400 animate-pulse">Lecture en cours...</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
