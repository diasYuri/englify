import Image from 'next/image';
import { IconMessagePlus } from '@tabler/icons-react';

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
}

export function Sidebar({
  onNewChat,
  conversations,
  selectedConversationId,
  onSelectConversation,
}: SidebarProps) {
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
            className={`mx-2 px-3 py-2 cursor-pointer rounded-xl transition-all ${
              selectedConversationId === conversation.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="truncate">{conversation.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
