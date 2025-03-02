'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <form
      className="flex items-center space-x-2 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Send'
        )}
      </Button>
    </form>
  );
}
