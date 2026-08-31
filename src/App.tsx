/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TabType, 
  ThinkingMode, 
  ChatMessage, 
  ChatAttachment,
  MusicTrack, 
  GeneratedImage, 
  VideoItem,
  ChatPersonaRole,
  AppSettings, 
  SystemLog,
  ToastNotification
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatView } from './components/ChatView';
import { AudioGeneratorView } from './components/AudioGeneratorView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { VideoGeneratorView } from './components/VideoGeneratorView';
import { SettingsView } from './components/SettingsView';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette';
import { safeFetchJson } from './utils/apiHelper';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('chat');
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>('normal');
  const [activePersona, setActivePersona] = useState<ChatPersonaRole>('general');
  const [webSearch, setWebSearch] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('arthur_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      theme: 'dark-modern',
      accentColor: 'purple',
      ttsVoice: 'Kore',
      ttsSpeed: 1,
      defaultThinkingMode: 'normal',
      autoPlayTts: false,
      webSearchDefault: false,
    };
  });

  // Chat conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('arthur_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Music Tracks Library
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    const saved = localStorage.getItem('arthur_tracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Generated Images Library
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem('arthur_images');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Generated Videos Library (Veo 3.1)
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    const saved = localStorage.getItem('arthur_videos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Real-time Event / Terminal Logs
  const [logs, setLogs] = useState<SystemLog[]>(() => [
    {
      id: 'log-1',
      level: 'info',
      module: 'KERNEL',
      message: 'Initialisation du noyau Arthur IA v0.1 STABLE ALPHA (Conçu par Arthur Delneste).',
      timestamp: '12:00:00',
    },
    {
      id: 'log-2',
      level: 'success',
      module: 'ARTHUR_CORE',
      message: 'Moteur multimodal v0.1 STABLE ALPHA opérationnel (Modes Rapide, Normal, Réflexion Avancée).',
      timestamp: '12:00:01',
    },
    {
      id: 'log-3',
      level: 'success',
      module: 'SPEECH_TTS',
      message: 'Synthèse vocale HD (TTS) avec Waveform dynamique synchronisée.',
      timestamp: '12:00:02',
    },
    {
      id: 'log-4',
      level: 'info',
      module: 'COMMAND_BUS',
      message: 'Palette de raccourcis globaux initialisée (Ctrl + K).',
      timestamp: '12:00:03',
    },
  ]);

  // Toast Notification System
  const showToast = (type: 'success' | 'error' | 'info' | 'warn', message: string, title?: string) => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist state to localStorage with try-catch guards against quota limits
  useEffect(() => {
    try {
      localStorage.setItem('arthur_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      // Keep recent 60 messages in localStorage to prevent 5MB storage quota limits
      localStorage.setItem('arthur_messages', JSON.stringify(messages.slice(-60)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('arthur_tracks', JSON.stringify(tracks.slice(-25)));
    } catch {
      // ignore
    }
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem('arthur_images', JSON.stringify(images.slice(-25)));
    } catch {
      // ignore
    }
  }, [images]);

  useEffect(() => {
    try {
      localStorage.setItem('arthur_videos', JSON.stringify(videos.slice(-15)));
    } catch {
      // ignore
    }
  }, [videos]);

  const addLog = (logItem: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      ...logItem,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 100)]);
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.defaultThinkingMode) {
        setThinkingMode(newSettings.defaultThinkingMode);
      }
      return updated;
    });
    addLog({
      level: 'info',
      module: 'CONFIG',
      message: 'Mise à jour des paramètres applicatifs.',
    });
    showToast('success', 'Paramètres sauvegardés.', 'Configuration');
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsChatLoading(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false, isThinkingStream: false } : msg
      )
    );
    addLog({
      level: 'info',
      module: 'CHAT_STREAM',
      message: 'Génération interrompue par l\'utilisateur.',
    });
    showToast('info', 'Génération arrêtée.', 'IA');
  };

  // Chat message send handler with document attachment & real-time reasoning streaming
  const handleSendMessage = async (
    text: string, 
    isRetry = false, 
    persona?: ChatPersonaRole,
    attachments?: ChatAttachment[]
  ) => {
    const effectivePersona = persona || activePersona;
    let currentMessageList = messages;

    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: text,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      currentMessageList = [...messages, userMsg];
      setMessages(currentMessageList);
    }

    setIsChatLoading(true);

    const docCount = attachments?.length || 0;
    addLog({
      level: 'info',
      module: 'CHAT_STREAM',
      message: `Initialisation du flux [Mode: ${thinkingMode.toUpperCase()} | Persona: ${effectivePersona}${docCount > 0 ? ` | Docs: ${docCount}` : ''}] : « ${text ? text.slice(0, 35) : 'Analyse de document'}... »`,
    });

    const aiMsgId = `msg-${Date.now()}-ai`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      thinking: '',
      mode: thinkingMode,
      isStreaming: true,
      isThinkingStream: false,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, initialAiMsg]);

    const thinkingStartTime = Date.now();
    let thinkingEndTime = 0;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let response: Response;
      const requestPayload = {
        messages: currentMessageList
          .filter((m) => !m.isError)
          .map((m) => ({ 
            role: m.role, 
            content: m.content,
            attachments: m.attachments 
          })),
        mode: thinkingMode,
        webSearch,
        role: effectivePersona,
        verbosity: 'standard',
      };

      try {
        response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream, application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
      } catch (networkErr: any) {
        if (networkErr.name === 'AbortError') throw networkErr;
        // Fallback to /api/chat or /api
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
      }

      if (!response.ok) {
        // Try fallback to /api/chat or /api if /api/chat/stream returned 404/500
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(requestPayload),
          });
          if (fallbackRes.ok) {
            response = fallbackRes;
          } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Erreur serveur (${response.status})`);
          }
        } catch (fbErr: any) {
          if (fbErr.name === 'AbortError') throw fbErr;
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur (${response.status})`);
        }
      }

      const contentType = response.headers.get('content-type') || '';

      // Direct JSON response handling (e.g. Vercel serverless non-streaming fallback)
      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        if (jsonData.error) {
          throw new Error(jsonData.error);
        }
        const text = jsonData.text || jsonData.reply || jsonData.message || '';
        const thinking = jsonData.thinking || '';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: text,
                  thinking: thinking,
                  modelUsed: jsonData.modelUsed || 'Arthur IA 0.1',
                  isStreaming: false,
                  isThinkingStream: false,
                }
              : msg
          )
        );
        setIsChatLoading(false);
        abortControllerRef.current = null;
        addLog({
          level: 'success',
          module: 'CHAT_STREAM',
          message: `Réponse complétée avec succès via canal JSON direct (${text.length} caractères).`,
        });
        return;
      }

      if (!response.body) {
        throw new Error('Flux de données indisponible.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedThinking = '';
      let accumulatedText = '';
      let receivedModel = '';
      let receivedSources: any[] | undefined = undefined;
      let receivedPlaces: any[] | undefined = undefined;

      // Immediate and direct reactive UI updates
      let lastUiUpdateTime = 0;
      const updateUIMessage = (isThinking: boolean, isStreaming: boolean, force = false) => {
        const now = Date.now();
        if (!force && now - lastUiUpdateTime < 35) return; // ~30fps throttle for smooth rendering
        lastUiUpdateTime = now;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content: accumulatedText,
                  thinking: accumulatedThinking,
                  modelUsed: receivedModel || msg.modelUsed,
                  isThinkingStream: isThinking && Boolean(accumulatedThinking.trim()),
                  isStreaming: isStreaming,
                }
              : msg
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          let data: any = null;
          try {
            data = JSON.parse(jsonStr);
          } catch {
            // Ignore malformed or partial JSON line
            continue;
          }

          if (!data) continue;

          if (data.type === 'error') {
            throw new Error(data.error || "Erreur de communication avec le modèle d'IA");
          } else if (data.type === 'start') {
            receivedModel = data.modelUsed;
            updateUIMessage(false, true, true);
          } else if (data.type === 'thought_chunk') {
            accumulatedThinking = data.fullThinking || (accumulatedThinking + data.chunk);
            updateUIMessage(true, true);
          } else if (data.type === 'thought_end') {
            if (!thinkingEndTime) thinkingEndTime = Date.now();
            if (data.thinking) accumulatedThinking = data.thinking;
            const duration = thinkingEndTime - thinkingStartTime;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? { 
                      ...msg, 
                      thinking: accumulatedThinking,
                      isThinkingStream: false,
                      thinkingDurationMs: duration,
                    }
                  : msg
              )
            );
          } else if (data.type === 'text_chunk') {
            if (!thinkingEndTime) thinkingEndTime = Date.now();
            accumulatedText = data.fullText || (accumulatedText + data.chunk);
            updateUIMessage(false, true);
          } else if (data.type === 'done') {
            if (!thinkingEndTime) thinkingEndTime = Date.now();
            if (data.modelUsed) receivedModel = data.modelUsed;
            if (data.sources) receivedSources = data.sources;
            if (data.mapPlaces) receivedPlaces = data.mapPlaces;
            if (data.thinking) accumulatedThinking = data.thinking;
            if (data.text) accumulatedText = data.text;

            const duration = thinkingEndTime ? thinkingEndTime - thinkingStartTime : undefined;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      content: accumulatedText,
                      thinking: accumulatedThinking,
                      modelUsed: receivedModel || msg.modelUsed,
                      sources: receivedSources,
                      mapPlaces: receivedPlaces,
                      isStreaming: false,
                      isThinkingStream: false,
                      thinkingDurationMs: duration,
                    }
                  : msg
              )
            );
          }
        }
      }

      // If stream ended but no text was received at all, throw an error to display retry card
      if (!accumulatedText.trim()) {
        throw new Error("Aucune réponse n'a été renvoyée par le modèle d'IA. Veuillez relancer la requête.");
      }

      // Ensure final message state is settled cleanly after stream closes
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: accumulatedText,
                thinking: accumulatedThinking || msg.thinking,
                modelUsed: receivedModel || msg.modelUsed,
                sources: receivedSources || msg.sources,
                mapPlaces: receivedPlaces || msg.mapPlaces,
                isStreaming: false,
                isThinkingStream: false,
              }
            : msg
        )
      );

      setIsChatLoading(false);
      abortControllerRef.current = null;
      addLog({
        level: 'success',
        module: 'CHAT_STREAM',
        message: `Raisonnement & Réponse complétés avec succès (${accumulatedText.length} caractères générés).`,
      });
    } catch (err: any) {
      setIsChatLoading(false);
      abortControllerRef.current = null;

      if (err.name === 'AbortError') {
        // Handled cleanly by user stop
        return;
      }

      console.error('Chat error:', err);
      let errorText = err.message || 'Une erreur inattendue est survenue.';

      if (
        errorText.includes('503') ||
        errorText.includes('high demand') ||
        errorText.includes('UNAVAILABLE') ||
        errorText.includes('saturé') ||
        errorText.includes('Aucune réponse') ||
        errorText.includes('Erreur de communication')
      ) {
        errorText = "Le serveur d'intelligence artificielle connaît un pic de demande temporaire. Le système a effectué plusieurs tentatives automatiques de secours. Vous pouvez relancer la génération en un clic en cliquant sur « Réessayer la requête » ci-dessous.";
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: errorText,
                isError: true,
                canRetry: true,
                isStreaming: false,
                isThinkingStream: false,
              }
            : msg
        )
      );

      addLog({
        level: 'warn',
        module: 'CHAT_STREAM',
        message: `Incident de flux : ${errorText.slice(0, 80)}`,
      });

      showToast('error', errorText.length > 90 ? `${errorText.slice(0, 85)}...` : errorText, 'Alerte Modèle');
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryMessage = async (failedMsgId?: string) => {
    if (failedMsgId) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsgId));
    }
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      await handleSendMessage(lastUserMessage.content, true, undefined, lastUserMessage.attachments);
    }
  };

  // Music handlers
  const handleAddTrack = (track: MusicTrack) => {
    setTracks((prev) => [track, ...prev]);
    addLog({
      level: 'success',
      module: 'AUDIO_STUDIO',
      message: `Nouveau morceau composé : « ${track.title} » [Style: ${track.style}]`,
    });
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Morceau audio supprimé de la bibliothèque.', 'Audio');
  };

  // Image handlers
  const handleAddImage = (img: GeneratedImage) => {
    setImages((prev) => [img, ...prev]);
    addLog({
      level: 'success',
      module: 'IMAGE_STUDIO',
      message: `Nouvelle image HD générée : « ${img.prompt.slice(0, 30)}... » [${img.style}]`,
    });
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    showToast('info', 'Visuel supprimé de la galerie.', 'Images');
  };

  // Video handlers
  const handleAddVideo = (video: VideoItem) => {
    setVideos((prev) => [video, ...prev]);
    addLog({
      level: 'success',
      module: 'VIDEO_STUDIO',
      message: `Nouvelle vidéo Veo générée : « ${video.prompt.slice(0, 30)}... » [${video.resolution}]`,
    });
  };

  const handleDeleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    showToast('info', 'Vidéo supprimée de la bibliothèque.', 'Vidéo');
  };

  // Theme container classes
  const getThemeBackgroundClass = () => {
    switch (settings.theme) {
      case 'dark-oled': return 'bg-[#040608] text-slate-100';
      case 'dark-navy': return 'bg-[#070d18] text-slate-100';
      default: return 'bg-[#090e17] text-slate-100';
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden select-none font-sans ${getThemeBackgroundClass()}`}>
      {/* Navigation Sidebar (Desktop + Mobile slide-out drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        thinkingMode={thinkingMode}
        accentColor={settings.accentColor}
        systemStatus="Opérationnel"
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          thinkingMode={thinkingMode}
          onModeChange={setThinkingMode}
          accentColor={settings.accentColor}
          webSearch={webSearch}
          onToggleWebSearch={() => setWebSearch((prev) => !prev)}
          onOpenSettings={() => setCurrentTab('settings')}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          systemHealthy={systemHealthy}
        />

        {/* Dynamic Views with Smooth AnimatePresence Transitions */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <ChatView
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onRetryMessage={handleRetryMessage}
                  onStopGeneration={handleStopGeneration}
                  isLoading={isChatLoading}
                  thinkingMode={thinkingMode}
                  activePersona={activePersona}
                  onChangePersona={setActivePersona}
                  onClearMessages={() => {
                    setMessages([]);
                    showToast('info', 'Historique de discussion effacé.', 'Chat');
                  }}
                  accentColor={settings.accentColor}
                  settings={settings}
                  onShowToast={showToast}
                />
              </motion.div>
            )}

            {currentTab === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <AudioGeneratorView
                  tracks={tracks}
                  onAddTrack={handleAddTrack}
                  onDeleteTrack={handleDeleteTrack}
                  accentColor={settings.accentColor}
                  onShowToast={showToast}
                />
              </motion.div>
            )}

            {currentTab === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <ImageGeneratorView
                  images={images}
                  onAddImage={handleAddImage}
                  onDeleteImage={handleDeleteImage}
                  accentColor={settings.accentColor}
                  onShowToast={showToast}
                />
              </motion.div>
            )}

            {currentTab === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <VideoGeneratorView
                  videos={videos}
                  onAddVideo={handleAddVideo}
                  onDeleteVideo={handleDeleteVideo}
                  accentColor={settings.accentColor}
                  onShowToast={showToast}
                />
              </motion.div>
            )}

            {currentTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <SettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  thinkingMode={thinkingMode}
                  onModeChange={setThinkingMode}
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                  onAddLog={addLog}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Dock Navigation */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          accentColor={settings.accentColor}
        />
      </div>

      {/* Global Command Palette Modal (Ctrl + K) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              setIsCommandPaletteOpen(false);
            }}
            onSelectMode={(mode) => {
              setThinkingMode(mode);
              setIsCommandPaletteOpen(false);
              showToast('info', `Mode IA basculé sur : ${mode.toUpperCase()}`, 'Mode IA');
            }}
            onToggleWebSearch={() => {
              setWebSearch((prev) => !prev);
              setIsCommandPaletteOpen(false);
              showToast('info', `Recherche Web : ${!webSearch ? 'Activée' : 'Désactivée'}`, 'Web Google');
            }}
            onClearHistory={() => {
              setMessages([]);
              setIsCommandPaletteOpen(false);
              showToast('info', 'Discussion réinitialisée.', 'Nettoyage');
            }}
            onClose={() => setIsCommandPaletteOpen(false)}
            webSearchActive={webSearch}
            currentMode={thinkingMode}
          />
        )}
      </AnimatePresence>

      {/* Global Toast Notifications Container */}
      <ToastContainer
        toasts={toasts}
        onCloseToast={removeToast}
      />
    </div>
  );
}
