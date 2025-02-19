import Image from 'next/image';
import { IconMessagePlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
  }>;
}

interface SidebarProps {
  onNewChat: () => void;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function Sidebar({
  onNewChat,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(conversationId);
    }
  };
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.svg"
              alt="Englify Logo"
              width={32}
              height={32}
              className="rounded-xl"
            />
            <h1 className="text-xl font-semibold text-gray-800">Englify</h1>
          </div>
        </div>
        <button
          className="w-full bg-primary-500 text-white rounded-xl px-4 py-2.5 hover:bg-primary-600 transition-colors font-medium flex items-center justify-center space-x-2"
          onClick={onNewChat}
        >
          <IconMessagePlus size={20} />
          <span>New chat</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`mx-2 px-3 py-2 cursor-pointer rounded-xl transition-all relative group ${
              selectedConversationId === conversation.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation)}
            onMouseEnter={() => setHoveredConversationId(conversation.id)}
            onMouseLeave={() => setHoveredConversationId(null)}
          >
            <div className="truncate pr-8">{conversation.title}</div>
            {hoveredConversationId === conversation.id && (
              <button
                onClick={(e) => handleDelete(e, conversation.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                title="Delete conversation"
              >
                <IconTrash size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
