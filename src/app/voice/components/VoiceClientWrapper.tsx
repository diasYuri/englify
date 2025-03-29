'use client';

import dynamic from 'next/dynamic';

// Create a dynamic component with no SSR within a client component
const VoiceClientNoSSR = dynamic(
  () => import('./VoiceClient').then(mod => mod.VoiceClient),
  { ssr: false }
);

export default function VoiceClientWrapper() {
  return <VoiceClientNoSSR />;
} 