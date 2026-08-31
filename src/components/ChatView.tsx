import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Volume2, 
  Pause, 
  Play,
  Sparkles, 
  Zap, 
  Brain, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2, 
  Trash2, 
  Mic, 
  MicOff, 
  Download, 
  FileText, 
  FileCode, 
  Image as ImageIcon,
  Paperclip,
  UploadCloud,
  FileCheck,
  X,
  ChevronDown,
  RefreshCw,
  Forward,
  AlertTriangle,
  MapPin,
  Star,
  UserCheck,
  Code2,
  BookOpen,
  LineChart,
  PenTool,
  Clock,
  Timer,
  Square,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { safeFetchJson } from '../utils/apiHelper';
import { ChatMessage, ChatAttachment, ThinkingMode, AccentColorType, AppSettings, ChatPersonaRole } from '../types';
import { CHAT_SUGGESTIONS, CHAT_PERSONAS } from '../data/samplePrompts';
import { AudioManager, AudioPlaybackState } from '../utils/audioPlayer';
import { ThinkingVisualizer } from './ThinkingVisualizer';
import { CodeBlock } from './CodeBlock';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isRetry?: boolean, persona?: ChatPersonaRole, attachments?: ChatAttachment[]) => Promise<void>;
  onRetryMessage?: (failedMsgId?: string) => Promise<void>;
  onStopGeneration?: () => void;
  isLoading: boolean;
  thinkingMode: ThinkingMode;
  onClearMessages: () => void;
  accentColor: AccentColorType;
  settings: AppSettings;
  activePersona?: ChatPersonaRole;
  onChangePersona?: (role: ChatPersonaRole) => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warn', message: string, title?: string) => void;
}

// Subcomponent for streaming typewriter effect on the latest AI message
const TypewriterMarkdown: React.FC<{
  content: string;
  isStreaming?: boolean;
  isLatest: boolean;
  onFinished?: () => void;
}> = ({ content, isStreaming = false, isLatest, onFinished }) => {
  const hasText = Boolean(content && content.trim().length > 0);

  return (
    <div className="relative group space-y-2">
      {/* Active Real-time Streaming Indicator */}
      {isStreaming && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between text-[11px] font-mono text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 px-3 py-1 rounded-lg mb-2 shadow-xs"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold uppercase tracking-wider text-emerald-300">Génération en direct</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Arthur IA 0.1</span>
        </motion.div>
      )}

      {/* Main Formatted Markdown */}
      <div className="prose prose-serious prose-sm max-w-none break-words leading-relaxed">
        {hasText ? (
          <>
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded-md bg-slate-800/90 text-indigo-200 font-mono text-xs border border-slate-700/80" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock
                      code={String(children).replace(/\n$/, '')}
                      language={match ? match[1] : undefined}
                    />
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-gradient-to-t from-emerald-400 via-indigo-400 to-violet-400 ml-1.5 translate-y-0.5 rounded-xs animate-pulse shadow-sm shadow-indigo-400" />
            )}
          </>
        ) : isStreaming ? (
          <div className="flex items-center gap-2 py-1 text-xs text-indigo-300">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
            </span>
            <span className="text-slate-400 italic">Arthur IA formule la réponse...</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Réponse vide.</span>
        )}
      </div>
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onRetryMessage,
  onStopGeneration,
  isLoading,
  thinkingMode,
  onClearMessages,
  accentColor,
  settings,
  activePersona = 'general',
  onChangePersona,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTTSLoading, setIsTTSLoading] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<{ activeId: string | null; status: AudioPlaybackState }>({
    activeId: null,
    status: 'idle',
  });
  const [isListening, setIsListening] = useState(false);
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDocumentIcon = (type?: string) => {
    const ext = (type || '').toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
    if (['csv', 'xlsx', 'xls', 'tsv'].includes(ext)) return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 'sql', 'xml', 'yaml', 'yml', 'c', 'cpp', 'java'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-violet-400 shrink-0" />;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsReadingFiles(true);
    const newAttachments: ChatAttachment[] = [];
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        onShowToast?.('warn', `Le fichier « ${file.name} » dépasse la taille maximale autorisée (25 Mo).`, 'Fichier trop lourd');
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isText = [
        'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 
        'html', 'css', 'sql', 'xml', 'yaml', 'yml', 'c', 'cpp', 'h', 'java', 'rs', 'go', 'sh', 'log'
      ].includes(ext) || (file.type && file.type.startsWith('text/'));

      try {
        if (isText) {
          const text = await file.text();
          newAttachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            type: ext,
            mimeType: file.type || 'text/plain',
            textContent: text,
          });
        } else {
          // Binary files (PDF, DOCX, Images, etc.) -> Read base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64 = res.includes(',') ? res.split(',')[1] : res;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: file.size,
            type: ext,
            mimeType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
            base64Data,
          });
        }
      } catch (err) {
        console.error('File parsing error:', err);
        onShowToast?.('error', `Impossible de lire le fichier « ${file.name} ».`, 'Erreur Document');
      }
    }

    setIsReadingFiles(false);

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
      onShowToast?.(
        'success', 
        `${newAttachments.length} document(s) joint(s). Posez votre question ou cliquez sur un raccourci d'analyse.`, 
        'Document attaché'
      );
      textareaRef.current?.focus();
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Subscribe to AudioManager state
  useEffect(() => {
    const unsubscribe = AudioManager.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cycling animated thinking steps for loading state
  const thinkingPhases = [
    { step: 1, title: 'Cadrage sémantique & ingestion contextuelle' },
    { step: 2, title: 'Inférence neurale & exploration des hypothèses' },
    { step: 3, title: 'Contrôle de cohérence & validation formelle' },
    { step: 4, title: 'Génération de la synthèse exécutive' },
  ];

  useEffect(() => {
    let interval: any;
    let timer: any;
    if (isLoading) {
      setLoadingSeconds(0);
      const start = Date.now();
      timer = setInterval(() => {
        setLoadingSeconds(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);

      interval = setInterval(() => {
        setThinkingStepIndex((prev) => (prev + 1) % thinkingPhases.length);
      }, 1400);
    }
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isLoading]);

  // Handle scroll tracking to prevent fighting user scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 140;
    setIsUserScrolledUp(isUp);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      setIsUserScrolledUp(false);
    }
  }, []);

  // Smart non-blocking auto scroll to bottom during streaming or message addition
  useEffect(() => {
    if (!isUserScrolledUp) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [messages, isLoading, isUserScrolledUp]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // TTS with Play / Pause / Resume
  const handleTTS = async (message: ChatMessage) => {
    const isCurrentActive = playbackState.activeId === message.id;

    if (isCurrentActive) {
      if (playbackState.status === 'playing') {
        AudioManager.pauseAudio();
        return;
      } else if (playbackState.status === 'paused') {
        AudioManager.resumeAudio();
        return;
      }
    }

    AudioManager.stopCurrentAudio();
    setIsTTSLoading(message.id);

    try {
      const data = await safeFetchJson<{
        audioBase64?: string;
        mimeType?: string;
        textToSpeak?: string;
      }>('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          voice: settings.ttsVoice,
          speed: settings.ttsSpeed,
        }),
      });

      setIsTTSLoading(null);

      if (data.audioBase64) {
        await AudioManager.playBase64Audio(
          data.audioBase64,
          data.mimeType || 'audio/wav',
          message.id,
          settings.ttsSpeed
        );
      } else {
        AudioManager.speakWithBrowser(
          data.textToSpeak || message.content,
          message.id,
          settings.ttsSpeed,
          settings.ttsVoice
        );
      }
    } catch (err) {
      console.warn('TTS request fallback:', err);
      setIsTTSLoading(null);
      AudioManager.speakWithBrowser(
        message.content,
        message.id,
        settings.ttsSpeed,
        settings.ttsVoice
      );
    }
  };

  // Export conversation to Markdown or Plain Text
  const handleExportChat = (format: 'markdown' | 'txt') => {
    if (messages.length === 0) return;

    let content = '';
    const dateStr = new Date().toLocaleString('fr-FR');

    if (format === 'markdown') {
      content += `# Discussion avec Arthur IA (Modèle : Arthur IA 0.1 Stable Alpha • Conçu par Arthur Delneste)\n`;
      content += `*Date d'exportation : ${dateStr}*\n\n---\n\n`;

      messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        content += `### ${isUser ? '👤 Utilisateur' : '🤖 Arthur IA'} (${msg.timestamp})\n\n`;
        if (!isUser && msg.thinking) {
          content += `> **Raisonnement logique :**\n`;
          content += `> ${msg.thinking.replace(/\n/g, '\n> ')}\n\n`;
        }
        content += `${msg.content}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
          content += `**Sources :**\n`;
          msg.sources.forEach((s) => {
            content += `- [${s.title}](${s.url})\n`;
          });
          content += `\n`;
        }
        content += `---\n\n`;
      });
    } else {
      content += `=====================================================\n`;
      content += `   HISTORIQUE DE DISCUSSION ARTHUR IA (v0.1 STABLE ALPHA)\n`;
      content += `   Conçu par Arthur Delneste\n`;
      content += `   Date d'exportation : ${dateStr}\n`;
      content += `=====================================================\n\n`;

      messages.forEach((msg) => {
        const isUser = msg.role === 'user';
        content += `[${msg.timestamp}] ${isUser ? 'UTILISATEUR' : 'ARTHUR IA'}:\n`;
        if (!isUser && msg.thinking) {
          content += `[Raisonnement]: ${msg.thinking.slice(0, 150)}...\n`;
        }
        content += `${msg.content}\n`;
        if (msg.sources && msg.sources.length > 0) {
          content += `Sources: ${msg.sources.map((s) => s.title).join(', ')}\n`;
        }
        content += `\n-----------------------------------------------------\n\n`;
      });
    }

    const blob = new Blob([content], {
      type: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arthur-ia-chat-${Date.now()}.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('La reconnaissance vocale n’est pas supportée sur ce navigateur.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    const text = inputText.trim();
    const attached = [...attachments];
    setInputText('');
    setAttachments([]);
    await onSendMessage(text, false, activePersona, attached);
  };

  const handleSendCustomPrompt = async (promptText: string) => {
    if (isLoading) return;
    const attached = [...attachments];
    setInputText('');
    setAttachments([]);
    await onSendMessage(promptText, false, activePersona, attached);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const getAccentButtonClass = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50 border border-emerald-400/20';
      case 'amber': return 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/50 border border-amber-400/20';
      case 'cyan': return 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/50 border border-cyan-400/20';
      default: return 'bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#db2777] hover:from-[#2563eb] hover:via-[#6d28d9] hover:to-[#e11d48] text-white shadow-lg shadow-indigo-950/60 border border-white/20';
    }
  };

  // Distinct mode badge styling
  const getModeInfo = () => {
    switch (thinkingMode) {
      case 'fast':
        return {
          title: 'Mode Flash Instant',
          desc: 'Latence zéro — Réponses quasi-instantanées (<150ms).',
          icon: Zap,
          badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40 shadow-cyan-950/30',
          dotColor: 'bg-cyan-400',
        };
      case 'advanced':
        return {
          title: 'Mode Réflexion Profonde',
          desc: 'Raisonnement axiomatique structuré et approfondi.',
          icon: Brain,
          badgeColor: 'text-amber-400 border-amber-500/50 bg-amber-950/40 shadow-amber-950/40 ring-1 ring-amber-500/30',
          dotColor: 'bg-amber-400',
        };
      default:
        return {
          title: 'Mode Standard Vif',
          desc: 'Réponses ultra-rapides et intelligentes sans attente.',
          icon: Sparkles,
          badgeColor: 'text-violet-400 border-violet-500/40 bg-violet-950/40 shadow-violet-950/30',
          dotColor: 'bg-violet-400',
        };
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  return (
    <div 
      id="chat-container" 
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
        }
      }}
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b12] relative"
    >
      {/* Drag & Drop Visual Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-violet-950/80 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-violet-400 pointer-events-none p-6 text-center"
          >
            <div className="p-4 rounded-2xl bg-violet-900/60 border border-violet-400/50 shadow-2xl mb-4 animate-bounce">
              <UploadCloud className="w-12 h-12 text-violet-200" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Déposez vos documents ici</h3>
            <p className="text-sm text-violet-200 max-w-sm">
              Arthur IA analysera automatiquement le contenu de vos fichiers PDF, Word, texte, code ou tableaux.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Mode Context Bar & Chat Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 py-2.5 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shrink-0 z-10"
      >
        <div className="flex items-center gap-2.5 text-xs truncate min-w-0">
          <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${modeInfo.badgeColor} shrink-0`}>
            <ModeIcon className="w-3.5 h-3.5" />
            <span className={`w-1.5 h-1.5 rounded-full ${modeInfo.dotColor} animate-pulse`} />
          </div>
          <span className="text-slate-200 font-semibold truncate">{modeInfo.title}</span>
          <span className="text-slate-500 hidden sm:inline truncate">— {modeInfo.desc}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Export Conversation Button */}
          {messages.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                id="export-chat-btn"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-850/80 hover:bg-slate-800 border border-slate-700/60 transition-all shadow-xs"
                title="Exporter la discussion"
              >
                <Download className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline font-medium">Exporter</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl p-1.5 z-50 backdrop-blur-xl space-y-1"
                  >
                    <button
                      onClick={() => handleExportChat('markdown')}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors font-medium"
                    >
                      <FileCode className="w-4 h-4 text-violet-400 shrink-0" />
                      <div>
                        <div>Markdown (.md)</div>
                        <div className="text-[10px] text-slate-500">Idéal pour Obsidian / Notion</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExportChat('txt')}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div>Texte brut (.txt)</div>
                        <div className="text-[10px] text-slate-500">Document texte standard</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              id="clear-chat-btn"
              onClick={onClearMessages}
              title="Effacer l'historique de discussion"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vider</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Persona Selection Subheader */}
      {onChangePersona && (
        <div className="px-3 sm:px-6 py-2 bg-[#0a0f1d]/90 border-b border-slate-850 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-violet-400" />
            <span className="hidden sm:inline">Persona IA :</span>
          </span>
          <div className="flex items-center gap-1.5 min-w-max">
            {CHAT_PERSONAS.map((p) => {
              const isActive = (activePersona || 'general') === p.id;
              const PersonaIcon = 
                p.id === 'coder' ? Code2 :
                p.id === 'writer' ? PenTool :
                p.id === 'analyst' ? LineChart :
                p.id === 'teacher' ? BookOpen :
                Bot;
              return (
                <button
                  key={p.id}
                  onClick={() => onChangePersona(p.id as ChatPersonaRole)}
                  title={p.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-violet-600/30 text-violet-200 border-violet-500/60 shadow-xs'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <PersonaIcon className={`w-3 h-3 ${isActive ? 'text-violet-300' : 'text-slate-500'}`} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Thread Container */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll} 
        className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-6 gemini-bg-subtle relative"
      >
        {/* Floating Scroll-To-Bottom Button */}
        <AnimatePresence>
          {isUserScrolledUp && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => scrollToBottom(true)}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 text-indigo-200 border border-indigo-500/40 shadow-xl backdrop-blur-md text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer ring-1 ring-indigo-500/30"
            >
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-indigo-400" />
              <span>Derniers messages</span>
            </motion.button>
          )}
        </AnimatePresence>
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto my-auto py-6 sm:py-10 text-center space-y-6"
          >
            {/* Animated Gemini Sparkle Logo Aura */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#4E88F5] via-[#9B72CB] to-[#EA7C69] blur-2xl opacity-50 animate-pulse-glow" />
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#d81b60] text-white shadow-2xl border border-white/30 animate-gemini-gradient">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
              </div>
            </div>

            <div className="space-y-2 px-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Arthur IA • Architecture Alpha • Conçu par Arthur Delneste</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight gemini-text-gradient animate-gemini-gradient pb-1">
                Comment puis-je vous aider aujourd'hui ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Posez vos questions complexes, lancez des réflexions logiques, analysez des documents ou composez des œuvres musicales et visuelles.
              </p>
            </div>

            {/* Quick Suggestions Cards with Gemini hover gradients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-left pt-2 px-1">
              {CHAT_SUGGESTIONS.map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSendMessage(item.prompt)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-gradient-to-br hover:from-blue-950/40 hover:via-purple-950/30 hover:to-slate-900 border border-slate-800/90 hover:border-indigo-500/50 transition-all text-slate-300 hover:text-white group shadow-sm text-left backdrop-blur-md cursor-pointer ring-1 ring-white/5 hover:ring-indigo-500/30 relative overflow-hidden"
                >
                  <div className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 group-hover:from-blue-300 group-hover:to-pink-400 flex items-center gap-1.5 mb-1.5 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-400 group-hover:text-pink-400 transition-colors" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2 group-hover:text-slate-200 leading-relaxed">
                    {item.prompt}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          messages.map((msg, index) => {
            const isAI = msg.role === 'assistant';
            const isLatestAI = isAI && index === messages.length - 1;
            const isAudioActive = playbackState.activeId === msg.id;
            const isPlaying = isAudioActive && playbackState.status === 'playing';
            const isPaused = isAudioActive && playbackState.status === 'paused';
            const isBusyTTS = isTTSLoading === msg.id;
            const hasThinking = Boolean(msg.thinking && msg.thinking.trim().length > 0);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                id={`message-${msg.id}`}
                className={`flex gap-2 sm:gap-3 md:gap-4 max-w-[96%] sm:max-w-[90%] md:max-w-3xl lg:max-w-4xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'} w-full`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold select-none shadow-md mt-0.5 ${
                    isAI
                      ? 'bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#d81b60] text-white border border-white/20 shadow-purple-950/60'
                      : 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-200 border border-slate-600 shadow-slate-950/60'
                  }`}
                >
                  {isAI ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`space-y-2 flex-1 min-w-0 ${!isAI && 'text-right'}`}>
                  {/* Thinking Section (Live Streaming & Retractable Block) */}
                  {isAI && hasThinking && (
                    <ThinkingVisualizer 
                      thinkingText={msg.thinking || ""}
                      defaultExpanded={thinkingMode === 'advanced' || msg.isThinkingStream}
                      modelUsed={msg.modelUsed}
                      mode={thinkingMode}
                      isStreaming={msg.isThinkingStream}
                      thinkingDurationMs={msg.thinkingDurationMs}
                    />
                  )}

                  {/* Main Bubble */}
                  {msg.isError ? (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 shadow-xl text-rose-200 space-y-3 backdrop-blur-xl ring-1 ring-rose-500/20">
                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Incident de communication avec le modèle</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.canRetry && onRetryMessage && (
                        <div className="pt-1">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRetryMessage(msg.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/50 transition-all disabled:opacity-50 min-h-[36px]"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Réessayer la requête</span>
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`inline-block text-left p-3 sm:p-4 rounded-2xl max-w-full ${
                        isAI
                          ? 'bg-slate-900/90 text-slate-200 border border-slate-800/90 shadow-xl leading-relaxed backdrop-blur-xl ring-1 ring-white/5'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white leading-relaxed font-normal shadow-lg shadow-indigo-950/50 border border-blue-400/20'
                      }`}
                    >
                      {isAI ? (
                        <TypewriterMarkdown 
                          content={msg.content || (msg.isStreaming ? "..." : "")} 
                          isStreaming={msg.isStreaming && !msg.isThinkingStream}
                          isLatest={isLatestAI && !isBusyTTS} 
                        />
                      ) : (
                        <div>
                          {/* Attached documents list in user bubble */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-white/20">
                              {msg.attachments.map((att) => (
                                <div 
                                  key={att.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs shadow-xs"
                                >
                                  {getDocumentIcon(att.type)}
                                  <span className="font-medium truncate max-w-[180px] sm:max-w-[240px]">{att.name}</span>
                                  <span className="text-[10px] text-violet-200 bg-black/25 px-1.5 py-0.5 rounded font-mono">
                                    {(att.size / 1024).toFixed(1)} Ko
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                        </div>
                      )}

                      {/* Web Grounding Sources */}
                      {isAI && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="text-slate-400 font-semibold">Sources Web :</span>
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-850 text-blue-400 hover:text-blue-300 hover:underline border border-slate-700/80 truncate max-w-[180px] sm:max-w-[220px] transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Google Maps Grounding Places */}
                      {isAI && msg.mapPlaces && msg.mapPlaces.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Lieux identifiés avec Google Maps :</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.mapPlaces.map((place, pIdx) => (
                              <a
                                key={pIdx}
                                href={place.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title + ' ' + (place.address || ''))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-1 group/place text-left"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <span className="text-xs font-medium text-slate-200 group-hover/place:text-emerald-300 line-clamp-1">
                                    {place.title}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover/place:text-emerald-400 shrink-0 mt-0.5" />
                                </div>
                                {place.address && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{place.address}</p>
                                )}
                                {(place.rating || place.reviewCount) && (
                                  <div className="flex items-center gap-2 text-[10px] text-amber-400 font-medium pt-0.5">
                                    {place.rating && (
                                      <span className="flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        <span>{place.rating}</span>
                                      </span>
                                    )}
                                    {place.reviewCount && (
                                      <span className="text-slate-500">({place.reviewCount} avis)</span>
                                    )}
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar for AI message: Text-To-Speech (Play/Pause) & Copy */}
                  {isAI && !msg.isError && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 px-0.5 text-slate-400 text-xs">
                      {/* TTS Speak / Pause / Resume Button with Animated Waveform */}
                      <motion.button
                        id={`tts-btn-${msg.id}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTTS(msg)}
                        disabled={isBusyTTS}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all min-h-[36px] ${
                          isPlaying
                            ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-950/60 ring-1 ring-violet-400/40'
                            : isPaused
                            ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={
                          isPlaying 
                            ? 'Mettre en pause la lecture vocale' 
                            : isPaused 
                            ? 'Reprendre la lecture vocale' 
                            : 'Écouter la réponse avec la synthèse vocale'
                        }
                      >
                        {isBusyTTS ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                        ) : isPlaying ? (
                          <>
                            {/* Animated Equalizer Waveform */}
                            <div className="flex items-center gap-0.5 h-3.5 px-0.5">
                              <span className="w-1 bg-white rounded-full animate-sound-wave-1" />
                              <span className="w-1 bg-white rounded-full animate-sound-wave-2" />
                              <span className="w-1 bg-white rounded-full animate-sound-wave-3" />
                              <span className="w-1 bg-white rounded-full animate-sound-wave-4" />
                              <span className="w-1 bg-white rounded-full animate-sound-wave-5" />
                            </div>
                            <Pause className="w-3 h-3 ml-0.5" />
                            <span>Pause</span>
                          </>
                        ) : isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                            <span>Reprendre</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                            <span>Écouter</span>
                          </>
                        )}
                      </motion.button>

                      {/* Copy Text Button with label */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all min-h-[36px] ${
                          copiedId === msg.id
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-xs'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Copier l'intégralité de la réponse dans le presse-papier"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier le texte</span>
                          </>
                        )}
                      </motion.button>

                      {msg.modelUsed && (
                        <span className="text-[10px] font-mono text-slate-500 ml-auto hidden sm:inline">
                          {msg.modelUsed.replace('gemini-', '')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Fallback connection loader when initiating stream */}
        {isLoading && !messages.some((m) => m.isStreaming) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex gap-3 max-w-xl mr-auto items-start relative z-10"
          >
            {/* AI Avatar */}
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md border border-white/10 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            {/* Simple, Sleek Thinking Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-xl max-w-md w-full backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Arthur IA réfléchit…</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {loadingSeconds.toFixed(1)}s
                  </span>
                  {onStopGeneration && (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5 fill-slate-300" />
                      <span>Arrêter</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Phase status & sleek linear progress */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-indigo-300/90 truncate font-mono">
                  {thinkingPhases[thinkingStepIndex]?.title || 'Analyse en cours...'}
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: '15%' }}
                    animate={{ width: `${Math.min(95, 25 + thinkingStepIndex * 25)}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="p-2.5 sm:p-4 bg-[#090e18]/90 backdrop-blur-xl border-t border-slate-800/80 shrink-0 mb-14 md:mb-0 shadow-2xl">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.markdown,.csv,.tsv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.xml,.yaml,.yml,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {/* Attached Documents Preview Tray */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-4xl mx-auto mb-2.5 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-violet-300 px-1">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>{attachments.length} document(s) prêt(s) pour analyse</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Tout retirer
                </button>
              </div>

              {/* Document Pills */}
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <motion.div
                    key={att.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-slate-900/90 border border-violet-500/40 text-slate-200 text-xs shadow-md backdrop-blur-md group"
                  >
                    {getDocumentIcon(att.type)}
                    <span className="font-medium truncate max-w-[150px] sm:max-w-[220px] text-slate-200" title={att.name}>
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      {(att.size / 1024).toFixed(1)} Ko
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      title="Retirer ce fichier"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Quick Analysis Smart Prompts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium mr-1">Raccourcis :</span>
                {[
                  { label: '📑 Synthèse complète', prompt: 'Fais une synthèse structurée et exhaustive de ce document avec les points clés et conclusions.' },
                  { label: '🔍 Extraire données & chiffres', prompt: 'Extrais tous les chiffres clés, métriques, tableaux et données quantitatives importantes de ce document.' },
                  { label: '🎯 Fiche exécutive', prompt: 'Rédige une fiche exécutive condensée en 5 points stratégiques essentiels.' },
                  { label: '💡 Recommandations', prompt: 'Analyse ce document et formule un plan d’action avec des recommandations concrètes.' },
                ].map((item, qIdx) => (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => handleSendCustomPrompt(item.prompt)}
                    disabled={isLoading}
                    className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 border border-violet-700/50 hover:border-violet-400 transition-all font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto relative flex items-end gap-2">
          {/* File Attachment Paperclip Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isReadingFiles}
            className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all relative ${
              attachments.length > 0
                ? 'bg-violet-900/60 text-violet-200 border-violet-500 shadow-md shadow-violet-950/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Joindre un document (PDF, Word, Code, Tableur, Image, Markdown...)"
          >
            {isReadingFiles ? (
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            {attachments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </motion.button>

          {/* Voice Input Mic Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleSpeechRecognition}
            className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-950/60'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isListening ? 'Arrêter la dictée' : 'Dicter votre message au microphone'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>

          {/* Text Area */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              id="chat-input-textarea"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Dictée vocale en cours...'
                  : attachments.length > 0
                  ? 'Posez une question sur le document joint (ou cliquez sur Envoyer)...'
                  : 'Posez votre question à Arthur IA (ou glissez un document)...'
              }
              className="w-full resize-none py-3 pl-4 pr-3 rounded-xl bg-slate-900/90 border border-slate-800/90 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all max-h-32 min-h-[44px] backdrop-blur-md"
            />
          </div>

          {/* Send / Stop Button */}
          {isLoading && onStopGeneration ? (
            <motion.button
              type="button"
              id="stop-generation-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={onStopGeneration}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-950/60 cursor-pointer transition-all border border-rose-400/30"
              title="Interrompre la génération"
            >
              <Square className="w-4 h-4 fill-white" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              id="send-message-btn"
              whileHover={{ scale: (!inputText.trim() && attachments.length === 0) || isReadingFiles ? 1 : 1.05 }}
              whileTap={{ scale: 0.92 }}
              disabled={(!inputText.trim() && attachments.length === 0) || isReadingFiles}
              className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer ${getAccentButtonClass()}`}
              title={attachments.length > 0 ? "Envoyer le message avec les documents" : "Envoyer le message"}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </form>

        {/* Keyboard shortcut hint bar */}
        <div className="max-w-4xl mx-auto flex items-center justify-between pt-2 px-1 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Entrée</kbd> Envoyer</span>
            <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Maj+Entrée</kbd> Saut de ligne</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-400/80">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-violet-300 border border-slate-700">Ctrl + K</kbd>
            <span className="hidden sm:inline">Palette d'actions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
