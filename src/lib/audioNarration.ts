import { useState, useEffect, useCallback } from 'react'

export interface AudioNarrationState {
  isPlaying: boolean
  isPaused: boolean
  isSupported: boolean
  currentText: string
  position: number
  rate: number
  volume: number
  voice: SpeechSynthesisVoice | null
}

export interface AudioNarrationControls {
  play: () => void
  pause: () => void
  stop: () => void
  resume: () => void
  setRate: (rate: number) => void
  setVolume: (volume: number) => void
  setVoice: (voice: SpeechSynthesisVoice) => void
  getText: () => string
}

export function useAudioNarration(text: string): [AudioNarrationState, AudioNarrationControls] {
  const [state, setState] = useState<AudioNarrationState>({
    isPlaying: false,
    isPaused: false,
    isSupported: 'speechSynthesis' in window,
    currentText: text,
    position: 0,
    rate: 1,
    volume: 1,
    voice: null
  })

  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Load available voices
  useEffect(() => {
    if (!state.isSupported) return

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)
      
      // Set default voice (prefer female voice for senior-friendly experience)
      if (voices.length > 0 && !state.voice) {
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('zira') ||
           voice.name.toLowerCase().includes('susan'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]
        
        setState(prev => ({ ...prev, voice: preferredVoice }))
      }
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  }, [state.isSupported, state.voice])

  // Clean up text for better narration
  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
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
  }

  // Create or update utterance when text changes
  useEffect(() => {
    if (!state.isSupported) return

    const cleanText = cleanTextForSpeech(text)
    const newUtterance = new SpeechSynthesisUtterance(cleanText)
    
    newUtterance.rate = state.rate
    newUtterance.volume = state.volume
    if (state.voice) {
      newUtterance.voice = state.voice
    }

    newUtterance.onstart = () => {
      setState(prev => ({ ...prev, isPlaying: true, isPaused: false }))
    }

    newUtterance.onend = () => {
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }))
    }

    newUtterance.onpause = () => {
      setState(prev => ({ ...prev, isPaused: true }))
    }

    newUtterance.onresume = () => {
      setState(prev => ({ ...prev, isPaused: false }))
    }

    newUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false }))
    }

    // Track position (approximate)
    newUtterance.onboundary = (event) => {
      setState(prev => ({ ...prev, position: event.charIndex }))
    }

    setUtterance(newUtterance)
    setState(prev => ({ ...prev, currentText: cleanText }))
  }, [text, state.rate, state.volume, state.voice, state.isSupported])

  const play = useCallback(() => {
    if (!state.isSupported || !utterance) return

    // Stop any current speech
    speechSynthesis.cancel()
    
    // Start new speech
    speechSynthesis.speak(utterance)
  }, [state.isSupported, utterance])

  const pause = useCallback(() => {
    if (!state.isSupported) return
    speechSynthesis.pause()
  }, [state.isSupported])

  const stop = useCallback(() => {
    if (!state.isSupported) return
    speechSynthesis.cancel()
    setState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }))
  }, [state.isSupported])

  const resume = useCallback(() => {
    if (!state.isSupported) return
    speechSynthesis.resume()
  }, [state.isSupported])

  const setRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.1, Math.min(2, rate))
    setState(prev => ({ ...prev, rate: clampedRate }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setState(prev => ({ ...prev, volume: clampedVolume }))
  }, [])

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setState(prev => ({ ...prev, voice }))
  }, [])

  const getText = useCallback(() => {
    return state.currentText
  }, [state.currentText])

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
      getText
    }
  ]
}

// Hook for managing narration preferences
export function useNarrationPreferences() {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') return null
    
    const saved = localStorage.getItem('audio-narration-preferences')
    return saved ? JSON.parse(saved) : {
      autoPlay: false,
      defaultRate: 1,
      defaultVolume: 1,
      preferredVoice: null,
      enabled: true
    }
  })

  useEffect(() => {
    if (preferences) {
      localStorage.setItem('audio-narration-preferences', JSON.stringify(preferences))
    }
  }, [preferences])

  const updatePreferences = (updates: Partial<typeof preferences>) => {
    setPreferences((prev: any) => ({ ...prev, ...updates }))
  }

  return [preferences, updatePreferences] as const
}

// Utility to extract readable text from HTML content
export function extractTextFromHTML(html: string): string {
  if (typeof window === 'undefined') return html

  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove script and style elements
  const scripts = div.querySelectorAll('script, style')
  scripts.forEach(el => el.remove())
  
  return div.textContent || div.innerText || ''
}

// Utility to get estimated reading time
export function getEstimatedSpeechTime(text: string, rate: number = 1): number {
  const wordsPerMinute = 150 * rate // Average speaking speed
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Component for narration controls
export interface NarrationControlsProps {
  text: string
  className?: string
  showSpeed?: boolean
  showVolume?: boolean
  showVoiceSelection?: boolean
  autoPlay?: boolean
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
    'Apple Victoria'
  ]
}

// Accessibility helpers
export function announceToScreenReader(message: string): void {
  if (typeof window === 'undefined') return

  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Format time for display
export function formatSpeechTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 minute'
  if (minutes === 1) return '1 minute'
  return `${minutes} minutes`
}