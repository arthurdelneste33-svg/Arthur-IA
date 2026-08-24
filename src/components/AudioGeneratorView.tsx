import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Volume2, 
  VolumeX,
  Disc, 
  Clock, 
  Radio, 
  Sliders,
  Wand2,
  Filter,
  Activity,
  Mic,
  MicOff,
  Upload,
  Copy,
  Check,
  FileAudio,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MusicTrack, AccentColorType } from '../types';
import { MUSIC_STYLES, SAMPLE_MUSIC_PROMPTS } from '../data/samplePrompts';
import { AudioManager } from '../utils/audioPlayer';
import { safeFetchJson } from '../utils/apiHelper';

interface AudioGeneratorViewProps {
  tracks: MusicTrack[];
  onAddTrack: (track: MusicTrack) => void;
  onDeleteTrack: (id: string) => void;
  accentColor: AccentColorType;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warn', message: string, title?: string) => void;
}

export const AudioGeneratorView: React.FC<AudioGeneratorViewProps> = ({
  tracks,
  onAddTrack,
  onDeleteTrack,
  accentColor,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'music' | 'transcribe'>('music');

  // Music Gen State
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Lo-Fi Chill');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [isFullTrack, setIsFullTrack] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string>('image/png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>('all');
  
  // Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [copiedTranscription, setCopiedTranscription] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const audioTranscribeInputRef = useRef<HTMLInputElement>(null);

  const durations = [
    { value: 10, label: '10s (Clip)', isFull: false },
    { value: 15, label: '15s (Clip)', isFull: false },
    { value: 30, label: '30s (Clip Max)', isFull: false },
    { value: 60, label: 'Piste Lyria Pro', isFull: true },
  ];

  const handleImageCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(',')[1] || result;
      setSourceImage(base64Clean);
      setSourceImageMime(file.type);
      onShowToast?.('success', 'Image de référence prête pour la composition !', 'Image-to-Music');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onShowToast?.('warn', 'Veuillez saisir une description musicale avant de lancer la génération.', 'Description Requise');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const data = await safeFetchJson<{
        duration?: number;
        audioUrl?: string;
        audioBase64?: string;
        mimeType?: string;
        engine?: string;
        lyrics?: string;
      }>('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          duration: selectedDuration,
          isFullTrack,
          sourceImage: sourceImage || undefined,
          mimeType: sourceImageMime || undefined,
        }),
      });

      const newTrack: MusicTrack = {
        id: `track-${Date.now()}`,
        title: prompt.trim().slice(0, 45),
        style: selectedStyle,
        genre: selectedStyle.split(' ')[0] || 'Lo-Fi',
        prompt: prompt.trim(),
        duration: data.duration || selectedDuration,
        isFullTrack,
        sourceImage: sourceImage ? `data:${sourceImageMime};base64,${sourceImage}` : undefined,
        audioUrl: data.audioUrl || '',
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        engine: data.engine || (isFullTrack ? 'Lyria-3 Pro Engine' : 'Lyria-3 Clip Engine'),
        lyrics: data.lyrics,
        createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      onAddTrack(newTrack);
      onShowToast?.('success', `Piste « ${newTrack.title} » composée avec succès !`, 'Studio Audio');
      handlePlayTrack(newTrack);
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Impossible de générer le morceau audio.', 'Erreur Studio');
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
    onShowToast?.('info', 'Fichier audio WAV téléchargé.', 'Téléchargement');
  };

  // Start Voice Recording for Transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioForTranscription(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onShowToast?.('info', 'Enregistrement vocal en cours... Parlez clairement.', 'Transcription');
    } catch (err: any) {
      onShowToast?.('error', 'Accès micro refusé ou non supporté.', 'Microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAudioForTranscription(file);
  };

  const processAudioForTranscription = async (blobOrFile: Blob | File) => {
    setIsTranscribing(true);
    setTranscribedText('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const data = await safeFetchJson<{ transcription: string }>('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: blobOrFile.type || 'audio/webm',
            }),
          });

          setTranscribedText(data.transcription);
          onShowToast?.('success', 'Transcription audio complétée par Gemini 3.7 !', 'Transcription');
        } catch (innerErr: any) {
          onShowToast?.('error', innerErr.message || 'Impossible de transcrire cet audio.', 'Erreur STT');
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(blobOrFile);
    } catch (err: any) {
      onShowToast?.('error', err.message || 'Impossible de lire le fichier audio.', 'Erreur STT');
      setIsTranscribing(false);
    }
  };

  const copyTranscription = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText);
    setCopiedTranscription(true);
    setTimeout(() => setCopiedTranscription(false), 2000);
    onShowToast?.('info', 'Texte transcrit copié.', 'Presse-papier');
  };

  return (
    <div id="audio-generator-view" className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-[#0a0f18] space-y-6 pb-28 md:pb-8">
      {/* Header Info & SubTab switcher */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Music className="w-4 h-4" />
            <span>Studio Audio & Voix • Lyria 3 & Gemini 3.7</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
            Composition Musicale & Transcription Vocale
          </h2>
        </div>

        {/* SubTab Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('music')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'music'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Studio Musique Lyria
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('transcribe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'transcribe'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transcription Vocale
          </button>
        </div>
      </motion.div>

      {/* VIEW 1: MUSIC GENERATOR */}
      {activeSubTab === 'music' && (
        <>
          {/* Main Generator Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-5 backdrop-blur-xl"
          >
            <form onSubmit={handleGenerate} className="space-y-5">
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
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors p-1"
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
                  className="w-full p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none transition-all"
                />
              </div>

              {/* Optional Reference Image (Image-to-Music) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Image Source / Pochette d'inspiration (Optionnel)
                </label>
                <input
                  ref={musicFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageCoverUpload}
                  className="hidden"
                />
                {sourceImage ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-violet-950/20 border border-violet-500/40">
                    <div className="flex items-center gap-3">
                      <img src={`data:${sourceImageMime};base64,${sourceImage}`} alt="Cover" className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-xs text-violet-200">Image chargée pour inspirer la sonorité</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => musicFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-violet-500/50 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-violet-400" />
                    <span>Associer une image pour guider la composition</span>
                  </button>
                )}
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
                        className={`p-2.5 rounded-xl border text-left transition-all ${
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

              {/* Durations & Model (Clip vs Pro) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Mode :</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          setSelectedDuration(d.value);
                          setIsFullTrack(d.isFull);
                        }}
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
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-40 shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Composition Lyria en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isFullTrack ? 'Composer avec Lyria 3 Pro' : 'Générer avec Lyria 3 Clip'}</span>
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
                <span>Bibliothèque de Compositions ({tracks.length})</span>
              </h3>
            </div>

            {tracks.length === 0 ? (
              <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                <Music className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">Aucun morceau généré pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tracks.map((track) => {
                  const isPlaying = playingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex items-center justify-between gap-3 shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isPlaying
                              ? 'bg-violet-600 text-white animate-pulse'
                              : 'bg-slate-800 text-violet-400 hover:bg-slate-700'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{track.title}</p>
                          <p className="text-[10px] text-slate-400">{track.style} • {track.duration}s • {track.engine || 'Lyria 3'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadTrack(track)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                          title="Télécharger WAV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTrack(track.id)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: AUDIO TRANSCRIPTION HUB (Speech-to-Text) */}
      {activeSubTab === 'transcribe' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Transcription Vocale avec Gemini 3.7 Flash</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Enregistrez votre voix en direct ou importez un fichier audio (MP3, WAV, WebM) pour obtenir une transcription textuelle immédiate et ultra-fidèle.
              </p>
            </div>

            {/* Record & Upload Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                  isRecording
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:bg-violet-950/20'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8 text-rose-400" /> : <Mic className="w-8 h-8 text-violet-400" />}
                <div className="text-center">
                  <div className="font-semibold text-sm">{isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer ma voix'}</div>
                  <div className="text-xs text-slate-500">{isRecording ? 'Cliquez pour transcrire' : 'Microphone en direct'}</div>
                </div>
              </button>

              <input
                ref={audioTranscribeInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => audioTranscribeInputRef.current?.click()}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-violet-500/50 hover:bg-violet-950/20 flex flex-col items-center justify-center gap-3 text-slate-300 transition-all cursor-pointer"
              >
                <FileAudio className="w-8 h-8 text-indigo-400" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Importer un fichier audio</div>
                  <div className="text-xs text-slate-500">MP3, WAV, M4A, WebM, OGG</div>
                </div>
              </button>
            </div>

            {/* Loading Indicator */}
            {isTranscribing && (
              <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 text-violet-300 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span>Gemini 3.7 Flash transcrit fidèlement votre enregistrement...</span>
              </div>
            )}

            {/* Transcription Result Box */}
            {transcribedText && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Texte Transcrit
                  </label>
                  <button
                    type="button"
                    onClick={copyTranscription}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                  >
                    {copiedTranscription ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranscription ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {transcribedText}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

