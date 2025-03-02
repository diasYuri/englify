'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AudioSettings {
  enableAudioResponses: boolean;
  autoPlayAudio: boolean;
}

interface AudioSettingsContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextType | null>(null);

export function AudioSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>({
    enableAudioResponses: false,
    autoPlayAudio: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('audioSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('audioSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AudioSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);
  if (!context) {
    throw new Error('useAudioSettings must be used within an AudioSettingsProvider');
  }
  return context;
} 