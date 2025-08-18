import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { errorHandler } from '@/lib/errorHandler';
import type { AudioPlaylist, AudioFile } from '@/lib/audioMapping';
import { getAudioFilePath } from '@/lib/audioMapping';

export interface MP3AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentFileIndex: number;
  currentFile: AudioFile | null;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  error: string | null;
  hasAudio: boolean;
}

export interface MP3AudioControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentFile: () => AudioFile | null;
  getPlaylist: () => AudioPlaylist | null;
}

/**
 * Custom hook for playing MP3 audio files with playlist support
 * Optimized for performance with minimal re-renders and lazy loading
 */
export function useMP3AudioPlayer(
  playlist: AudioPlaylist | null,
): [MP3AudioState, MP3AudioControls] {
  const [state, setState] = useState<MP3AudioState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentFileIndex: 0,
    currentFile: playlist?.files[0] ?? null,
    duration: 0,
    currentTime: 0,
    volume: 1,
    playbackRate: 1,
    error: null,
    hasAudio: Boolean(playlist?.files.length),
  });

  // Refs for HTML5 Audio element and tracking
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSrcRef = useRef<string | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);
  const isUserInitiated = useRef(false);
  const previousPlaylistRef = useRef<AudioPlaylist | null>(playlist);
  const hookId = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substr(2, 9),
  );

  // Memoize the current audio path to prevent unnecessary recalculations
  const currentAudioPath = useMemo(() => {
    if (!state.currentFile) return null;
    return getAudioFilePath(state.currentFile.filename);
  }, [state.currentFile]);

  // Create audio element ONCE and reuse it
  useEffect(() => {
    // Only create audio element if we don't have one
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'none'; // Don't preload to save bandwidth
      audioRef.current = audio;
    }

    // Cleanup on unmount
    return (): void => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Handle playlist changes - stop audio when playlist changes or becomes null
  useEffect(() => {
    const prevPlaylist = previousPlaylistRef.current;

    // Check if playlist has changed (different module/part)
    const playlistChanged =
      prevPlaylist?.moduleId !== playlist?.moduleId || prevPlaylist?.partId !== playlist?.partId;

    if (playlistChanged) {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Clear the interval if running
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
          timeUpdateIntervalRef.current = null;
        }
      }

      // Reset audio state when playlist changes
      if (playlist) {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          currentFileIndex: 0,
          currentFile: playlist.files[0] ?? null,
          duration: 0,
          currentTime: 0,
          error: null,
          hasAudio: Boolean(playlist.files.length),
        }));

        // Clear the current source reference to force reload
        currentSrcRef.current = null;
      } else {
        // No playlist - clear everything
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          currentFileIndex: 0,
          currentFile: null,
          duration: 0,
          currentTime: 0,
          error: null,
          hasAudio: false,
        }));
      }

      // Update the previous playlist reference
      previousPlaylistRef.current = playlist;
    }
  }, [playlist]); // Only depend on playlist changes, not state

  // Handle audio source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioPath) return undefined;

    // Only update source if it actually changed
    if (currentSrcRef.current === currentAudioPath) return undefined;
    currentSrcRef.current = currentAudioPath;

    // Reset state for new audio
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      isPaused: false,
    }));

    // Event handlers
    const handleLoadStart = (): void => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    };

    const handleCanPlay = (): void => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleLoadedMetadata = (): void => {
      setState((prev) => ({ ...prev, duration: audio.duration || 0 }));
    };

    const handlePlay = (): void => {
      setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));

      // Use interval for time updates to reduce event frequency
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      timeUpdateIntervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          setState((prev) => ({ ...prev, currentTime: audioRef.current?.currentTime ?? 0 }));
        }
      }, 1000); // Update every second instead of continuously
    };

    const handlePause = (): void => {
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };

    const handleEnded = (): void => {
      setState((prev) => ({ ...prev, isPlaying: false, isPaused: false, currentTime: 0 }));
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }

      // Auto-advance to next file if available and auto-advance is enabled
      if (playlist?.autoAdvance && state.currentFileIndex < (playlist?.files.length ?? 0) - 1) {
        const nextIndex = state.currentFileIndex + 1;
        const nextFile = playlist?.files[nextIndex];
        if (nextFile) {
          setState((prev) => ({
            ...prev,
            currentFileIndex: nextIndex,
            currentFile: nextFile,
          }));
        }
      }
    };

    const handleError = (event: Event): void => {
      const audioElement = event.target as HTMLAudioElement;
      const error = audioElement.error;

      let errorMessage = 'Audio playback failed';
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading audio';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Audio file is corrupted or not supported';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
          default:
            errorMessage = 'Unknown audio error occurred';
        }
      }

      // Only log error once per file
      if (currentSrcRef.current) {
        errorHandler.logError(
          `MP3 Audio playback error: ${errorMessage}`,
          new Error(errorMessage),
          {
            component: 'useMP3AudioPlayer',
            action: 'audio_error',
            metadata: {
              hookId: hookId.current,
              filename: state.currentFile?.filename,
              errorCode: error?.code,
            },
          },
        );
      }

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        error: errorMessage,
      }));

      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };

    // Remove old listeners
    audio.removeEventListener('loadstart', handleLoadStart);
    audio.removeEventListener('canplay', handleCanPlay);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('play', handlePlay);
    audio.removeEventListener('pause', handlePause);
    audio.removeEventListener('ended', handleEnded);
    audio.removeEventListener('error', handleError);

    // Set new source and properties
    audio.src = currentAudioPath;
    audio.volume = state.volume;
    audio.playbackRate = state.playbackRate;

    // Explicitly call load() to start loading the audio
    audio.load();

    // Attach new listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup function
    return (): void => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudioPath, playlist?.autoAdvance, playlist?.files.length, state.currentFileIndex]); // Only essential dependencies

  // Separate effect for volume/playback rate updates (performance optimization)
  useEffect(() => {
    if (!audioRef.current) return undefined;

    // Only update if values actually changed
    if (audioRef.current.volume !== state.volume) {
      audioRef.current.volume = state.volume;
    }
    if (audioRef.current.playbackRate !== state.playbackRate) {
      audioRef.current.playbackRate = state.playbackRate;
    }

    return undefined;
  }, [state.volume, state.playbackRate]);

  // Control functions
  const play = useCallback((): void => {
    if (!audioRef.current || !state.hasAudio) {
      return;
    }

    try {
      isUserInitiated.current = true;

      // Use play() with promise handling
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented or other error
          errorHandler.logError(
            'Failed to start MP3 audio playback',
            error instanceof Error ? error : new Error(String(error)),
            {
              component: 'useMP3AudioPlayer',
              action: 'play',
              metadata: {
                hookId: hookId.current,
                filename: state.currentFile?.filename,
              },
            },
          );
        });
      }
    } catch (error) {
      errorHandler.logError(
        'Failed to start MP3 audio playback',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'useMP3AudioPlayer',
          action: 'play',
          metadata: {
            hookId: hookId.current,
            filename: state.currentFile?.filename,
          },
        },
      );
    }
  }, [state.hasAudio, state.currentFile?.filename]);

  const pause = useCallback((): void => {
    if (!audioRef.current || !state.isPlaying) {
      return;
    }

    try {
      audioRef.current.pause();
    } catch (error) {
      errorHandler.logError(
        'Failed to pause MP3 audio',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'useMP3AudioPlayer',
          action: 'pause',
          metadata: {
            hookId: hookId.current,
          },
        },
      );
    }
  }, [state.isPlaying]);

  const stop = useCallback((): void => {
    if (!audioRef.current) {
      return;
    }

    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      }));

      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    } catch (error) {
      errorHandler.logError(
        'Failed to stop MP3 audio',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'useMP3AudioPlayer',
          action: 'stop',
          metadata: {
            hookId: hookId.current,
          },
        },
      );
    }
  }, []);

  const resume = useCallback((): void => {
    if (state.isPaused) {
      play();
    }
  }, [state.isPaused, play]);

  const next = useCallback((): void => {
    if (!playlist || state.currentFileIndex >= playlist.files.length - 1) {
      return;
    }

    const nextIndex = state.currentFileIndex + 1;
    const nextFile = playlist.files[nextIndex];

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setState((prev) => ({
      ...prev,
      currentFileIndex: nextIndex,
      currentFile: nextFile,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));
  }, [playlist, state.currentFileIndex]);

  const previous = useCallback((): void => {
    if (!playlist || state.currentFileIndex <= 0) {
      return;
    }

    const prevIndex = state.currentFileIndex - 1;
    const prevFile = playlist.files[prevIndex];

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setState((prev) => ({
      ...prev,
      currentFileIndex: prevIndex,
      currentFile: prevFile,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));
  }, [playlist, state.currentFileIndex]);

  const seekTo = useCallback(
    (time: number): void => {
      if (!audioRef.current) {
        return;
      }

      try {
        audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
      } catch (error) {
        errorHandler.logError(
          'Failed to seek audio position',
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'useMP3AudioPlayer',
            action: 'seek',
            metadata: {
              hookId: hookId.current,
              seekTime: time,
            },
          },
        );
      }
    },
    [state.duration],
  );

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const setPlaybackRate = useCallback((rate: number): void => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    setState((prev) => ({ ...prev, playbackRate: clampedRate }));
  }, []);

  const getCurrentFile = useCallback((): AudioFile | null => {
    return state.currentFile;
  }, [state.currentFile]);

  const getPlaylist = useCallback((): AudioPlaylist | null => {
    return playlist;
  }, [playlist]);

  return [
    state,
    {
      play,
      pause,
      stop,
      resume,
      next,
      previous,
      seekTo,
      setVolume,
      setPlaybackRate,
      getCurrentFile,
      getPlaylist,
    },
  ];
}
