import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserRecordsProvider } from '@/components/providers/UserRecordsProvider';
import { TodoProvider } from '@/components/providers/TodoProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { FriendProvider } from '@/components/providers/FriendProvider';

export const metadata: Metadata = {
  title: 'S.I.G.I.L.',
  description: 'System of Internal Growth in Infinite Loop. Track your personal records with a GitHub-like contribution graph.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Meta for PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <SettingsProvider>
            <TooltipProvider delayDuration={100}>
              <FriendProvider>
                <UserRecordsProvider>
                    <TodoProvider>
                      {children}
                      <Toaster />
                    </TodoProvider>
                </UserRecordsProvider>
              </FriendProvider>
            </TooltipProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
