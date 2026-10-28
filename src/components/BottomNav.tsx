'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FlaskConical, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    // Ukrywamy nawigację na ekranie logowania
    if (pathname === '/login') {
        return null;
    }

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

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-stone-200 bg-white/95 backdrop-blur-md pb-safe">
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
                                            ? 'bg-rose-600 text-white shadow-rose-200'
                                            : 'bg-stone-900 text-white shadow-stone-300'
                                        }`}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span
                                    className={`mt-1 text-[11px] font-semibold tracking-tight ${isActive ? 'text-rose-600' : 'text-stone-700'
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
                            className={`flex h-16 w-20 flex-col items-center justify-center rounded-xl transition-colors active:bg-stone-100 ${isActive
                                    ? 'text-rose-600'
                                    : 'text-stone-400 hover:text-stone-600'
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