'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceStatus } from './VoiceStatus';
import { VoiceRobot } from './VoiceRobot';
import { VoiceMicButton } from './VoiceMicButton';
import { ConversationHistory } from './ConversationHistory';
import { ErrorMessage } from './ErrorMessage';
import { TranscriptDisplay } from './TranscriptDisplay';
import { RealtimeEvent, ChatMessage } from './types';
import { HistoryPopupButton } from './HistoryPopupButton';
import { ConversationSidebar } from './ConversationSidebar';

export function VoiceClient() {
  // State variables
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manualDisconnect, setManualDisconnect] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize connectWebRTC
  const connectWebRTC = useCallback(async () => {
    try {
      console.log('Connecting to WebRTC');
      setIsConnecting(true);
      setErrorMessage(null);
      setSessionId(null);
      
      // Clear any existing reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Request ephemeral token from the server
      const tokenResponse = await fetch('/api/realtime-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'verse',
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('Token API error:', errorData);
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const data = await tokenResponse.json();
      if (!data.client_secret || !data.client_secret.value) {
        throw new Error('Invalid token response format');
      }
      
      const ephemeralKey = data.client_secret.value;
      
      // Create peer connection with proper STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      peerConnectionRef.current = pc;
      
      // Connection state logging
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };
      
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setIsConnected(false);
        }
      };
      
      // Set up audio element for AI voice output
      if (!audioElementRef.current) {
        const audioEl = new Audio();
        audioEl.autoplay = true;
        audioElementRef.current = audioEl;
      }
      
      // Handle remote audio track
      pc.ontrack = (e) => {
        console.log('Received track:', e.track.kind);
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = e.streams[0];
        }
      };
      
      // Get user microphone access and add track
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = mediaStream;
      
      // Only add the audio track, not the entire stream
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, mediaStream);
      }
      
      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      console.log('Data channel created');
      dataChannelRef.current = dc;
      
      // Event handlers
      dc.onopen = () => {
        console.log('Data channel opened');
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(0); // Reset reconnect count on successful connection
        setLastResponseTime(Date.now());
        setManualDisconnect(false);
      };
      
      dc.onclose = () => {
        console.log('Data channel closed', manualDisconnect);
        setIsConnected(false);
        
        // Try to reconnect automatically if we haven't exceeded reconnect attempts
        // and this wasn't a manual disconnect
        if (reconnectCount < 3 && !manualDisconnect) {
          const delay = Math.min(1000 * (reconnectCount + 1), 5000); // Exponential backoff
          console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectCount + 1})`);
          
          reconnectTimerRef.current = setTimeout(() => {
            if (!isConnected && !manualDisconnect) { // Check manualDisconnect again at reconnect time
              console.log(`Attempting reconnect #${reconnectCount + 1}`);
              setReconnectCount(prev => prev + 1);
              connectWebRTC();
            }
          }, delay);
        }
      };
      
      dc.onerror = (evt) => {
        console.error('Data channel error event:', evt);
      };
      
      dc.onmessage = (e) => {
        try {
          console.log('Received message:', e.data);
          const event = JSON.parse(e.data);
          handleEvent(event);
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };
      
      // Start session using SDP protocol
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text().catch(() => 'Unknown error');
        throw new Error(`Failed to establish WebRTC connection: ${sdpResponse.status} - ${errorText}`);
      }
      
      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer as RTCSessionDescriptionInit);
      
    } catch (error) {
      console.error('Error connecting to WebRTC:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown connection error';
      setErrorMessage(errorMsg);
      setIsConnecting(false);
      disconnectWebRTC();
    }
  }, [manualDisconnect]);
  
  // Memoize disconnectWebRTC
  const disconnectWebRTC = useCallback(() => {
    // Set manual disconnect flag to prevent auto-reconnection
    console.log('Disconnecting WebRTC');
    setManualDisconnect(true);
    
    // Clear any reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioElementRef.current) {
      if (audioElementRef.current.srcObject) {
        const stream = audioElementRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      audioElementRef.current.srcObject = null;
    }
    
    setIsConnected(false);
    setIsTalking(false);
    setSessionId(null);
    setMessages([]);

  }, []);

  // Memoize sendSystemMessage
  const sendSystemMessage = useCallback(() => {
    console.log('Preparing to send system message', !dataChannelRef.current, dataChannelRef.current?.readyState, sessionId);
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Cannot send system message - channel not ready or no session ID');
      return;
    }
    
    try {
      // Send initial message with correct format
      const systemMsg = {
        type: 'conversation.item.create',
        item: {
          id: 'msg_001',
          type: 'message',
          role: 'system',
          content: [
                {
                    type: "input_text",
                    text: 'Respond in english and use portuguese when necessary to explain the something.'
                }
            ]
        }
      };
      
      console.log('Sending system message:', systemMsg);
      dataChannelRef.current.send(JSON.stringify(systemMsg));
      
     

      // Request a response after a delay
      setTimeout(() => {
        if (dataChannelRef.current?.readyState === 'open') {
          const generateResponse = {
            type: 'response.create'
          };
          console.log('Requesting initial response:', generateResponse);
          dataChannelRef.current.send(JSON.stringify(generateResponse));
        }
      }, 500);
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }, [sessionId]);

  // Memoize sendUpdateSession
  const sendUpdateSession = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Cannot send update session - channel not ready or no session ID');
      return;
    }

    const updateSession = {
      type: 'session.update',
      session: {
        modalities: ["text", "audio"],
        instructions: "You are a helpful AI assistant named Englify. Respond briefly and conversationally to help users practice English.",
        voice: 'verse',
        temperature: 0.7,
        max_response_output_tokens: "inf",
        input_audio_transcription: {
            model: "gpt-4o-mini-transcribe"
        },
        input_audio_noise_reduction: {
            type: "far_field",
        }
        /*turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true
        },*/
      }
    }

    console.log('Sending update session:', updateSession);
    dataChannelRef.current.send(JSON.stringify(updateSession));
  }, []);
  
  const handleEvent = (event: RealtimeEvent) => {
    // Update last response time for connection health checks
    setLastResponseTime(Date.now());
    try {
      console.log('Processing event:', event);
      
      switch (event.type) {
        case 'session.created':
          console.log('Session created:', event);
          if (event.session?.id) {
            setSessionId(event.session.id);
            // Wait until we have a session ID before sending system message
            setTimeout(() => sendUpdateSession(), 50);
            setTimeout(() => sendSystemMessage(), 150);
          }
          break;
          
        case 'message':
          if (event.message?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.message?.content || ''
            }]);
          }
          break;
          
        case 'response.message':
          if (event.response?.message?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.response?.message?.content || ''
            }]);
          }
          break;
          
        case 'conversation.item.message':
          if (event.item?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.item?.content || ''
            }]);
          } else if (event.content?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.content?.content || ''
            }]);
          }
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          console.warn(event.transcript);      
         
          setMessages(prev => [...prev, { 
            role: 'user', 
            content: event.transcript || 'ok'
          }]);

          break;

        case 'response.audio_transcript.done':
          console.warn(event.transcript);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: event.transcript || 'ok'
          }]);
          break;
          
        case 'speech_started':
          setIsTalking(true);
          break;
          
        case 'speech_stopped':
          setIsTalking(false);
          break;
          
        case 'transcript':
          if (event.transcript) {
            setCurrentTranscript(event.transcript);
            if (event.transcript) {
              // First add to UI
              setMessages(prev => [...prev, { 
                role: 'user', 
                content: event.transcript || ''
              }]);
              setCurrentTranscript('');
              
              // Then send to API - only if we have a valid session
              if (dataChannelRef.current?.readyState === 'open' && sessionId) {
                try {
                  // Send user message
                  const userMsg = {
                    type: 'conversation.item.create',
                    item: {
                      role: 'user',
                      content: event.transcript || ''
                    }
                  };
                  
                  dataChannelRef.current.send(JSON.stringify(userMsg));
                  
                  // Request a response after a small delay
                  setTimeout(() => {
                    if (dataChannelRef.current?.readyState === 'open') {
                      const generateResponse = {
                        type: 'response.create'
                      };
                      dataChannelRef.current.send(JSON.stringify(generateResponse));
                    }
                  }, 500);
                } catch (error) {
                  console.error('Error sending transcript:', error);
                }
              }
            }
          }
          break;
          
        case 'error':
          console.error('API error:', event.error);
          if (event.error?.message) {
            setErrorMessage(event.error.message);
          }
          break;
          
        default:
          console.log('Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    // Use the memoized disconnectWebRTC function in cleanup
    const cleanup = disconnectWebRTC;
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      cleanup();
    };
    // Pass the memoized function as dependency if ESLint complains, but usually okay for cleanup
  }, [disconnectWebRTC]);

  // Reset connection if no response for 60 seconds
  useEffect(() => {
    const checkConnectionHealth = () => {
      // Don't attempt reconnection if it was a manual disconnect
      if (manualDisconnect) return;
      
      if (isConnected && lastResponseTime) {
        const now = Date.now();
        const elapsedTime = now - lastResponseTime;
        
        // If no response for 60 seconds and we're supposedly connected,
        // reset the connection
        if (elapsedTime > 60000) {
          console.log('Connection appears stale, reconnecting...');
          // Call disconnect without setting manual disconnect flag
          if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
          }
          
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
          
          setIsConnected(false);
          
          // Clear any existing reconnect timer before setting a new one
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          reconnectTimerRef.current = setTimeout(() => {
            // Only reconnect if still not connected and not manually disconnected
            if (!isConnected && !manualDisconnect) {
              connectWebRTC();
            }
          }, 1000);
        }
      }
    };
    
    const interval = setInterval(checkConnectionHealth, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected, lastResponseTime, manualDisconnect, connectWebRTC, disconnectWebRTC]);

  // Memoize toggleSidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  // Memoize sidebar close function
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="container mx-auto py-10 min-h-screen flex flex-col items-center justify-between bg-gray-50">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center mb-8">Voice Assistant</h1>
        <VoiceStatus isConnected={isConnected} isConnecting={isConnecting} />
      </div>
      
      <div className="flex flex-col items-center justify-center my-10">
        <VoiceRobot 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
          isTalking={isTalking} 
        />
        
        <ErrorMessage message={errorMessage} />
        <TranscriptDisplay text={currentTranscript} />
      </div>
      
      <div className="mb-20">
        <VoiceMicButton
          isConnected={isConnected}
          isConnecting={isConnecting}
          isTalking={isTalking}
          onConnect={connectWebRTC}
          onDisconnect={disconnectWebRTC}
        />
      </div>
      
      <ConversationHistory 
        messages={messages} 
        isVisible={isConnected && messages.length > 0} 
      />
      
      <HistoryPopupButton 
        hasMessages={messages.length > 0}
        onClick={toggleSidebar}
        isTalking={isTalking} 
      />
      
      <ConversationSidebar 
        messages={messages}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
    </div>
  );
} 