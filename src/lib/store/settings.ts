import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isAudioEnabled: boolean;
  autoPlayAudio: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  setAutoPlayAudio: (enabled: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      isAudioEnabled: false,
      autoPlayAudio: false,
      setAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
      setAutoPlayAudio: (enabled) => set({ autoPlayAudio: enabled }),
    }),
    {
      name: 'englify-settings',
    }
  )
);
