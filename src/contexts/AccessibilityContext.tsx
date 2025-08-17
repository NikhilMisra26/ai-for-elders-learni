import type { ReactNode, JSX } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'small' | 'normal' | 'large';
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }): JSX.Element {
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedFontSize = (
      typeof window !== 'undefined' ? window.localStorage.getItem('fontSize') : null
    ) as 'small' | 'normal' | 'large';

    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  useEffect(() => {
    // Apply font size class to body
    if (typeof document !== 'undefined') {
      document.body.className = document.body.className.replace(/font-size-\w+/g, '');
      if (fontSize !== 'normal') {
        document.body.classList.add(`font-size-${fontSize}`);
      }
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fontSize', fontSize);
    }
  }, [fontSize]);

  const increaseFontSize = (): void => {
    setFontSize((current) => {
      if (current === 'small') return 'normal';
      if (current === 'normal') return 'large';
      return 'large';
    });
  };

  const decreaseFontSize = (): void => {
    setFontSize((current) => {
      if (current === 'large') return 'normal';
      if (current === 'normal') return 'small';
      return 'small';
    });
  };

  const speakText = (text: string): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = (): void => setIsSpeaking(true);
      utterance.onend = (): void => setIsSpeaking(false);
      utterance.onerror = (): void => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = (): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        speakText,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
