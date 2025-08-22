import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import BottomNavBar from '@/components/layout/BottomNavBar';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'S.I.G.I.L.',
  description: 'System of Internal Growth in Infinite Loop. Track your personal records with a GitHub-like contribution graph.',
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <AppProviders>
            <div className="min-h-screen flex flex-col transition-colors duration-700 ease-in-out pb-20 md:pb-0">
                {children}
                <BottomNavBar />
            </div>
            <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
