'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAudioSettings } from '@/lib/store/audio-settings';

export function AudioToggle() {
  const { isEnabled, setEnabled } = useAudioSettings();

  return (
    <div className="flex items-center space-x-2 py-2 px-4 border-t border-gray-200">
      <Switch
        id="audio-mode"
        checked={isEnabled}
        onCheckedChange={setEnabled}
      />
      <Label htmlFor="audio-mode" className="text-sm text-gray-700">
        Enable audio responses
      </Label>
    </div>
  );
}
