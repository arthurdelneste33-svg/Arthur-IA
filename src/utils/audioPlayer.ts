// Audio playback and TTS helper functions with Pause/Resume and State management

export type AudioPlaybackState = 'idle' | 'playing' | 'paused' | 'loading';

type StateChangeListener = (state: { activeId: string | null; status: AudioPlaybackState }) => void;

export class AudioManager {
  private static currentAudio: HTMLAudioElement | null = null;
  private static activePlayingId: string | null = null;
  private static isSpeechSynth = false;
  private static currentStatus: AudioPlaybackState = 'idle';
  private static listeners: Set<StateChangeListener> = new Set();
  private static currentEndCallback: (() => void) | null = null;

  static subscribe(listener: StateChangeListener) {
    this.listeners.add(listener);
    listener({ activeId: this.activePlayingId, status: this.currentStatus });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    this.listeners.forEach((listener) => {
      listener({ activeId: this.activePlayingId, status: this.currentStatus });
    });
  }

  static getStatus(): AudioPlaybackState {
    return this.currentStatus;
  }

  static getActiveId(): string | null {
    return this.activePlayingId;
  }

  static isPlaying(id?: string): boolean {
    if (!id) return this.currentStatus === 'playing';
    return this.activePlayingId === id && this.currentStatus === 'playing';
  }

  static isPaused(id?: string): boolean {
    if (!id) return this.currentStatus === 'paused';
    return this.activePlayingId === id && this.currentStatus === 'paused';
  }

  static stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeechSynth = false;
    this.activePlayingId = null;
    this.currentStatus = 'idle';
    this.currentEndCallback = null;
    this.notify();
  }

  static pauseAudio() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.currentStatus = 'paused';
      this.notify();
      return true;
    }
    if (this.isSpeechSynth && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.currentStatus = 'paused';
      this.notify();
      return true;
    }
    return false;
  }

  static resumeAudio() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.currentStatus = 'playing';
      this.notify();
      return true;
    }
    if (this.isSpeechSynth && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.currentStatus = 'playing';
      this.notify();
      return true;
    }
    return false;
  }

  static async playBase64Audio(
    base64Data: string,
    mimeType = 'audio/wav',
    id = 'audio-item',
    speed = 1,
    onEnd?: () => void
  ): Promise<HTMLAudioElement> {
    this.stopCurrentAudio();
    this.activePlayingId = id;
    this.isSpeechSynth = false;
    this.currentStatus = 'playing';
    this.currentEndCallback = onEnd || null;
    this.notify();

    const audio = new Audio(`data:${mimeType};base64,${base64Data}`);
    audio.playbackRate = speed;
    this.currentAudio = audio;

    audio.onended = () => {
      if (this.activePlayingId === id) {
        this.activePlayingId = null;
        this.currentAudio = null;
        this.currentStatus = 'idle';
        this.notify();
      }
      onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('Audio element error:', e);
      if (this.activePlayingId === id) {
        this.activePlayingId = null;
        this.currentAudio = null;
        this.currentStatus = 'idle';
        this.notify();
      }
      onEnd?.();
    };

    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio playback error:', err);
      this.activePlayingId = null;
      this.currentAudio = null;
      this.currentStatus = 'idle';
      this.notify();
      onEnd?.();
    }
    return audio;
  }

  static speakWithBrowser(
    text: string,
    id = 'tts-speech',
    speed = 1,
    voiceName = 'Kore',
    onEnd?: () => void
  ) {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      onEnd?.();
      return;
    }

    this.stopCurrentAudio();
    this.activePlayingId = id;
    this.isSpeechSynth = true;
    this.currentStatus = 'playing';
    this.currentEndCallback = onEnd || null;
    this.notify();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.lang = 'fr-FR';

    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter((v) => v.lang.startsWith('fr'));
    if (frenchVoices.length > 0) {
      if (voiceName === 'Fenrir' || voiceName === 'Charon') {
        const maleVoice = frenchVoices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('thomas') ||
            v.name.toLowerCase().includes('nicolas') ||
            v.name.toLowerCase().includes('paul')
        );
        utterance.voice = maleVoice || frenchVoices[0];
      } else {
        const femaleVoice = frenchVoices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('julie') ||
            v.name.toLowerCase().includes('hortense') ||
            v.name.toLowerCase().includes('celine')
        );
        utterance.voice = femaleVoice || frenchVoices[0];
      }
    }

    utterance.onend = () => {
      if (this.activePlayingId === id) {
        this.activePlayingId = null;
        this.isSpeechSynth = false;
        this.currentStatus = 'idle';
        this.notify();
      }
      onEnd?.();
    };

    utterance.onerror = () => {
      if (this.activePlayingId === id) {
        this.activePlayingId = null;
        this.isSpeechSynth = false;
        this.currentStatus = 'idle';
        this.notify();
      }
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  static downloadBase64File(base64: string, filename: string, mimeType = 'audio/wav') {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
