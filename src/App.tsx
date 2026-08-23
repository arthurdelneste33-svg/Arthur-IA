/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TabType, 
  ThinkingMode, 
  ChatMessage, 
  MusicTrack, 
  GeneratedImage, 
  DocumentItem, 
  AppSettings, 
  SystemLog 
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatView } from './components/ChatView';
import { AudioGeneratorView } from './components/AudioGeneratorView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { DocumentAnalyzerView } from './components/DocumentAnalyzerView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('chat');
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>('normal');
  const [webSearch, setWebSearch] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Analyzed Documents Library
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('arthur_documents');
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
      message: 'Initialisation du noyau Arthur IA 0.2 Alpha (Conçu par Arthur Delneste).',
      timestamp: '12:20:00',
    },
    {
      id: 'log-2',
      level: 'success',
      module: 'ARTHUR_CORE',
      message: 'Architecture Arthur IA 0.2 Alpha prête (Modes Rapide, Normal, Réflexion Avancée).',
      timestamp: '12:20:01',
    },
    {
      id: 'log-3',
      level: 'success',
      module: 'SPEECH_TTS',
      message: 'Synthèse vocale (TTS) avec Pause/Reprise et Waveform opérationnelle.',
      timestamp: '12:20:02',
    },
  ]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('arthur_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('arthur_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('arthur_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('arthur_images', JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    localStorage.setItem('arthur_documents', JSON.stringify(documents));
  }, [documents]);

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
  };

  // Chat message send handler
  const handleSendMessage = async (text: string, isRetry = false) => {
    let currentMessageList = messages;

    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      currentMessageList = [...messages, userMsg];
      setMessages(currentMessageList);
    }

    setIsChatLoading(true);

    addLog({
      level: 'info',
      module: 'CHAT_ENGINE',
      message: `Envoi requête [Mode: ${thinkingMode.toUpperCase()}] : « ${text.slice(0, 35)}... »`,
    });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessageList
            .filter((m) => !m.isError)
            .map((m) => ({ role: m.role, content: m.content })),
          mode: thinkingMode,
          webSearch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la conversation');
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.text,
        thinking: data.thinking,
        modelUsed: data.modelUsed,
        mode: thinkingMode,
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      addLog({
        level: 'success',
        module: 'CHAT_ENGINE',
        message: `Réponse reçue via ${data.modelUsed || 'Gemini 3.7'} (${data.text.length} caractères).`,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      let errorText = err.message || 'Une erreur inattendue est survenue.';

      // Clean raw JSON error format if returned
      if (errorText.includes('503') || errorText.includes('high demand') || errorText.includes('UNAVAILABLE')) {
        errorText = "Le serveur d'intelligence artificielle connaît un pic de demande temporaire. Le système a effectué plusieurs tentatives automatiques de secours. Vous pouvez relancer la demande en cliquant sur « Réessayer » ci-dessous.";
      } else if (errorText.startsWith('{') || errorText.includes('"error"')) {
        try {
          const parsed = JSON.parse(errorText.replace(/^.*?({.*}).*$/, '$1'));
          errorText = parsed.error?.message || parsed.message || errorText;
        } catch {
          // keep sanitized
        }
      }

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: errorText,
        isError: true,
        canRetry: true,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);

      addLog({
        level: 'warn',
        module: 'CHAT_ENGINE',
        message: `Échec du chat : ${err.message}`,
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRetryMessage = async (failedMsgId?: string) => {
    // Remove the failed error message
    if (failedMsgId) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsgId));
    }
    // Find the last user message to resend
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      await handleSendMessage(lastUserMessage.content, true);
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
  };

  // Document handlers
  const handleAddDocument = (doc: DocumentItem) => {
    setDocuments((prev) => [doc, ...prev]);
    addLog({
      level: 'info',
      module: 'DOC_PARSER',
      message: `Document importé : « ${doc.name} » (${(doc.size / 1024).toFixed(1)} Ko)`,
    });
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDocumentSummary = (id: string, summary: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, summary } : d))
    );
    addLog({
      level: 'success',
      module: 'DOC_PARSER',
      message: `Synthèse générée pour le document id: ${id.slice(0, 8)}`,
    });
  };

  const handleAddDocumentQA = (id: string, qa: { question: string; answer: string }) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              qas: [
                ...d.qas,
                {
                  id: `qa-${Date.now()}`,
                  question: qa.question,
                  answer: qa.answer,
                  timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            }
          : d
      )
    );
    addLog({
      level: 'success',
      module: 'DOC_QA',
      message: `Question traitée sur document : « ${qa.question.slice(0, 30)}... »`,
    });
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
                  isLoading={isChatLoading}
                  thinkingMode={thinkingMode}
                  onClearMessages={() => setMessages([])}
                  accentColor={settings.accentColor}
                  settings={settings}
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
                />
              </motion.div>
            )}

            {currentTab === 'documents' && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
              >
                <DocumentAnalyzerView
                  documents={documents}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onUpdateDocumentSummary={handleUpdateDocumentSummary}
                  onAddQA={handleAddDocumentQA}
                  accentColor={settings.accentColor}
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
    </div>
  );
}
