'use client';

import { Switch } from '@headlessui/react';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col">
          <Switch.Label className="text-sm font-medium text-gray-900" passive>
            {label}
          </Switch.Label>
          {description && (
            <Switch.Description className="text-sm text-gray-500">
              {description}
            </Switch.Description>
          )}
        </div>
        <Switch
          checked={enabled}
          onChange={onChange}
          className={`${
            enabled ? 'bg-primary-500' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
        >
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
} 