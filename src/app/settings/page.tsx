'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    TrendingUp,
    FlaskConical,
    Users,
    Smartphone,
    LogOut,
    Loader2,
    Coins,
    ShieldCheck,
} from 'lucide-react';

const BRAND_RATES = [
    { brand: "L'Oréal Professionnel", rate: '0.75 zł / g', tube: '60g ≈ 45 zł' },
    { brand: 'Wella Professionals', rate: '0.70 zł / g', tube: '60g ≈ 42 zł' },
    { brand: 'Schwarzkopf Igora', rate: '0.65 zł / g', tube: '60g ≈ 39 zł' },
    { brand: 'Matrix SoColor / Tonal', rate: '0.50 zł / g', tube: '90g ≈ 45 zł' },
    { brand: 'Fanola', rate: '0.35 zł / g', tube: '100g ≈ 35 zł' },
];

export default function SettingsPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        clientsCount: 0,
        visitsCount: 0,
        totalMaterialCost: 0,
        totalSurcharges: 0,
    });

    useEffect(() => {
        const loadStats = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace('/login');
                return;
            }

            setEmail(user.email ?? null);

            const [clientsRes, visitsRes] = await Promise.all([
                supabase.from('clients').select('id'),
                supabase.from('visits').select('total_cost, suggested_surcharge'),
            ]);

            const clientsCount = clientsRes.data?.length || 0;
            const visitsList = visitsRes.data || [];
            const visitsCount = visitsList.length;

            const totalMaterialCost = visitsList.reduce(
                (acc, v) => acc + (Number(v.total_cost) || 0),
                0
            );
            const totalSurcharges = visitsList.reduce(
                (acc, v) => acc + (Number(v.suggested_surcharge) || 0),
                0
            );

            setStats({
                clientsCount,
                visitsCount,
                totalMaterialCost,
                totalSurcharges,
            });
            setLoading(false);
        };

        loadStats();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Statystyki ekonomiczne salonu */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rose-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Podsumowanie Salonu
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-stone-50 p-3 border border-stone-100">
                        <div className="flex items-center gap-1.5 text-stone-500">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Baza Klientek</span>
                        </div>
                        <p className="mt-1 text-xl font-extrabold text-stone-900">
                            {stats.clientsCount}
                        </p>
                    </div>

                    <div className="rounded-xl bg-stone-50 p-3 border border-stone-100">
                        <div className="flex items-center gap-1.5 text-stone-500">
                            <FlaskConical className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Zapisane Wizyty</span>
                        </div>
                        <p className="mt-1 text-xl font-extrabold text-stone-900">
                            {stats.visitsCount}
                        </p>
                    </div>

                    <div className="rounded-xl bg-rose-50/70 p-3 border border-rose-100">
                        <span className="text-[11px] font-medium text-rose-800">
                            Zużyty materiał (netto)
                        </span>
                        <p className="mt-1 text-lg font-extrabold text-rose-950">
                            {stats.totalMaterialCost.toFixed(2)} zł
                        </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-100">
                        <span className="text-[11px] font-medium text-emerald-800">
                            Suma dopłat z kalkulatora
                        </span>
                        <p className="mt-1 text-lg font-extrabold text-emerald-950">
                            +{stats.totalSurcharges} zł
                        </p>
                    </div>
                </div>
            </div>

            {/* Przelicznik cen marek */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Przelicznik Kosztów Chemii (zł/g)
                    </h2>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                    {BRAND_RATES.map((item) => (
                        <div
                            key={item.brand}
                            className="flex items-center justify-between py-2.5"
                        >
                            <div>
                                <p className="font-bold text-stone-900">{item.brand}</p>
                                <p className="text-[11px] text-stone-400">{item.tube}</p>
                            </div>
                            <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-bold text-stone-800">
                                {item.rate}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-2.5">
                        <div>
                            <p className="font-bold text-stone-900">Oksydant / Aktywator</p>
                            <p className="text-[11px] text-stone-400">Butelka 1000ml ≈ 80 zł</p>
                        </div>
                        <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-bold text-stone-800">
                            0.08 zł / g
                        </span>
                    </div>
                </div>
            </div>

            {/* Instrukcja instalacji PWA na iPhonie */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-rose-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Aplikacja PWA na iPhone
                    </h2>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                    Aby korzystać z <strong>Tinty</strong> w salonie na pełnym ekranie: otwórz stronę w przeglądarce Safari na iPhonie, kliknij ikonę <strong>Udostępnij</strong> na dolnym pasku i wybierz <strong>„Dodaj do ekranu początkowego”</strong>.
                </p>
            </div>

            {/* Konto i Wylogowanie */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-stone-800">{email}</span>
                    </div>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        RLS Aktywne
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 transition-transform active:scale-95"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Wyloguj z konta</span>
                </button>
            </div>
        </div>
    );
}