import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Tinty – Asystent Kolorysty',
  description: 'Precyzyjne receptury, ważenie chemii i historia koloryzacji.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tinty',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        className={`${inter.className} bg-stone-100 text-stone-900 antialiased selection:bg-rose-100 selection:text-rose-900`}
      >
        {/* Kontener symulujący ekran smartfona na desktopie i wypełniający 100% na telefonie */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-stone-50 shadow-2xl">
          {/* Górny pasek nagłówka (App Bar) */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 font-bold text-white shadow-sm">
                T
              </div>
              <span className="text-lg font-bold tracking-tight text-stone-900">
                Tinty
              </span>
            </div>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/60">
              Salon Pro
            </span>
          </header>

          {/* Główna zawartość z dolnym paddingiem pod BottomNav */}
          <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

          {/* Dolna nawigacja */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}