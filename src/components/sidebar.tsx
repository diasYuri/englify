'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function Sidebar({
  onNewChat,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
}: {
  onNewChat: () => void;
  conversations: Array<{ id: string; title: string }>;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}) {
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 px-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-center justify-between rounded-lg p-2 text-sm transition-colors
                ${selectedConversationId === conversation.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'hover:bg-gray-100'}`}
            >
              <button
                className="flex-1 text-left"
                onClick={() => onSelectConversation(conversation.id)}
              >
                {conversation.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-600 p-1 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
