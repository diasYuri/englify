'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
  }>;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleNewChat = () => {
    setSelectedConversationId(null);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const currentConversation = selectedConversationId
        ? conversations.find((c) => c.id === selectedConversationId)
        : null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: selectedConversationId,
          chatHistory: currentConversation?.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })) || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add user message immediately
      const newUserMessage = {
        id: Date.now().toString(),
        content: inputMessage,
        role: 'user' as const,
      };

      const newAssistantMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant' as const,
      };

      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === selectedConversationId);
        
        if (conversationIndex === -1) {
          // Create new conversation
          updatedConversations.unshift({
            id: selectedConversationId || 'temp',
            title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
            messages: [newUserMessage, newAssistantMessage],
          });
        } else {
          // Update existing conversation
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            messages: [...updatedConversations[conversationIndex].messages, newUserMessage, newAssistantMessage],
          };
        }
        return updatedConversations;
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsedData = JSON.parse(data);
              if (parsedData.content) {
                setConversations(prev => {
                  const updatedConversations = [...prev];
                  const conversationIndex = updatedConversations.findIndex(c => c.id === (parsedData.conversationId || selectedConversationId));
                  
                  if (conversationIndex !== -1) {
                    const conversation = updatedConversations[conversationIndex];
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content += parsedData.content;
                    }
                  }
                  
                  return updatedConversations;
                });
              }
              
              if (parsedData.conversationId && !selectedConversationId) {
                setSelectedConversationId(parsedData.conversationId);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const currentConversation = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId)
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        onNewChat={handleNewChat}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
      />
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={
              currentConversation
                ? currentConversation.messages.map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    sender: msg.role,
                  }))
                : []
            }
          />
          <div ref={messagesEndRef} />
        </div>
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
