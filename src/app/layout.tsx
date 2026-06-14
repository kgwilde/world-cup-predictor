import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';

import { ClientProviders } from '@/components/ClientProviders';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/navigation';
import { SplashScreen } from '@/components/SplashScreen';

import './globals.css';

export const metadata: Metadata = {
  title: 'WC26 Predictor',
  description: 'FIFA World Cup 2026 match predictions & leaderboard',
  appleWebApp: {
    capable: true,
    title: 'WC26 Match Predictor',
    statusBarStyle: 'black-translucent',
    startupImage: [
      {
        url: '/splash/iphone-se.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-8.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-8-plus.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-x.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-xr.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-xs-max.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-12-mini.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-12.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-12-max.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-14-pro.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/iphone-14-pro-max.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/ipad-mini.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/ipad-air.png',
        media:
          '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/ipad-pro-11.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/splash/ipad-pro-129.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body antialiased">
        {/* Runs synchronously during HTML parsing, before the browser's first paint.
            Hides the splash via CSS if this is a pull-to-refresh or browser reload,
            so it never appears visually — React's useLayoutEffect then unmounts it after hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload')document.documentElement.classList.add('splash-reload');}catch(e){}})();`,
          }}
        />
        <div className="min-h-screen bg-wc-black pb-16 sm:pb-0">
          <ClientProviders />
          <SplashScreen />
          <Header />
          <Navigation />
          <main>{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
