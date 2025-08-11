import { useState, useEffect, useCallback, useRef } from 'react';
import { errorHandler } from './errorHandler';
import { 
  edgeTTSService, 
  EdgeTTSService,
  EdgeTTSServiceError,
  type EdgeTTSRequest,
  type EdgeTTSResponse,
  getSeniorFriendlyVoices,
  formatSpeechDuration
} from './edgeTTSService';

export interface AudioNarrationState {
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentText: string;
  position: number;
  rate: number;
  volume: number;
  voice: SpeechSynthesisVoice | string | null; // Can be Web Speech voice or Edge TTS voice name
  usingEdgeTTS: boolean;
  isServerAvailable: boolean | null;
  estimatedDuration: number;
  isLoading: boolean;
}

export interface AudioNarrationControls {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  resume: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | string) => void;
  toggleTTSMode: () => void;
  getText: () => string;
  getFormattedDuration: () => string;
}

export function useAudioNarration(
  text: string,
  preferEdgeTTS = true
): [AudioNarrationState, AudioNarrationControls] {
  // Create a unique ID for this hook instance for logging
  const hookId = useRef(Math.random().toString(36).substr(2, 9));
  
  // Track if this hook instance has been disposed/cleaned up
  const isDisposedRef = useRef(false);
  
  // Refs for managing audio playback
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  
  // Track actual speech state to prevent race conditions
  const actualSpeechStateRef = useRef({
    isActuallySpeaking: false,
    isActuallyPaused: false
  });
  const currentTextRef = useRef<string>('');
  
  const [state, setState] = useState<AudioNarrationState>({
    isPlaying: false,
    isPaused: false,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    currentText: text,
    position: 0,
    rate: 0.9, // Senior-friendly default rate
    volume: 1,
    voice: 'en-US-AriaNeural', // Default to Edge TTS voice
    usingEdgeTTS: preferEdgeTTS,
    isServerAvailable: null,
    estimatedDuration: 0,
    isLoading: false,
  });

  const [_availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  

  // Check Edge TTS server availability on mount
  useEffect(() => {
    let mounted = true;
    
    edgeTTSService.checkServerHealth().then((available) => {
      if (mounted) {
        setState(prev => ({ ...prev, isServerAvailable: available }));
        
        // Switch to Web Speech if Edge TTS server is unavailable and we're trying to use it
        if (!available && state.usingEdgeTTS) {
          setState(prev => ({ ...prev, usingEdgeTTS: false }));
          
          // Announce fallback to users
          announceToScreenReader('High-quality voice unavailable. Using system voice.');
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Load available Web Speech voices for fallback
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    const loadVoices = (): void => {
      const voices = window.speechSynthesis.getVoices();
      
      setAvailableVoices(voices);

      // Set default Web Speech voice if we're not using Edge TTS and don't have a voice set
      if (voices.length > 0 && !state.usingEdgeTTS && typeof state.voice === 'string') {
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
  }, [state.isSupported, state.usingEdgeTTS, state.voice]);

  // Clean text for better narration (moved up to be available in useEffect)
  const cleanTextForSpeech = useCallback((rawText: string): string => {
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
        .replace(/🎓/g, 'Graduation cap: ')
        .replace(/📚/g, 'Books: ')
        .replace(/💡/g, 'Light bulb: ')
        .replace(/🔍/g, 'Search: ')
        // Improve pronunciation of common abbreviations
        .replace(/\bAI\b/g, 'Artificial Intelligence')
        .replace(/\bAPI\b/g, 'A P I')
        .replace(/\bURL\b/g, 'U R L')
        .replace(/\bHTML\b/g, 'H T M L')
        .replace(/\bCSS\b/g, 'C S S')
        .replace(/\bJS\b/g, 'JavaScript')
        // Add pauses for better pacing (senior-friendly)
        .replace(/\.\s+/g, '. ')
        .replace(/:\s+/g, ': ')
        .replace(/;\s+/g, '; ')
        .replace(/\?\s+/g, '? ')
        .replace(/!\s+/g, '! ')
        .replace(/\n\n/g, ' ')
        .replace(/\n/g, ' ')
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }, []);

  // Update estimated duration when text or rate changes
  useEffect(() => {
    const cleanText = cleanTextForSpeech(text);
    const duration = edgeTTSService.estimateDuration(cleanText, state.rate);
    setState(prev => ({ ...prev, estimatedDuration: duration, currentText: cleanText }));
  }, [text, state.rate, cleanTextForSpeech]);


  const play = useCallback(async (): Promise<void> => {
    if (isDisposedRef.current) {
      return;
    }

    const cleanText = cleanTextForSpeech(text);
    setState(prev => ({ ...prev, currentText: cleanText, isLoading: true }));

    try {
      // Try Edge TTS first if preferred and server is available
      if (state.usingEdgeTTS && state.isServerAvailable) {
        const voiceName = typeof state.voice === 'string' ? state.voice : 'en-US-AriaNeural';
        
        const request: EdgeTTSRequest = {
          text: cleanText,
          voice: voiceName,
          rate: state.rate
        };

        try {
          const response: EdgeTTSResponse = await edgeTTSService.generateSpeech(request);
          
          // Clean up previous audio
          if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current = null;
          }
          if (currentAudioUrlRef.current) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }

          // Create new audio element
          const audio = edgeTTSService.createAudioElement(response.audioUrl, state.volume);
          audioElementRef.current = audio;
          currentAudioUrlRef.current = response.audioUrl;

          // Set up audio event listeners
          audio.addEventListener('loadstart', () => {
            setState(prev => ({ ...prev, isPlaying: true, isPaused: false, isLoading: false }));
            announceToScreenReader('Audio is playing with high-quality voice.');
          });

          audio.addEventListener('ended', () => {
            setState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }));
            announceToScreenReader('Audio playback completed.');
          });

          audio.addEventListener('pause', () => {
            setState(prev => ({ ...prev, isPaused: true }));
          });

          audio.addEventListener('play', () => {
            setState(prev => ({ ...prev, isPaused: false }));
          });

          audio.addEventListener('timeupdate', () => {
            if (audio.duration > 0) {
              setState(prev => ({ ...prev, position: Math.round((audio.currentTime / audio.duration) * 100) }));
            }
          });

          audio.addEventListener('error', (event) => {
            const audioElement = event.target as HTMLAudioElement;
            const errorMessage = `Edge TTS audio playback failed: ${audioElement.error?.message || 'Unknown error'}`;
            
            errorHandler.logError(
              'Edge TTS audio playback error',
              new Error(errorMessage),
              {
                component: 'audio_narration',
                action: 'edge_tts_playback',
                metadata: {
                  hookId: hookId.current,
                  errorCode: audioElement.error?.code,
                  voice: voiceName,
                  textLength: cleanText.length
                }
              }
            );

            setState(prev => ({ ...prev, isPlaying: false, isPaused: false, isLoading: false }));
            announceToScreenReader('High-quality voice failed. Switching to system voice.');
            
            // Fall back to Web Speech API
            setTimeout(() => playWithWebSpeech(cleanText), 100);
          });

          // Start playback
          await audio.play();
          return;

        } catch (error) {
          // Edge TTS failed, fall back to Web Speech API
          errorHandler.logWarning(
            'Edge TTS generation failed, falling back to Web Speech API',
            {
              component: 'audio_narration',
              action: 'edge_tts_fallback',
              metadata: {
                hookId: hookId.current,
                error: error instanceof Error ? error.message : String(error),
                voice: voiceName,
                textLength: cleanText.length
              }
            }
          );

          announceToScreenReader('High-quality voice unavailable. Using system voice.');
          setState(prev => ({ ...prev, usingEdgeTTS: false }));
          
          // Continue to Web Speech API fallback
        }
      }

      // Use Web Speech API (either as primary choice or fallback)
      await playWithWebSpeech(cleanText);

    } catch (error) {
      errorHandler.logError(
        'Audio narration completely failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'play_failure',
          metadata: {
            hookId: hookId.current,
            textLength: cleanText.length,
            usingEdgeTTS: state.usingEdgeTTS,
            isServerAvailable: state.isServerAvailable
          }
        }
      );

      setState(prev => ({ ...prev, isPlaying: false, isPaused: false, isLoading: false }));
      announceToScreenReader('Audio playback failed. Please try again.');
    }
  }, [text, state.usingEdgeTTS, state.isServerAvailable, state.voice, state.rate, state.volume]);

  // Helper function for Web Speech API playback
  const playWithWebSpeech = useCallback(async (cleanText: string): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Speech synthesis not supported');
    }

    // Cancel any existing speech
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
    }

    // Create new utterance
    const utterance = new window.SpeechSynthesisUtterance(cleanText);
    utterance.rate = state.rate;
    utterance.volume = state.volume;
    
    if (state.voice && typeof state.voice !== 'string') {
      utterance.voice = state.voice;
    }

    // Set up event listeners
    utterance.onstart = () => {
      actualSpeechStateRef.current.isActuallySpeaking = true;
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState(prev => ({ ...prev, isPlaying: true, isPaused: false, isLoading: false }));
      announceToScreenReader('Audio is playing with system voice.');
    };

    utterance.onend = () => {
      actualSpeechStateRef.current.isActuallySpeaking = false;
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }));
      announceToScreenReader('Audio playback completed.');
    };

    utterance.onpause = () => {
      actualSpeechStateRef.current.isActuallyPaused = true;
      setState(prev => ({ ...prev, isPaused: true }));
    };

    utterance.onresume = () => {
      actualSpeechStateRef.current.isActuallyPaused = false;
      setState(prev => ({ ...prev, isPaused: false }));
    };

    utterance.onerror = (event) => {
      actualSpeechStateRef.current.isActuallySpeaking = false;
      actualSpeechStateRef.current.isActuallyPaused = false;
      
      if (event.error !== 'interrupted') {
        const errorMessage = `Web Speech API failed: ${event.error}`;
        errorHandler.logError(errorMessage, new Error(event.error), {
          component: 'audio_narration',
          action: 'web_speech_api',
          metadata: {
            errorType: event.error,
            textLength: cleanText.length,
            rate: state.rate,
            volume: state.volume,
            voiceName: typeof state.voice !== 'string' ? state.voice?.name ?? 'default' : 'edge-tts-voice',
            hookId: hookId.current
          },
        });
        announceToScreenReader('System voice playback failed. Please try again.');
      }
      
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false, isLoading: false }));
    };

    // Track position (approximate)
    utterance.onboundary = (event) => {
      const boundaryEvent = event as unknown as { charIndex?: number };
      const idx = boundaryEvent.charIndex ?? 0;
      const progress = Math.round((idx / cleanText.length) * 100);
      setState(prev => ({ ...prev, position: progress }));
    };

    utteranceRef.current = utterance;
    
    // Start speech synthesis
    window.speechSynthesis.speak(utterance);
  }, [state.isSupported, state.rate, state.volume, state.voice]);

  const pause = useCallback((): void => {
    if (isDisposedRef.current) return;

    try {
      if (state.usingEdgeTTS && audioElementRef.current) {
        audioElementRef.current.pause();
        announceToScreenReader('Audio paused.');
      } else if (state.isSupported) {
        window.speechSynthesis.pause();
        announceToScreenReader('Audio paused.');
      }
    } catch (error) {
      errorHandler.logError(
        'Failed to pause audio',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'pause',
          metadata: {
            hookId: hookId.current,
            usingEdgeTTS: state.usingEdgeTTS
          }
        },
      );
    }
  }, [state.usingEdgeTTS, state.isSupported]);

  const stop = useCallback((): void => {
    if (isDisposedRef.current) return;

    try {
      if (state.usingEdgeTTS && audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        announceToScreenReader('Audio stopped.');
      } else if (state.isSupported) {
        window.speechSynthesis.cancel();
        actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
        announceToScreenReader('Audio stopped.');
      }
      
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));

    } catch (error) {
      errorHandler.logError(
        'Failed to stop audio',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'stop',
          metadata: {
            hookId: hookId.current,
            usingEdgeTTS: state.usingEdgeTTS
          }
        },
      );
      
      // Force state update even if stop failed
      actualSpeechStateRef.current = { isActuallySpeaking: false, isActuallyPaused: false };
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0,
      }));
    }
  }, [state.usingEdgeTTS, state.isSupported]);

  const resume = useCallback((): void => {
    if (isDisposedRef.current) return;

    try {
      if (state.usingEdgeTTS && audioElementRef.current) {
        audioElementRef.current.play();
        announceToScreenReader('Audio resumed.');
      } else if (state.isSupported) {
        window.speechSynthesis.resume();
        announceToScreenReader('Audio resumed.');
      }
    } catch (error) {
      errorHandler.logError(
        'Failed to resume audio',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'audio_narration',
          action: 'resume',
          metadata: {
            hookId: hookId.current,
            usingEdgeTTS: state.usingEdgeTTS
          }
        },
      );
    }
  }, [state.usingEdgeTTS, state.isSupported]);

  const setRate = useCallback((rate: number): void => {
    // Constrained range for elderly users (0.5 - 1.5)
    const clampedRate = Math.max(0.5, Math.min(1.5, rate));
    setState(prev => ({ ...prev, rate: clampedRate }));
    announceToScreenReader(`Speech rate set to ${Math.round(clampedRate * 100)}%.`);
  }, []);

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    
    // Update current audio if playing
    if (audioElementRef.current) {
      audioElementRef.current.volume = clampedVolume;
    }
    
    announceToScreenReader(`Volume set to ${Math.round(clampedVolume * 100)}%.`);
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice | string): void => {
    setState(prev => ({ ...prev, voice }));
    const voiceName = typeof voice === 'string' ? voice : voice.name;
    announceToScreenReader(`Voice changed to ${voiceName}.`);
  }, []);

  const toggleTTSMode = useCallback((): void => {
    // Only allow toggle if server is available or we're switching away from Edge TTS
    if (state.isServerAvailable || state.usingEdgeTTS) {
      const newMode = !state.usingEdgeTTS;
      setState(prev => ({ ...prev, usingEdgeTTS: newMode }));
      
      const modeDescription = newMode ? 'high-quality voice' : 'system voice';
      announceToScreenReader(`Switched to ${modeDescription}.`);
    } else {
      announceToScreenReader('High-quality voice server is not available.');
    }
  }, [state.isServerAvailable, state.usingEdgeTTS]);

  const getText = useCallback((): string => {
    return state.currentText;
  }, [state.currentText]);

  const getFormattedDuration = useCallback((): string => {
    return formatSpeechDuration(state.estimatedDuration);
  }, [state.estimatedDuration]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      isDisposedRef.current = true;
      
      // Clean up Edge TTS audio
      if (audioElementRef.current) {
        try {
          audioElementRef.current.pause();
          audioElementRef.current = null;
        } catch (error) {
          // Silent cleanup
        }
      }
      
      // Clean up audio URL
      if (currentAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        } catch (error) {
          // Silent cleanup
        }
      }
      
      // Clean up Web Speech API
      if (typeof window !== 'undefined' && utteranceRef.current) {
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
        } catch (error) {
          // Silent cleanup
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
      toggleTTSMode,
      getText,
      getFormattedDuration,
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
    defaultRate: 0.9, // Senior-friendly slower rate
    defaultVolume: 1,
    preferredVoice: 'en-US-AriaNeural', // Default to Edge TTS voice
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
export function getRecommendedVoices(): { edgeTTS: string[]; webSpeech: string[] } {
  return {
    // Edge TTS voices (preferred for seniors)
    edgeTTS: getSeniorFriendlyVoices(),
    // Web Speech API voices (fallback)
    webSpeech: [
      'Microsoft Zira Desktop',
      'Microsoft Susan Desktop',
      'Google UK English Female',
      'Google US English Female',
      'Apple Samantha',
      'Apple Victoria',
    ]
  };
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

// Enhanced hook alias for backward compatibility
export const useEnhancedAudioNarration = useAudioNarration;

// Export Edge TTS service for advanced usage
export { edgeTTSService, EdgeTTSServiceError } from './edgeTTSService';

/**
 * Get available Edge TTS voices with senior-friendly information
 */
export async function getEdgeTTSVoices() {
  try {
    const voices = await edgeTTSService.getAvailableVoices();
    return voices;
  } catch (error) {
    errorHandler.logWarning(
      'Failed to get Edge TTS voices',
      {
        component: 'audio_narration',
        action: 'get_edge_voices',
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    );
    
    // Return fallback voice information
    return {
      recommended: {
        primary: 'en-US-AriaNeural',
        secondary: 'en-US-JennyNeural',
        alternative: 'en-US-SaraNeural',
        male: 'en-US-GuyNeural'
      },
      all: getSeniorFriendlyVoices().map(voiceName => ({
        name: voiceName,
        description: `${voiceName.replace('en-US-', '').replace('Neural', '')} - High-quality voice optimized for seniors`,
        gender: voiceName.includes('Guy') ? 'male' : 'female' as const,
        language: 'en-US',
        isRecommendedForSeniors: true
      })),
      settings: {
        recommendedRate: 0.9,
        rateRange: { min: 0.5, max: 1.5 },
        maxTextLength: 5000
      }
    };
  }
}
