import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface AudioToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AudioToggle({ isEnabled, onToggle }: AudioToggleProps) {
  return (
    <div className="flex items-center space-x-2 py-2 px-4 border-t border-gray-200">
      <Switch
        id="audio-mode"
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="audio-mode" className="text-sm text-gray-700">
        Enable audio responses
      </Label>
    </div>
  );
}
