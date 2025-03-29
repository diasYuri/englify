'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import VoiceControls from '@/components/voice/VoiceControls';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { IconRobot } from '@tabler/icons-react';

// Use dynamic import with no SSR for the main component that uses browser APIs
const VoicePageClient = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manualDisconnect, setManualDisconnect] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebRTC = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setSessionId(null);
      setManualDisconnect(false);
      
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
        setConnectionStatus(`ice:${pc.iceConnectionState}`);
      };
      
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        setConnectionStatus(`conn:${pc.connectionState}`);
        
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
      
      // Set up data channel - simplified like the documentation
      const dc = pc.createDataChannel('oai-events');
      console.log('Data channel created');
      dataChannelRef.current = dc;
      
      // Simple event handlers
      dc.onopen = () => {
        console.log('Data channel opened');
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(0); // Reset reconnect count on successful connection
        setLastResponseTime(Date.now());
      };
      
      dc.onclose = () => {
        console.log('Data channel closed');
        setIsConnected(false);
        
        // Try to reconnect automatically if we haven't exceeded reconnect attempts
        // and this wasn't a manual disconnect
        if (reconnectCount < 3 && !manualDisconnect) {
          const delay = Math.min(1000 * (reconnectCount + 1), 5000); // Exponential backoff
          console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectCount + 1})`);
          
          reconnectTimerRef.current = setTimeout(() => {
            if (!isConnected) {
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
  };
  
  const disconnectWebRTC = () => {
    // Set manual disconnect flag to prevent auto-reconnection
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
    setConnectionStatus('disconnected');
    setSessionId(null);
  };

  const sendSystemMessage = () => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open' || !sessionId) {
      console.warn('Cannot send system message - channel not ready or no session ID');
      return;
    }
    
    try {
      // Send initial message with correct format
      const systemMsg = {
        type: 'conversation.item.create',
        item: {
          role: 'system',
          content: 'You are a helpful AI assistant named Englify. Respond briefly and conversationally to help users practice English. Keep responses under 2-3 sentences when possible.'
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
  };
  
  // Event type definitions
  interface TranscriptEvent {
    text: string;
    is_final: boolean;
  }
  
  interface MessageEvent {
    role: string;
    content: string;
  }
  
  interface SessionEvent {
    id: string;
    object: string;
    expires_at: number;
    model: string;
    voice: string;
  }
  
  type RealtimeEvent = {
    type: string;
    event_id?: string;
    transcript?: TranscriptEvent;
    message?: MessageEvent;
    error?: {
      type: string;
      code: string;
      message: string;
      param?: string;
    };
    item?: {
      role: string;
      content: string;
    };
    content?: {
      role: string;
      content: string;
    };
    response?: {
      message?: {
        role: string;
        content: string;
      }
    };
    session?: SessionEvent;
  };
  
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
            setTimeout(sendSystemMessage, 500);
          }
          break;
          
        case 'message':
          if (event.message?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.message.content || ''
            }]);
          }
          break;
          
        case 'response.message':
          if (event.response?.message?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.response.message.content || ''
            }]);
          }
          break;
          
        case 'conversation.item.message':
          if (event.item?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.item.content || ''
            }]);
          } else if (event.content?.role === 'assistant') {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: event.content.content || ''
            }]);
          }
          break;
          
        case 'speech_started':
          setIsTalking(true);
          break;
          
        case 'speech_stopped':
          setIsTalking(false);
          break;
          
        case 'transcript':
          if (event.transcript) {
            setCurrentTranscript(event.transcript.text);
            if (event.transcript.is_final) {
              // First add to UI
              setMessages(prev => [...prev, { 
                role: 'user', 
                content: event.transcript?.text || ''
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
                      content: event.transcript.text || ''
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
    return () => {
      // Clear reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      disconnectWebRTC();
    };
  }, []);

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
          disconnectWebRTC();
          
          // Don't set manualDisconnect here since this is an automatic disconnection
          setManualDisconnect(false);
          
          setTimeout(() => {
            if (!isConnected) {
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
  }, [isConnected, lastResponseTime, manualDisconnect]);

  return (
    <div className="container mx-auto py-10 min-h-screen flex flex-col items-center justify-between bg-gray-50">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center mb-8">Voice Assistant</h1>
        
        <div className="flex justify-center">
          <Badge className={`px-4 py-1.5 flex items-center gap-2 font-normal transition-colors ${
            isConnected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : isConnecting
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-transparent text-gray-800 border border-gray-200'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full ${
              isConnected 
                ? 'bg-green-500 animate-pulse'
                : isConnecting
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
            }`}></span>
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Ready'}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center my-10">
        <div className={`w-24 h-24 mb-6 transition-opacity flex items-center justify-center ${isConnected ? 'opacity-100' : 'opacity-50'}`}>
          <IconRobot size={64} className={`${isConnected ? 'text-blue-500' : 'text-gray-400'} ${isTalking ? 'animate-bounce' : ''}`} />
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-2">
          {isConnected 
            ? 'Voice Chat Active' 
            : isConnecting 
              ? 'Connecting...' 
              : 'Voice Assistant Ready'}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {isConnected 
            ? 'Speak now or click the button to disconnect'
            : isConnecting
              ? 'Please wait while we establish your connection...'
              : 'Start speaking by clicking the microphone button below.'}
        </p>
        
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm w-full max-w-md">
            Error: {errorMessage}
          </div>
        )}
          
        {currentTranscript && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm max-w-md animate-pulse">
            {currentTranscript}
          </div>
        )}
      </div>
      
      <div className="mb-20 flex flex-col items-center">
        <button
          onClick={isConnected ? disconnectWebRTC : connectWebRTC}
          disabled={isConnecting}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 hover:scale-105' 
              : isConnecting 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 hover:rotate-3'
          }`}
          aria-label={isConnected ? "Disconnect" : "Connect"}
        >
          {isConnected ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <MicrophoneIcon className="h-10 w-10 text-white" />
          )}
          
          {/* Animated rings for different states */}
          {isConnected && !isTalking && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" />
          )}
          {isTalking && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-25" style={{ animationDelay: '1s' }} />
            </div>
          )}
        </button>
        
        <div className="h-8 mt-4 flex items-center justify-center">
          <span className={`text-sm font-medium transition-all duration-300 ${
            isConnected 
              ? 'text-red-600' 
              : isConnecting 
                ? 'text-yellow-600'
                : 'text-blue-600'
          }`}>
            {isConnected 
              ? 'Click to disconnect' 
              : isConnecting 
                ? 'Establishing connection...' 
                : 'Click to connect'}
          </span>
        </div>
      </div>
      
      {/* Only show conversation history when connected */}
      {isConnected && messages.length > 0 && (
        <div className="w-full max-w-2xl bg-white rounded-lg p-4 shadow-md mb-12 border border-gray-100">
          <h3 className="text-sm font-medium mb-4 text-gray-700 border-b pb-2">Conversation History</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg text-sm shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-blue-100 ml-auto max-w-[80%] text-blue-900' 
                    : 'bg-gray-100 mr-auto max-w-[80%] text-gray-800'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Create a dynamic component with no SSR
const VoicePageNoSSR = dynamic(() => Promise.resolve(VoicePageClient), { ssr: false });

// Simple wrapper component that renders the client-side-only component
export default function VoicePage() {
  return <VoicePageNoSSR />;
} 