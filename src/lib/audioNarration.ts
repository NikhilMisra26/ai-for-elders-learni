import { useState, useEffect, useCallback } from 'react';

import { errorHandler } from './errorHandler';

export interface AudioNarrationState {
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentText: string;
  position: number;
  rate: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
}

export interface AudioNarrationControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  resume: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  getText: () => string;
}

export function useAudioNarration(
  text: string,
): [AudioNarrationState, AudioNarrationControls] {
  const [state, setState] = useState<AudioNarrationState>({
    isPlaying: false,
    isPaused: false,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    currentText: text,
    position: 0,
    rate: 1,
    volume: 1,
    voice: null,
  });

  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(
    null,
  );
  const [, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    if (!state.isSupported) return;

    const loadVoices = (): void => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Set default voice (prefer female voice for senior-friendly experience)
      if (voices.length > 0 && !state.voice) {
        const preferredVoice =
          voices.find(
            (voice) =>
              voice.lang.startsWith('en') &&
              (voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('zira') ||
                voice.name.toLowerCase().includes('susan')),
          ) ??
          voices.find((voice) => voice.lang.startsWith('en')) ??
          voices[0];

        setState((prev) => ({ ...prev, voice: preferredVoice }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [state.isSupported, state.voice]);

  // Clean up text for better narration
  const cleanTextForSpeech = (rawText: string): string => {
    return (
      rawText
        // Remove markdown formatting
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
        // Replace special characters and emojis with spoken equivalents
        .replace(/✅/g, 'Checkmark: ')
        .replace(/❌/g, 'X mark: ')
        .replace(/⚠️/g, 'Warning: ')
        .replace(/🚨/g, 'Alert: ')
        .replace(/🔒/g, 'Lock icon: ')
        // Add pauses for better pacing
        .replace(/\.\s+/g, '. ... ')
        .replace(/:\s+/g, ': ... ')
        .replace(/\n\n/g, ' ... ... ')
        .replace(/\n/g, ' ... ')
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  };

  // Create or update utterance when text changes
  useEffect(() => {
    if (!state.isSupported) return;

    const cleanText = cleanTextForSpeech(text);
    const newUtterance = new window.SpeechSynthesisUtterance(cleanText);

    newUtterance.rate = state.rate;
    newUtterance.volume = state.volume;
    if (state.voice) {
      newUtterance.voice = state.voice;
    }

    newUtterance.onstart = (): void => {
      setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
    };

    newUtterance.onend = (): void => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    };

    newUtterance.onpause = (): void => {
      setState((prev) => ({ ...prev, isPaused: true }));
    };

    newUtterance.onresume = (): void => {
      setState((prev) => ({ ...prev, isPaused: false }));
    };

    newUtterance.onerror = (event): void => {
      const errorMessage = `Speech synthesis failed: ${event.error}`;
      errorHandler.logError(errorMessage, new Error(event.error), {
        component: 'audio_narration',
        action: 'speech_synthesis',
        metadata: {
          errorType: event.error,
          textLength: cleanText.length,
          rate: state.rate,
          volume: state.volume,
          voiceName: state.voice?.name ?? 'default',
        },
      });
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    };

    // Track position (approximate)
    newUtterance.onboundary = (event): void => {
      // Some browsers may not provide charIndex reliably
      const idx = (event as unknown as { charIndex?: number }).charIndex ?? 0;
      setState((prev) => ({ ...prev, position: idx }));
    };

    setUtterance(newUtterance);
    setState((prev) => ({ ...prev, currentText: cleanText }));
  }, [text, state.rate, state.volume, state.voice, state.isSupported]);

  const play = useCallback((): void => {
    if (!state.isSupported || !utterance) {
      if (!state.isSupported) {
        errorHandler.logWarning(
          'Speech synthesis not supported in this browser',
          {
            component: 'audio_narration',
            action: 'play_attempt',
            metadata: {
              userAgent:
                typeof navigator !== 'undefined'
                  ? navigator.userAgent
                  : 'unknown',
              platform:
                typeof navigator !== 'undefined'
                  ? navigator.platform
                  : 'unknown',
            },
          },
        );
      }
      return;
    }

    try {
      // Stop any current speech
      window.speechSynthesis.cancel();

      // Start new speech
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      errorHandler.logError(
        'Failed to start speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'play',
          metadata: {
            textLength: state.currentText.length,
            hasVoice: !!state.voice,
            voiceName: state.voice?.name,
          },
        },
      );
    }
  }, [state.isSupported, utterance, state.currentText.length, state.voice]);

  const pause = useCallback((): void => {
    if (!state.isSupported) return;

    try {
      window.speechSynthesis.pause();
    } catch (error) {
      errorHandler.logError(
        'Failed to pause speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'pause',
        },
      );
    }
  }, [state.isSupported]);

  const stop = useCallback((): void => {
    if (!state.isSupported) return;

    try {
      window.speechSynthesis.cancel();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    } catch (error) {
      errorHandler.logError(
        'Failed to stop speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'stop',
        },
      );
      // Still update state even if stop failed
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    }
  }, [state.isSupported]);

  const resume = useCallback((): void => {
    if (!state.isSupported) return;

    try {
      window.speechSynthesis.resume();
    } catch (error) {
      errorHandler.logError(
        'Failed to resume speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'resume',
        },
      );
    }
  }, [state.isSupported]);

  const setRate = useCallback((rate: number): void => {
    const clampedRate = Math.max(0.1, Math.min(2, rate));
    setState((prev) => ({ ...prev, rate: clampedRate }));
  }, []);

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice): void => {
    setState((prev) => ({ ...prev, voice }));
  }, []);

  const getText = useCallback((): string => {
    return state.currentText;
  }, [state.currentText]);

  return [
    state,
    {
      play,
      pause,
      stop,
      resume,
      setRate,
      setVolume,
      setVoice,
      getText,
    },
  ];
}

// Hook for managing narration preferences
export interface NarrationPreferences {
  autoPlay: boolean;
  defaultRate: number;
  defaultVolume: number;
  preferredVoice: string | null;
  enabled: boolean;
}

export function useNarrationPreferences(): [
  NarrationPreferences | null,
  (updates: Partial<NarrationPreferences>) => void,
] {
  const defaultPrefs: NarrationPreferences = {
    autoPlay: false,
    defaultRate: 1,
    defaultVolume: 1,
    preferredVoice: null,
    enabled: true,
  };
  const [preferences, setPreferences] = useState<NarrationPreferences | null>(
    () => {
      if (typeof window === 'undefined') return null;
      try {
        const saved = window.localStorage.getItem(
          'audio-narration-preferences',
        );
        return saved
          ? (JSON.parse(saved) as NarrationPreferences)
          : defaultPrefs;
      } catch (error) {
        errorHandler.handleStorageError(
          'read narration preferences from localStorage',
          error instanceof Error ? error : new Error(String(error)),
          {
            metadata: { key: 'audio-narration-preferences' },
          },
        );
        return defaultPrefs;
      }
    },
  );

  useEffect(() => {
    if (preferences && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'audio-narration-preferences',
          JSON.stringify(preferences),
        );
      } catch (error) {
        errorHandler.handleStorageError(
          'save narration preferences to localStorage',
          error instanceof Error ? error : new Error(String(error)),
          {
            metadata: {
              key: 'audio-narration-preferences',
              preferences,
            },
          },
        );
      }
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<NarrationPreferences>): void => {
    setPreferences((prev) => ({ ...(prev ?? defaultPrefs), ...updates }));
  };

  return [preferences, updatePreferences] as const;
}

// Utility to extract readable text from HTML content
export function extractTextFromHTML(html: string): string {
  if (typeof document === 'undefined') return html;

  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove script and style elements
  const scripts = div.querySelectorAll('script, style');
  scripts.forEach((el) => el.remove());

  return div.textContent ?? div.innerText ?? '';
}

// Utility to get estimated reading time
export function getEstimatedSpeechTime(text: string, rate = 1): number {
  const wordsPerMinute = 150 * rate; // Average speaking speed
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Component for narration controls
export interface NarrationControlsProps {
  text: string;
  className?: string;
  showSpeed?: boolean;
  showVolume?: boolean;
  showVoiceSelection?: boolean;
  autoPlay?: boolean;
}

// Utility for senior-friendly voice selection
export function getRecommendedVoices(): string[] {
  // Voices that tend to be clearer and more pleasant for seniors
  return [
    'Microsoft Zira Desktop',
    'Microsoft Susan Desktop',
    'Google UK English Female',
    'Google US English Female',
    'Apple Samantha',
    'Apple Victoria',
  ];
}

// Accessibility helpers
export function announceToScreenReader(message: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  try {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    window.setTimeout((): void => {
      try {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      } catch (error) {
        errorHandler.logError(
          'Failed to remove screen reader announcement',
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'audio_narration',
            action: 'cleanup_announcement',
            metadata: { message },
          },
        );
      }
    }, 1000);
  } catch (error) {
    errorHandler.logError(
      'Failed to create screen reader announcement',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'audio_narration',
        action: 'create_announcement',
        metadata: { message },
      },
    );
  }
}

// Format time for display
export function formatSpeechTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}
