'use client';

import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ConversationHistoryProps, ChatMessage } from './types';

// Altura fixa para cada linha da mensagem - reduzida para diminuir espaçamento
const ROW_HEIGHT = 50;

// Componente de linha individual para cada mensagem
const MessageRow = ({ index, style, data }: { index: number, style: React.CSSProperties, data: ChatMessage[] }) => {
  const message = data[index];
  const isFromUser = message.role === 'user';
  
  // Modificamos para ter estilos diferentes baseados na origem da mensagem
  return (
    <div 
      style={style} 
      className={`px-3 py-0 flex items-center ${isFromUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`rounded-lg text-sm shadow-sm p-3 max-w-[80%] ${
          isFromUser 
            ? 'bg-blue-100 text-blue-900' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

// Memoize the component
export const ConversationHistory = memo(function ConversationHistory({ messages, isVisible }: ConversationHistoryProps) {
  if (!isVisible || messages.length === 0) return null;
  
  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-md mb-12 border border-gray-100 flex flex-col" style={{ height: '24rem' }}>
      <h3 className="text-sm font-medium p-4 text-gray-700 border-b">Conversation History</h3>
      <div className="flex-grow overflow-hidden">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              height={height}
              itemCount={messages.length}
              itemSize={ROW_HEIGHT}
              width={width}
              itemData={messages}
              className="overflow-y-auto"
            >
              {MessageRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}); 