import { IconSearch, IconSend, IconPlus, IconLoader2 } from '@tabler/icons-react';
import { AudioRecorder } from './AudioRecorder';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (isAudio?: boolean) => void;
  isLoading?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(false);
    }
  };

  const handleTranscriptionComplete = (transcription: string) => {
    onChange(transcription);
    onSubmit(true);
  };

  return (
    <div className="p-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            title="Add attachment"
          >
            <IconPlus size={20} />
          </button>
          
          <div className="flex-1 flex items-center">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Englify..."
              className="flex-1 p-2 bg-transparent resize-none focus:outline-none min-h-[24px] max-h-[200px] overflow-y-auto leading-6"
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <AudioRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              isLoading={!!isLoading}
            />
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              title="Search"
            >
              <IconSearch size={20} />
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="p-2 text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              title="Send message"
            >
              {isLoading ? <IconLoader2 size={20} className="animate-spin" /> : <IconSend size={20} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
