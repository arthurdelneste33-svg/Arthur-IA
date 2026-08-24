export type TabType = 'chat' | 'audio' | 'images' | 'documents' | 'settings';

export type ThinkingMode = 'fast' | 'normal' | 'advanced';

export type ResponseVerbosity = 'concise' | 'standard' | 'detailed';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warn';
  title?: string;
  message: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  thinking?: string;
  thinkingDurationMs?: number;
  modelUsed?: string;
  mode?: ThinkingMode;
  verbosity?: ResponseVerbosity;
  sources?: Array<{ title: string; url: string }>;
  audioBase64?: string;
  isError?: boolean;
  canRetry?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  prompt: string;
  style: string;
  genre?: string;
  duration: number;
  audioUrl: string;
  audioBase64?: string;
  mimeType: string;
  createdAt: string;
  engine?: string;
  lyrics?: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: '16:9' | '1:1' | '9:16' | '4:3';
  quality: 'HD' | 'Ultra';
  imageUrl: string;
  createdAt: string;
  width?: number;
  height?: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  textContent: string;
  base64Data?: string;
  mimeType?: string;
  uploadedAt: string;
  wordCount?: number;
  tokenCount?: number;
  summary?: string;
  executiveSummary?: string;
  qas: Array<{
    id: string;
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export type ThemeType = 'dark-modern' | 'dark-oled' | 'dark-navy';
export type AccentColorType = 'purple' | 'emerald' | 'amber' | 'cyan';
export type TTSVoice = 'Kore' | 'Fenrir' | 'Puck' | 'Zephyr' | 'Charon';
export type TTSSpeed = 0.75 | 1 | 1.25 | 1.5;

export interface AppSettings {
  theme: ThemeType;
  accentColor: AccentColorType;
  ttsVoice: TTSVoice;
  ttsSpeed: TTSSpeed;
  defaultThinkingMode: ThinkingMode;
  responseVerbosity: ResponseVerbosity;
  autoPlayTts: boolean;
  webSearchDefault: boolean;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'success' | 'warn' | 'debug';
  message: string;
  timestamp: string;
  module: string;
}

export interface SystemDiagnostics {
  llmCore: 'checking' | 'operational' | 'error';
  speechEngine: 'checking' | 'operational' | 'error';
  musicEngine: 'checking' | 'operational' | 'error';
  imageEngine: 'checking' | 'operational' | 'error';
  documentParser: 'checking' | 'operational' | 'error';
  sandboxSecurity: 'checking' | 'operational' | 'error';
  lastChecked?: string;
  latencyMs?: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warn';
  title?: string;
  message: string;
  timestamp?: number;
}

