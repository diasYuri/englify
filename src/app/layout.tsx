import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Englify - Master English with AI-Powered Conversations',
  description: 'Practice English naturally through interactive conversations with our advanced AI language partner. Perfect your speaking, writing, and comprehension skills at your own pace.',
  keywords: ['English learning', 'AI language partner', 'conversation practice', 'language learning', 'English tutor'],
  authors: [{ name: 'Englify Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Englify - Master English with AI-Powered Conversations',
    description: 'Practice English naturally through interactive conversations with our advanced AI language partner.',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Englify - AI-Powered English Learning',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Englify - Master English with AI-Powered Conversations',
    description: 'Practice English naturally through interactive conversations with our advanced AI language partner.',
    images: ['/og-image.png'],
  },
};

import { NextAuthProvider } from '@/providers/NextAuthProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
