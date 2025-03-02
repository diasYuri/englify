import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioSettings {
  isEnabled: boolean;
  autoPlay: boolean;
  setEnabled: (enabled: boolean) => void;
  setAutoPlay: (autoPlay: boolean) => void;
}

export const useAudioSettings = create<AudioSettings>()(
  persist(
    (set) => ({
      isEnabled: false,
      autoPlay: false,
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setAutoPlay: (autoPlay) => set({ autoPlay: autoPlay }),
    }),
    {
      name: 'englify-audio-settings',
    }
  )
);
