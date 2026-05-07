import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/navigation';
import { Barlow_Condensed, Noto_Sans } from 'next/font/google';
import './globals.css';
import IdentityBootstrap from '@/components/IdentityBootstrap';

const display = Barlow_Condensed({
  variable: '--font-display-src',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const body = Noto_Sans({
  variable: '--font-body-src',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'WC26 Predictor',
  description: 'FIFA World Cup 2026 match predictor & leaderboard',
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <div className="min-h-screen bg-wc-black pb-16 sm:pb-0">
          <IdentityBootstrap />
          <Header />
          <Navigation />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
