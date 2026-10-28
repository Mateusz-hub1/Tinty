import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav, { DesktopNav } from '@/components/BottomNav';
import TintyLogo from '@/components/TintyLogo';
import ThemeToggle from '@/components/ThemeToggle';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Tinty',
  description: 'Tinty',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        {/* Na mobile: max-w-md jak natywna apka. Na desktopie: szeroki dashboard md:max-w-5xl */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-zinc-50 shadow-2xl md:max-w-5xl md:shadow-none dark:bg-zinc-950">
          {/* Górny pasek App Bar */}
          <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 md:px-8 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <TintyLogo className="h-8 w-8 shadow-sm" />
              <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Tinty
              </span>
            </div>

            <div className="flex items-center gap-3">
              <DesktopNav />
              <ThemeToggle />
            </div>
          </header>

          {/* Główna zawartość */}
          <main className="flex-1 px-4 pt-4 pb-28 md:px-8 md:py-6">
            {children}
          </main>

          {/* Dolna nawigacja (widoczna tylko na mobile) */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}