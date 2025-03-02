'use client';

import { useAudioSettings } from '@/contexts/AudioSettingsContext';
import { Toggle } from './ui/Toggle';

export function AudioSettings() {
  const { settings, updateSettings } = useAudioSettings();

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <Toggle
        enabled={settings.enableAudioResponses}
        onChange={(enabled) => updateSettings({ enableAudioResponses: enabled })}
        label="Enable audio responses"
        description="Assistant will always respond with audio messages"
      />
      <Toggle
        enabled={settings.autoPlayAudio}
        onChange={(enabled) => updateSettings({ autoPlayAudio: enabled })}
        label="Auto-play audio"
        description="Automatically play audio messages when received"
      />
    </div>
  );
} 