import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import CustomCursor from '@/components/ui/CustomCursor';
import AmbientAudio from '@/components/ui/AmbientAudio';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'SupportHome — Housing Management Platform',
  description: 'Comprehensive social support accommodation management for housing officers across the UK.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {/* Film grain overlay */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[9990] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '180px 180px',
            opacity: 0.028,
            mixBlendMode: 'overlay',
          }}
        />

        {/* Custom cursor (desktop only) */}
        <CustomCursor />

        {/* Ambient audio player */}
        <AmbientAudio />

        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111118',
              color: '#e8e8f2',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            },
            success: { iconTheme: { primary: '#c9a85c', secondary: '#111118' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#111118' } },
          }}
        />
      </body>
    </html>
  );
}
