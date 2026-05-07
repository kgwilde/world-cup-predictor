import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Noto_Sans } from 'next/font/google';

import { ClientProviders } from '@/components/ClientProviders';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/navigation';

import './globals.css';

const fifaSans = localFont({
  src: [
    {
      path: '../../public/fonts/FIFASans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/FIFASans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-body-src',
});

const body = Noto_Sans({
  variable: '--font-body-src',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'WC26 Predictor',
  description: 'FIFA World Cup 2026 match predictions & leaderboard',
  appleWebApp: {
    capable: true,
    title: 'WC26 Match Predictor',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${fifaSans.variable} ${body.variable} font-body antialiased`}>
        <div className="min-h-screen bg-wc-black pb-16 sm:pb-0">
          <ClientProviders />
          <Header />
          <Navigation />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
