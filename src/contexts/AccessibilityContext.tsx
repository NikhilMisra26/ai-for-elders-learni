import type { ReactNode, JSX } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'small' | 'normal' | 'large';
  isDarkMode: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleDarkMode: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>(
    'normal',
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedFontSize = (
      typeof window !== 'undefined'
        ? window.localStorage.getItem('fontSize')
        : null
    ) as 'small' | 'normal' | 'large';
    const savedDarkMode =
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('darkMode')
        : null) === 'true';

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedDarkMode) setIsDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    // Apply font size class to body
    if (typeof document !== 'undefined') {
      document.body.className = document.body.className.replace(
        /font-size-\w+/g,
        '',
      );
      if (fontSize !== 'normal') {
        document.body.classList.add(`font-size-${fontSize}`);
      }
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fontSize', fontSize);
    }
  }, [fontSize]);

  useEffect(() => {
    // Apply dark mode class to body
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, [isDarkMode]);

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

  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode);
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
        isDarkMode,
        increaseFontSize,
        decreaseFontSize,
        toggleDarkMode,
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
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider',
    );
  }
  return context;
}
