'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  isAudio?: boolean;
  isResponseToAudio?: boolean;
  isComplete?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function ChatPage() {
  const router = useRouter();
  const { status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load conversations on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadConversations();
    }
  }, [status]);

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
      // Get current conversation if one is selected
      const currentConversation = selectedConversationId
        ? conversations.find((c) => c.id === selectedConversationId)
        : null;
      
      // Generate temporary IDs for optimistic UI updates
      const tempMessageId = `temp-${Date.now()}`;
      const tempAssistantId = `temp-${Date.now() + 1}`;
      const tempConvId = selectedConversationId || `temp-${Date.now() + 2}`;
      
      // Track received conversation ID during streaming
      let receivedConversationId = selectedConversationId;

      // Create message objects
      const newUserMessage = {
        id: tempMessageId,
        content: inputMessage,
        role: 'user' as const,
        isAudio: isAudio === true,
      };

      const newAssistantMessage = {
        id: tempAssistantId,
        content: '',
        role: 'assistant' as const,
        isResponseToAudio: isAudio === true,
      };

      // Update conversations state with new messages
      setConversations(prev => {
        const updatedConversations = [...prev];
        
        if (!selectedConversationId) {
          // No conversation selected - create a new one
          updatedConversations.unshift({
            id: tempConvId,
            title: inputMessage.slice(0, 50) + (inputMessage.length > 50 ? '...' : ''),
            messages: [newUserMessage, newAssistantMessage],
          });
          
          // Set the new conversation as selected
          setTimeout(() => setSelectedConversationId(tempConvId), 0);
          
          return updatedConversations;
        }
        
        // Add messages to the selected conversation
        const conversationIndex = updatedConversations.findIndex(c => c.id === selectedConversationId);
        
        if (conversationIndex !== -1) {
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
          isAudio: isAudio === true,
          chatHistory: currentConversation?.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            isAudio: msg.isAudio,
          })) || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let incompleteChunk = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the current chunk
        const currentChunk = decoder.decode(value, { stream: true });
        
        // Combine with any leftover incomplete data from previous iteration
        const processText = incompleteChunk + currentChunk;
        
        // Split by SSE delimiter
        const parts = processText.split('\n\n');
        
        // The last part might be incomplete, save it for the next iteration
        incompleteChunk = parts.pop() || '';
        
        // Process all complete parts
        for (const part of parts) {
          // Process each line in this part
          const lines = part.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            const data = trimmedLine.slice(5).trim();
            if (data === '[DONE]') {
              // Stream is complete, update UI to reflect completion
              setConversations(prev => {
                const updatedConversations = [...prev];
                const targetId = receivedConversationId || selectedConversationId || tempConvId;
                const conversationIndex = updatedConversations.findIndex(c => c.id === targetId);
                
                if (conversationIndex !== -1) {
                  const conversation = updatedConversations[conversationIndex];
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.isComplete = true;
                  }
                }
                
                return updatedConversations;
              });
              continue;
            }

            try {
              const parsedData = JSON.parse(data);
              
              // Check for error data from server
              if (parsedData.error) {
                console.error('Server reported error:', parsedData.error, parsedData.message);
                throw new Error(parsedData.message || 'Error in stream processing');
              }
              
              // Log to help debug streaming issues
              console.debug('Received chunk:', 
                parsedData.content?.length > 20 
                  ? `${parsedData.content.substring(0, 20)}...` 
                  : parsedData.content,
                parsedData.isFinal ? '(FINAL)' : ''
              );
              
              // Handle final message with complete content if provided
              if (parsedData.isFinal && parsedData.content) {
                streamedContent = parsedData.content; // Replace with the complete content
              }
              else if (parsedData.content) {
                streamedContent += parsedData.content;
              }
              
              if (parsedData.conversationId) {
                receivedConversationId = parsedData.conversationId;
                setConversations(prev => {
                  const updatedConversations = [...prev];
                  
                  // Update conversation ID if we have a temp one
                  if (!selectedConversationId) {
                    const tempIndex = updatedConversations.findIndex(c => c.id === tempConvId);
                    
                    if (tempIndex !== -1) {
                      updatedConversations[tempIndex] = {
                        ...updatedConversations[tempIndex],
                        id: parsedData.conversationId,
                      };
                      
                      // Update selected conversation ID
                      setTimeout(() => setSelectedConversationId(parsedData.conversationId), 0);
                    }
                  }
                  
                  return updatedConversations;
                });
              }

              if (parsedData.content || parsedData.isFinal) {
                setConversations(prev => {
                  const updatedConversations = [...prev];
                  
                  // Find the conversation to update
                  const targetConversationId = receivedConversationId || selectedConversationId || tempConvId;
                  const conversationIndex = updatedConversations.findIndex(c => 
                    c.id === targetConversationId
                  );
                  
                  if (conversationIndex !== -1) {
                    const conversation = updatedConversations[conversationIndex];
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    
                    if (lastMessage && lastMessage.role === 'assistant') {
                      // Important: Create a new message object to trigger a re-render
                      conversation.messages[conversation.messages.length - 1] = {
                        ...lastMessage,
                        content: streamedContent,
                        isResponseToAudio: isAudio === true
                      };
                    }
                  }
                  
                  return updatedConversations;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Process any remaining data in the incompleteChunk
      if (incompleteChunk.trim()) {
        const lines = incompleteChunk.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') {
            // Stream is complete, update UI to reflect completion
            setConversations(prev => {
              const updatedConversations = [...prev];
              const targetId = receivedConversationId || selectedConversationId || tempConvId;
              const conversationIndex = updatedConversations.findIndex(c => c.id === targetId);
              
              if (conversationIndex !== -1) {
                const conversation = updatedConversations[conversationIndex];
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.isComplete = true;
                }
              }
              
              return updatedConversations;
            });
            continue;
          }

          try {
            const parsedData = JSON.parse(data);
            
            // Check for error data from server
            if (parsedData.error) {
              console.error('Server reported error:', parsedData.error, parsedData.message);
              throw new Error(parsedData.message || 'Error in stream processing');
            }
            
            // Log to help debug streaming issues
            console.debug('Processing final chunk:', 
              parsedData.content?.length > 20 
                ? `${parsedData.content.substring(0, 20)}...` 
                : parsedData.content,
              parsedData.isFinal ? '(FINAL)' : ''
            );
            
            // Handle final message with complete content if provided
            if (parsedData.isFinal && parsedData.content) {
              streamedContent = parsedData.content; // Replace with the complete content
            }
            else if (parsedData.content) {
              streamedContent += parsedData.content;
            }
            
            if (parsedData.content || parsedData.isFinal) {
              // Final update with the complete message
              setConversations(prev => {
                const updatedConversations = [...prev];
                const targetConversationId = receivedConversationId || selectedConversationId || tempConvId;
                const conversationIndex = updatedConversations.findIndex(c => 
                  c.id === targetConversationId
                );
                
                if (conversationIndex !== -1) {
                  const conversation = updatedConversations[conversationIndex];
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    // Important: Create a new message object to trigger a re-render
                    conversation.messages[conversation.messages.length - 1] = {
                      ...lastMessage,
                      content: streamedContent,
                      isResponseToAudio: isAudio === true
                    };
                  }
                }
                
                return updatedConversations;
              });
            }
          } catch (e) {
            console.error('Error parsing final SSE data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Handle the error state by showing an error message
      setConversations(prev => {
        const updatedConversations = [...prev];
        
        // Find our conversation
        const conversationIndex = updatedConversations.findIndex(c => 
          c.id === selectedConversationId || (!selectedConversationId && c.id.startsWith('temp-'))
        );
        
        if (conversationIndex !== -1) {
          const conversation = updatedConversations[conversationIndex];
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = "Sorry, there was an error processing your request. Please try again.";
            lastMessage.isComplete = true;
          }
        }
        
        return updatedConversations;
      });
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const currentConversation = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId)
    : null;

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

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
                    isComplete: msg.isComplete,
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
