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
  const hookId = useRef(Math.random().toString(36).substr(2, 9));
  const logPrefix = `[AudioNarration-${hookId.current}]`;
  
  // Track if this hook instance has been disposed/cleaned up
  const isDisposedRef = useRef(false);
  
  console.log(`${logPrefix} Hook initialized with text length:`, text.length);
  
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
    isActuallyPaused: false
  });
  const currentTextRef = useRef<string>('');
  const [_availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  
  console.log(`${logPrefix} Initial state:`, {
    isSupported: state.isSupported,
    textLength: text.length
  });

  // Load available voices
  useEffect(() => {
    console.log(`${logPrefix} Loading voices, isSupported:`, state.isSupported);
    
    if (!state.isSupported) {
      console.log(`${logPrefix} Speech synthesis not supported, skipping voice loading`);
      return;
    }

    const loadVoices = (): void => {
      console.log(`${logPrefix} loadVoices called at:`, new Date().toISOString());
      const voices = window.speechSynthesis.getVoices();
      console.log(`${logPrefix} Found ${voices.length} voices:`, voices.map(v => ({ name: v.name, lang: v.lang })));
      
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

        console.log(`${logPrefix} Setting default voice:`, {
          name: preferredVoice.name,
          lang: preferredVoice.lang
        });
        setState((prev) => ({ ...prev, voice: preferredVoice }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    console.log(`${logPrefix} Voice loading setup complete`);
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
    console.log(`${logPrefix} Text change effect triggered`, {
      timestamp: new Date().toISOString(),
      isSupported: state.isSupported,
      textLength: text.length,
      textPreview: text.substring(0, 50) + '...'
    });
    
    if (!state.isSupported) {
      console.log(`${logPrefix} Speech not supported, skipping utterance creation`);
      return;
    }

    const cleanText = cleanTextForSpeech(text);
    
    // Only recreate utterance if text actually changed
    if (currentTextRef.current === cleanText && utteranceRef.current) {
      console.log(`${logPrefix} Text unchanged, reusing existing utterance`);
      return;
    }
    
    console.log(`${logPrefix} Creating new utterance`, {
      timestamp: new Date().toISOString(),
      cleanTextLength: cleanText.length,
      wasNull: utteranceRef.current === null
    });
    
    // Cancel any existing speech before creating new utterance
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      console.log(`${logPrefix} Cancelling existing speech before creating new utterance`);
      window.speechSynthesis.cancel();
      actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
    }

    const newUtterance = new window.SpeechSynthesisUtterance(cleanText);
    currentTextRef.current = cleanText;

    // Apply current settings to utterance
    newUtterance.rate = state.rate;
    newUtterance.volume = state.volume;
    if (state.voice) {
      newUtterance.voice = state.voice;
    }
    
    console.log(`${logPrefix} Utterance created with settings:`, {
      rate: newUtterance.rate,
      volume: newUtterance.volume,
      voice: newUtterance.voice?.name ?? 'default'
    });

    newUtterance.onstart = (): void => {
      console.log(`${logPrefix} Speech started at:`, new Date().toISOString());
      actualSpeechStateRef.current.isActuallySpeaking = true;
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
    };

    newUtterance.onend = (): void => {
      console.log(`${logPrefix} Speech ended at:`, new Date().toISOString());
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
      console.log(`${logPrefix} Speech paused at:`, new Date().toISOString());
      actualSpeechStateRef.current.isActuallyPaused = true;
      setState((prev) => ({ ...prev, isPaused: true }));
    };

    newUtterance.onresume = (): void => {
      console.log(`${logPrefix} Speech resumed at:`, new Date().toISOString());
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState((prev) => ({ ...prev, isPaused: false }));
    };

    newUtterance.onerror = (event): void => {
      console.log(`${logPrefix} Speech error at:`, new Date().toISOString(), {
        errorType: event.error,
        isInterrupted: event.error === 'interrupted'
      });
      
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
            hookId: hookId.current
          },
        });
      }
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false }));
    };

    // Track position (approximate)
    newUtterance.onboundary = (event): void => {
      // Some browsers may not provide charIndex reliably
      const idx = (event as unknown as { charIndex?: number }).charIndex ?? 0;
      console.log(`${logPrefix} Speech boundary at position:`, idx);
      setState((prev) => ({ ...prev, position: idx }));
    };

    utteranceRef.current = newUtterance;
    setState((prev) => ({ ...prev, currentText: cleanText }));
    console.log(`${logPrefix} Utterance setup complete`);
  }, [text, state.isSupported]); // Only depend on text and isSupported, not rate/volume/voice
  
  // Separate effect to handle rate/volume/voice changes on existing utterance
  useEffect(() => {
    console.log(`${logPrefix} Settings change effect triggered`, {
      timestamp: new Date().toISOString(),
      rate: state.rate,
      volume: state.volume,
      voice: state.voice?.name ?? 'none',
      hasUtterance: !!utteranceRef.current
    });
    
    if (!utteranceRef.current) {
      console.log(`${logPrefix} No utterance to update settings on`);
      return;
    }
    
    // Update existing utterance settings without recreating it
    utteranceRef.current.rate = state.rate;
    utteranceRef.current.volume = state.volume;
    if (state.voice) {
      utteranceRef.current.voice = state.voice;
    }
    
    console.log(`${logPrefix} Updated utterance settings:`, {
      rate: utteranceRef.current.rate,
      volume: utteranceRef.current.volume,
      voice: utteranceRef.current.voice?.name ?? 'default'
    });
  }, [state.rate, state.volume, state.voice]);

  const play = useCallback((): void => {
    console.log(`${logPrefix} play() called at:`, new Date().toISOString(), {
      isSupported: state.isSupported,
      hasUtterance: !!utteranceRef.current,
      actualSpeechState: actualSpeechStateRef.current,
      reactState: { isPlaying: state.isPlaying, isPaused: state.isPaused },
      synthesisSpeaking: typeof window !== 'undefined' ? window.speechSynthesis.speaking : 'unknown',
      synthesisPending: typeof window !== 'undefined' ? window.speechSynthesis.pending : 'unknown',
      isDisposed: isDisposedRef.current
    });
    
    if (isDisposedRef.current) {
      console.log(`${logPrefix} Cannot play - hook instance has been disposed`);
      return;
    }
    
    if (!state.isSupported || !utteranceRef.current) {
      console.log(`${logPrefix} Cannot play - missing requirements:`, {
        isSupported: state.isSupported,
        hasUtterance: !!utteranceRef.current
      });
      
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
      
      console.log(`${logPrefix} Speech synthesis state check:`, {
        synthesisSpeaking,
        synthesisPending,
        actuallyPaused: actualSpeechStateRef.current.isActuallyPaused
      });
      
      // If speech is paused, resume instead of starting new
      if (actualSpeechStateRef.current.isActuallyPaused && synthesisSpeaking) {
        console.log(`${logPrefix} Resuming paused speech instead of restarting`);
        window.speechSynthesis.resume();
        return;
      }
      
      // Only cancel if there's actually something playing to avoid interruption errors
      if (synthesisSpeaking || synthesisPending) {
        console.log(`${logPrefix} Cancelling existing speech before starting new`);
        window.speechSynthesis.cancel();
        actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
        
        // Add small delay to ensure cancel completes
        setTimeout(() => {
          try {
            console.log(`${logPrefix} Starting speech after cancel delay`);
            window.speechSynthesis.speak(utteranceRef.current!);
          } catch (delayedError) {
            console.log(`${logPrefix} Error starting speech after delay:`, delayedError);
            errorHandler.logError(
              'Failed to start speech synthesis after delay',
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
        }, 100);
      } else {
        // Start new speech immediately if nothing is playing
        console.log(`${logPrefix} Starting speech immediately`);
        window.speechSynthesis.speak(utteranceRef.current);
      }
    } catch (error) {
      console.log(`${logPrefix} Error in play():`, error);
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
  }, [state.isSupported, state.currentText.length, state.voice, state.isPlaying, state.isPaused]);

  const pause = useCallback((): void => {
    console.log(`${logPrefix} pause() called at:`, new Date().toISOString(), {
      isSupported: state.isSupported,
      actualSpeechState: actualSpeechStateRef.current,
      synthesisSpeaking: typeof window !== 'undefined' ? window.speechSynthesis.speaking : 'unknown',
      isDisposed: isDisposedRef.current
    });
    
    if (isDisposedRef.current) {
      console.log(`${logPrefix} Cannot pause - hook instance has been disposed`);
      return;
    }
    
    if (!state.isSupported) {
      console.log(`${logPrefix} Cannot pause - speech not supported`);
      return;
    }

    try {
      window.speechSynthesis.pause();
      console.log(`${logPrefix} Speech paused successfully`);
    } catch (error) {
      console.log(`${logPrefix} Error pausing speech:`, error);
      errorHandler.logError(
        'Failed to pause speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'pause',
          metadata: {
            hookId: hookId.current
          }
        },
      );
    }
  }, [state.isSupported]);

  const stop = useCallback((): void => {
    console.log(`${logPrefix} stop() called at:`, new Date().toISOString(), {
      isSupported: state.isSupported,
      actualSpeechState: actualSpeechStateRef.current,
      synthesisSpeaking: typeof window !== 'undefined' ? window.speechSynthesis.speaking : 'unknown',
      isDisposed: isDisposedRef.current
    });
    
    if (isDisposedRef.current) {
      console.log(`${logPrefix} Cannot stop - hook instance has been disposed`);
      return;
    }
    
    if (!state.isSupported) {
      console.log(`${logPrefix} Cannot stop - speech not supported`);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
      console.log(`${logPrefix} Speech stopped successfully`);
      
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    } catch (error) {
      console.log(`${logPrefix} Error stopping speech:`, error);
      errorHandler.logError(
        'Failed to stop speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'stop',
          metadata: {
            hookId: hookId.current
          }
        },
      );
      // Still update state even if stop failed
      actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    }
  }, [state.isSupported]);

  const resume = useCallback((): void => {
    console.log(`${logPrefix} resume() called at:`, new Date().toISOString(), {
      isSupported: state.isSupported,
      actualSpeechState: actualSpeechStateRef.current,
      synthesisSpeaking: typeof window !== 'undefined' ? window.speechSynthesis.speaking : 'unknown',
      isDisposed: isDisposedRef.current
    });
    
    if (isDisposedRef.current) {
      console.log(`${logPrefix} Cannot resume - hook instance has been disposed`);
      return;
    }
    
    if (!state.isSupported) {
      console.log(`${logPrefix} Cannot resume - speech not supported`);
      return;
    }

    try {
      window.speechSynthesis.resume();
      console.log(`${logPrefix} Speech resumed successfully`);
    } catch (error) {
      console.log(`${logPrefix} Error resuming speech:`, error);
      errorHandler.logError(
        'Failed to resume speech synthesis',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'resume',
          metadata: {
            hookId: hookId.current
          }
        },
      );
    }
  }, [state.isSupported]);

  const setRate = useCallback((rate: number): void => {
    const clampedRate = Math.max(0.1, Math.min(2, rate));
    console.log(`${logPrefix} setRate() called:`, {
      originalRate: rate,
      clampedRate,
      timestamp: new Date().toISOString()
    });
    setState((prev) => ({ ...prev, rate: clampedRate }));
  }, []);

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    console.log(`${logPrefix} setVolume() called:`, {
      originalVolume: volume,
      clampedVolume,
      timestamp: new Date().toISOString()
    });
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice): void => {
    console.log(`${logPrefix} setVoice() called:`, {
      voiceName: voice.name,
      voiceLang: voice.lang,
      timestamp: new Date().toISOString()
    });
    setState((prev) => ({ ...prev, voice }));
  }, []);

  const getText = useCallback((): string => {
    console.log(`${logPrefix} getText() called, returning ${state.currentText.length} characters`);
    return state.currentText;
  }, [state.currentText]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log(`${logPrefix} Hook cleanup - marking instance as disposed`);
      isDisposedRef.current = true;
      
      // Only cancel speech if this specific instance's utterance is currently playing
      if (typeof window !== 'undefined' && utteranceRef.current) {
        try {
          // Check if the current utterance matches this instance's utterance
          // We can't directly check if our utterance is the one playing, but we can
          // check if speech is active and we have an utterance
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            console.log(`${logPrefix} Speech is active during cleanup - cancelling to prevent interference`);
            window.speechSynthesis.cancel();
          }
        } catch (error) {
          console.log(`${logPrefix} Error during cleanup:`, error);
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
