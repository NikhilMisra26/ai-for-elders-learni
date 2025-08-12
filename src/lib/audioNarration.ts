import { useState, useEffect, useCallback, useRef } from 'react';

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
  // Create a unique ID for this hook instance for logging
  const hookId = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substr(2, 9),
  );

  // Track if this hook instance has been disposed/cleaned up
  const isDisposedRef = useRef(false);

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

  // Use refs to prevent recreation during renders
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const actualSpeechStateRef = useRef({
    isActuallySpeaking: false,
    isActuallyPaused: false,
  });
  const currentTextRef = useRef<string>('');
  const [_availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  // Load available voices
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

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

  // Create or update utterance when text actually changes (not on rate/volume/voice changes)
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    const cleanText = cleanTextForSpeech(text);

    // Only recreate utterance if text actually changed
    if (currentTextRef.current === cleanText && utteranceRef.current) {
      return;
    }

    // Cancel any existing speech before creating new utterance
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      actualSpeechStateRef.current = {
        isActuallySpeaking: false,
        isActuallyPaused: false,
      };
    }

    const newUtterance = new window.SpeechSynthesisUtterance(cleanText);
    currentTextRef.current = cleanText;

    // Apply current settings to utterance
    newUtterance.rate = state.rate;
    newUtterance.volume = state.volume;
    if (state.voice) {
      newUtterance.voice = state.voice;
    }

    newUtterance.onstart = (): void => {
      actualSpeechStateRef.current.isActuallySpeaking = true;
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
    };

    newUtterance.onend = (): void => {
      actualSpeechStateRef.current.isActuallySpeaking = false;
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    };

    newUtterance.onpause = (): void => {
      actualSpeechStateRef.current.isActuallyPaused = true;
      setState((prev) => ({ ...prev, isPaused: true }));
    };

    newUtterance.onresume = (): void => {
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState((prev) => ({ ...prev, isPaused: false }));
    };

    newUtterance.onerror = (event): void => {
      actualSpeechStateRef.current.isActuallySpeaking = false;
      actualSpeechStateRef.current.isActuallyPaused = false;

      // Don't log 'interrupted' as an error since it's expected when user stops/restarts audio
      if (event.error !== 'interrupted') {
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
            hookId: hookId.current,
          },
        });
      }
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    };

    // Track position (approximate)
    newUtterance.onboundary = (event): void => {
      // Some browsers may not provide charIndex reliably
      const idx = (event as unknown as { charIndex?: number }).charIndex ?? 0;
      setState((prev) => ({ ...prev, position: idx }));
    };

    utteranceRef.current = newUtterance;
    setState((prev) => ({ ...prev, currentText: cleanText }));
  }, [text, state.isSupported]); // Only depend on text and isSupported, not rate/volume/voice

  // Separate effect to handle rate/volume/voice changes on existing utterance
  useEffect(() => {
    if (!utteranceRef.current) {
      return;
    }

    // Update existing utterance settings without recreating it
    utteranceRef.current.rate = state.rate;
    utteranceRef.current.volume = state.volume;
    if (state.voice) {
      utteranceRef.current.voice = state.voice;
    }
  }, [state.rate, state.volume, state.voice]);

  const play = useCallback((): void => {
    if (isDisposedRef.current) {
      return;
    }

    if (!state.isSupported || !utteranceRef.current) {
      if (!state.isSupported) {
        errorHandler.logWarning(
          'Speech synthesis not supported in this browser',
          {
            component: 'audio_narration',
            action: 'play_attempt',
            metadata: {
              hookId: hookId.current,
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
      // Check actual speech synthesis state vs our tracked state
      const synthesisSpeaking = window.speechSynthesis.speaking;
      const synthesisPending = window.speechSynthesis.pending;

      // If speech is paused, resume instead of starting new
      if (actualSpeechStateRef.current.isActuallyPaused && synthesisSpeaking) {
        window.speechSynthesis.resume();
        return;
      }

      // Only cancel if there's actually something playing to avoid interruption errors
      if (synthesisSpeaking || synthesisPending) {
        window.speechSynthesis.cancel();
        actualSpeechStateRef.current = {
          isActuallySpeaking: false,
          isActuallyPaused: false,
        };

        // Wait until speechSynthesis is no longer speaking or pending before starting new utterance
        const waitAndSpeak = () => {
          if (
            !window.speechSynthesis.speaking &&
            !window.speechSynthesis.pending
          ) {
            try {
              window.speechSynthesis.speak(utteranceRef.current!);
            } catch (delayedError) {
              errorHandler.logError(
                'Failed to start speech synthesis after waiting',
                delayedError instanceof Error
                  ? delayedError
                  : new Error(String(delayedError)),
                {
                  component: 'audio_narration',
                  action: 'play_delayed',
                  metadata: {
                    hookId: hookId.current,
                    textLength: state.currentText.length,
                    hasVoice: !!state.voice,
                    voiceName: state.voice?.name,
                  },
                },
              );
              setState((prev) => ({
                ...prev,
                isPlaying: false,
                isPaused: false,
              }));
            }
          } else {
            setTimeout(waitAndSpeak, 50);
          }
        };
        waitAndSpeak();
      } else {
        // Start new speech immediately if nothing is playing
        window.speechSynthesis.speak(utteranceRef.current);
      }
    } catch (error) {
      errorHandler.logError(
        'Failed to start speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'play',
          metadata: {
            hookId: hookId.current,
            textLength: state.currentText.length,
            hasVoice: !!state.voice,
            voiceName: state.voice?.name,
          },
        },
      );
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    }
  }, [
    state.isSupported,
    state.currentText.length,
    state.voice,
    state.isPlaying,
    state.isPaused,
  ]);

  const pause = useCallback((): void => {
    if (isDisposedRef.current) {
      return;
    }

    if (!state.isSupported) {
      return;
    }

    try {
      window.speechSynthesis.pause();
    } catch (error) {
      errorHandler.logError(
        'Failed to pause speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'pause',
          metadata: {
            hookId: hookId.current,
          },
        },
      );
    }
  }, [state.isSupported]);

  const stop = useCallback((): void => {
    if (isDisposedRef.current) {
      return;
    }

    if (!state.isSupported) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      actualSpeechStateRef.current = {
        isActuallySpeaking: false,
        isActuallyPaused: false,
      };

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
          metadata: {
            hookId: hookId.current,
          },
        },
      );
      // Still update state even if stop failed
      actualSpeechStateRef.current = {
        isActuallySpeaking: false,
        isActuallyPaused: false,
      };
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    }
  }, [state.isSupported]);

  const resume = useCallback((): void => {
    if (isDisposedRef.current) {
      return;
    }

    if (!state.isSupported) {
      return;
    }

    try {
      window.speechSynthesis.resume();
    } catch (error) {
      errorHandler.logError(
        'Failed to resume speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'resume',
          metadata: {
            hookId: hookId.current,
          },
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      isDisposedRef.current = true;

      // Only cancel speech if this specific instance's utterance is currently playing
      if (typeof window !== 'undefined' && utteranceRef.current) {
        try {
          // Check if the current utterance matches this instance's utterance
          // We can't directly check if our utterance is the one playing, but we can
          // check if speech is active and we have an utterance
          if (
            window.speechSynthesis.speaking ||
            window.speechSynthesis.pending
          ) {
            window.speechSynthesis.cancel();
          }
        } catch (error) {
          // Error during cleanup - this is expected to be silent
        }
      }
    };
  }, []);

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

  // Use DOMParser for safer HTML parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, iframe, object, embed');
  scripts.forEach((el) => el.remove());

  // Extract text content safely
  return doc.body?.textContent ?? '';
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
