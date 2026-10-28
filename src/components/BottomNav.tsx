'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FlaskConical, Settings } from 'lucide-react';

const navItems = [
    {
        name: 'Klientki',
        href: '/clients',
        icon: Users,
    },
    {
        name: 'Nowa Wizyta',
        href: '/visit/new',
        icon: FlaskConical,
        isPrimary: true,
    },
    {
        name: 'Ustawienia',
        href: '/settings',
        icon: Settings,
    },
];

export function DesktopNav() {
    const pathname = usePathname();

    if (pathname === '/login') {
        return null;
    }

    return (
        <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${item.isPrimary
                                ? isActive
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500'
                                : isActive
                                    ? 'bg-rose-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === '/login') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-zinc-200 bg-white/95 backdrop-blur-md pb-safe md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex h-20 items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);

                    if (item.isPrimary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group relative -top-4 flex flex-col items-center justify-center"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95 ${isActive
                                            ? 'bg-rose-600 text-white shadow-rose-500/30'
                                            : 'bg-zinc-900 text-white shadow-zinc-900/30 dark:bg-fuchsia-600 dark:shadow-fuchsia-600/30'
                                        }`}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span
                                    className={`mt-1 text-[11px] font-semibold tracking-tight ${isActive
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex h-16 w-20 flex-col items-center justify-center rounded-xl transition-colors active:bg-zinc-100 dark:active:bg-zinc-800 ${isActive
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                                }`}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="mt-1 text-[11px] font-medium tracking-tight">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}