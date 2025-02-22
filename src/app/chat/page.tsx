'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  isAudio?: boolean;
  isResponseToAudio?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
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

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove conversation from state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If the deleted conversation was selected, clear the selection
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSubmit = async (isAudio?: boolean) => {
    if (!inputMessage.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const currentConversation = selectedConversationId
        ? conversations.find((c) => c.id === selectedConversationId)
        : null;

      const tempMessageId = `temp-${Date.now()}`;
      const tempAssistantId = `temp-${Date.now() + 1}`;

      // Add messages to UI immediately
      const newUserMessage = {
        id: tempMessageId,
        content: inputMessage,
        role: 'user' as const,
        isAudio,
      };

      const newAssistantMessage = {
        id: tempAssistantId,
        content: '',
        role: 'assistant' as const,
        isResponseToAudio: isAudio,
      };

      // Update conversations state with new messages
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === selectedConversationId);
        
        if (conversationIndex === -1) {
          const tempConvId = `temp-${Date.now()}`;
          updatedConversations.unshift({
            id: tempConvId,
            title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
            messages: [newUserMessage, newAssistantMessage],
          });
        } else {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            messages: [...updatedConversations[conversationIndex].messages, newUserMessage, newAssistantMessage],
          };
        }
        return updatedConversations;
      });

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId: selectedConversationId,
          isAudio,
          chatHistory: currentConversation?.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            isAudio: msg.isAudio,
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
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsedData = JSON.parse(data);
            
            if (parsedData.content) {
              streamedContent += parsedData.content;

              setConversations(prev => {
                const updatedConversations = [...prev];
                const conversationIndex = updatedConversations.findIndex(c => 
                  c.id === parsedData.conversationId || 
                  c.id.startsWith('temp-')
                );
                
                if (conversationIndex !== -1) {
                  const conversation = updatedConversations[conversationIndex];
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = streamedContent;
                    lastMessage.isResponseToAudio = isAudio;
                  }
                }
                
                return updatedConversations;
              });
            }
            
            if (parsedData.conversationId && !selectedConversationId) {
              setConversations(prev => {
                const updatedConversations = [...prev];
                const tempIndex = updatedConversations.findIndex(c => c.id.startsWith('temp-'));
                
                if (tempIndex !== -1) {
                  updatedConversations[tempIndex] = {
                    ...updatedConversations[tempIndex],
                    id: parsedData.conversationId,
                  };
                }
                
                return updatedConversations;
              });
              
              setSelectedConversationId(parsedData.conversationId);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
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
        onDeleteConversation={handleDeleteConversation}
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
                    isAudio: msg.isAudio,
                    isResponseToAudio: msg.isResponseToAudio,
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
