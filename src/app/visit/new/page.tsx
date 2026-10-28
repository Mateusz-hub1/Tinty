'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    FlaskConical,
    Timer,
    Play,
    Pause,
    RotateCcw,
    Calculator,
    Save,
    CheckCircle2,
    MessageSquareHeart,
    AlertTriangle,
    User,
    Loader2,
    Sparkles,
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
    phone: string | null;
    natural_base: number;
    porosity: 'low' | 'medium' | 'high';
    gray_percentage: number;
    warning_tags: string[];
}

// Cennik przeliczeniowy: średni koszt 1 grama farby w PLN dla poszczególnych marek
const BRAND_PRICES: Record<string, number> = {
    "L'Oréal": 0.75,
    Wella: 0.70,
    Schwarzkopf: 0.65,
    Matrix: 0.50,
    Fanola: 0.35,
};

const DEVELOPER_PRICE_PER_GRAM = 0.08; // Koszt 1g oksydantu (8 gr/g)
const BRANDS = ["L'Oréal", 'Matrix', 'Wella', 'Schwarzkopf', 'Fanola'];
const DEVELOPERS = ['1.9%', '3%', '6%', '9%', '12%'];

function NewVisitContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get('clientId');

    const [userId, setUserId] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Miska 1: Odrost (Baza)
    const [b1Brand, setB1Brand] = useState<string>("L'Oréal");
    const [b1Shade, setB1Shade] = useState<string>('');
    const [b1Grams, setB1Grams] = useState<string>('40');
    const [b1Dev, setB1Dev] = useState<string>('6%');
    const [b1DevGrams, setB1DevGrams] = useState<string>('40');

    // Miska 2: Długości / Toner
    const [b2Brand, setB2Brand] = useState<string>('Matrix');
    const [b2Shade, setB2Shade] = useState<string>('');
    const [b2Grams, setB2Grams] = useState<string>('30');
    const [b2Dev, setB2Dev] = useState<string>('1.9%');
    const [b2DevGrams, setB2DevGrams] = useState<string>('60');

    const [visitNotes, setVisitNotes] = useState<string>('');

    // Stoper laboratoryjny (domyślnie 35 minut = 2100 sekund)
    const [timerMinutes, setTimerMinutes] = useState<number>(35);
    const [secondsLeft, setSecondsLeft] = useState<number>(35 * 60);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }
            setUserId(user.id);

            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true });

            if (data) {
                const clientList = data as Client[];
                setClients(clientList);
                if (preselectedClientId && clientList.some((c) => c.id === preselectedClientId)) {
                    setSelectedClientId(preselectedClientId);
                } else if (clientList.length > 0) {
                    setSelectedClientId(clientList[0].id);
                }
            }
            setLoading(false);
        };
        init();
    }, [router, preselectedClientId]);

    // Sygnał dźwiękowy (Web Audio API) + wibracja po zakończeniu czasu
    const playAlarm = () => {
        try {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([400, 200, 400, 200, 600]);
            }
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const playBeep = (delay: number, freq: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.35);
            };
            playBeep(0, 880);
            playBeep(0.4, 880);
            playBeep(0.8, 1046.5);
        } catch {
            // Ignoruj błąd jeśli przeglądarka zablokowała AudioContext
        }
    };

    useEffect(() => {
        if (isRunning && secondsLeft > 0) {
            intervalRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        playAlarm();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, secondsLeft]);

    const setPresetTimer = (mins: number) => {
        setIsRunning(false);
        setTimerMinutes(mins);
        setSecondsLeft(mins * 60);
    };

    const formatTime = (totalSecs: number) => {
        const m = Math.floor(totalSecs / 60);
        const s = totalSecs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Kalkulacja kosztów w czasie rzeczywistym
    const g1 = parseFloat(b1Grams) || 0;
    const d1 = parseFloat(b1DevGrams) || 0;
    const g2 = parseFloat(b2Grams) || 0;
    const d2 = parseFloat(b2DevGrams) || 0;

    const bowl1Cost = g1 * (BRAND_PRICES[b1Brand] || 0.6) + d1 * DEVELOPER_PRICE_PER_GRAM;
    const bowl2Cost = g2 * (BRAND_PRICES[b2Brand] || 0.6) + d2 * DEVELOPER_PRICE_PER_GRAM;
    const totalCost = bowl1Cost + bowl2Cost;

    // Zaokrąglanie sugerowanej dopłaty materiałowej w górę do pełnych 10 zł (z narzutem salonowym x1.5)
    const suggestedSurcharge = totalCost > 0 ? Math.ceil((totalCost * 1.5) / 10) * 10 : 0;

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    // Zapis wizyty do Supabase
    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !selectedClientId) {
            setErrorMsg('Wybierz klientkę przed zapisaniem receptury.');
            return;
        }

        setSaving(true);
        setErrorMsg(null);

        const { error } = await supabase.from('visits').insert([
            {
                user_id: userId,
                client_id: selectedClientId,
                bowl1_brand: b1Brand,
                bowl1_shade: b1Shade.trim() || null,
                bowl1_grams: g1,
                bowl1_developer: b1Dev,
                bowl1_dev_grams: d1,
                bowl2_brand: b2Brand,
                bowl2_shade: b2Shade.trim() || null,
                bowl2_grams: g2,
                bowl2_developer: b2Dev,
                bowl2_dev_grams: d2,
                total_cost: Number(totalCost.toFixed(2)),
                suggested_surcharge: suggestedSurcharge,
                notes: visitNotes.trim() || null,
            },
        ]);

        if (error) {
            setErrorMsg('Błąd zapisu: ' + error.message);
        } else {
            setSavedSuccess(true);
        }
        setSaving(false);
    };

    // Moduł 4: Inteligentny generator tekstu SMS pod odcień tonera
    const generateCareSmsHref = () => {
        const firstName = selectedClient ? selectedClient.name.split(' ')[0] : 'Kochana';
        const shadeInfo = b2Shade || b1Shade || 'nowy odcień';

        let careTip =
            'Przez pierwsze 48h wstrzymaj się z myciem głowy, aby pigment idealnie zamknął się w łusce włosa. Stosuj szampon zakwaszający do włosów farbowanych i letnią wodę.';

        if (
            shadeInfo.includes('9') ||
            shadeInfo.includes('10') ||
            shadeInfo.includes('8') ||
            shadeInfo.toLowerCase().includes('blond') ||
            shadeInfo.toLowerCase().includes('v') ||
            shadeInfo.toLowerCase().includes('p')
        ) {
            careTip =
                'Twój chłodny blond kocha nawilżanie! Przez 48h nie myj głowy, unikaj gorącej wody, a raz w tygodniu nałóż maskę regenerującą z chłodnym pigmentem.';
        } else if (
            shadeInfo.includes('.4') ||
            shadeInfo.includes('.6') ||
            shadeInfo.toLowerCase().includes('r') ||
            shadeInfo.toLowerCase().includes('c')
        ) {
            careTip =
                'Aby zachować intensywność rudości/czerwieni, płucz włosy zawsze letnią wodą i stosuj odżywki domykające łuskę bez SLS.';
        }

        const message = `Cześć ${firstName}! ✨ Dziękuję za dzisiejszą wizytę w salonie! Twój kolor (${b2Brand} ${shadeInfo}) wygląda zjawiskowo. Wskazówka pielęgnacyjna: ${careTip} Do zobaczenia na kolejnym odświeżeniu koloru! 💕`;

        const phoneClean = selectedClient?.phone?.replace(/\s+/g, '') || '';
        return `sms:${phoneClean}?&body=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
                <p className="mt-2 text-xs text-stone-500">Przygotowywanie wagi i misek...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Wybór Klientki */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                    <User className="h-3.5 w-3.5 text-rose-600" />
                    <span>Klientka na fotelu</span>
                </label>

                {clients.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                        Brak klientek w bazie. Dodaj najpierw klientkę w zakładce &quot;Klientki&quot;.
                    </div>
                ) : (
                    <select
                        value={selectedClientId}
                        onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSavedSuccess(false);
                        }}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm font-bold text-stone-900 outline-none focus:border-rose-500"
                    >
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} (Baza: {c.natural_base}/10 | Siwizna: {c.gray_percentage}%)
                            </option>
                        ))}
                    </select>
                )}

                {/* Alerty ostrzegawcze wybranej klientki */}
                {selectedClient && selectedClient.warning_tags?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span className="text-[11px] font-bold text-amber-900">Uwaga:</span>
                        {selectedClient.warning_tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* STOPER KOLORYZACJI */}
            <div className="rounded-2xl border border-stone-200 bg-stone-900 p-4 text-white shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                            Stoper Procesu
                        </span>
                    </div>
                    <div className="flex gap-1.5">
                        {[20, 35, 45].map((mins) => (
                            <button
                                key={mins}
                                type="button"
                                onClick={() => setPresetTimer(mins)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${timerMinutes === mins && !isRunning
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                    }`}
                            >
                                {mins}m
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="font-mono text-4xl font-extrabold tracking-tight text-white">
                        {formatTime(secondsLeft)}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-md transition-transform active:scale-95 ${isRunning
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-rose-600 text-white'
                                }`}
                        >
                            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetTimer(timerMinutes)}
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-stone-300 transition-transform active:scale-95"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-4">
                {/* MISKA 1: ODROST */}
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-xs font-extrabold text-rose-700">
                                1
                            </div>
                            <h2 className="text-sm font-bold text-stone-900">
                                Miska 1: Odrost / Baza
                            </h2>
                        </div>
                        <span className="text-xs font-bold text-stone-500">
                            {bowl1Cost.toFixed(2)} zł
                        </span>
                    </div>

                    {/* Wybór marki Miska 1 */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-700">
                            Marka produktu
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {BRANDS.map((brand) => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => setB1Brand(brand)}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${b1Brand === brand
                                        ? 'bg-stone-900 text-white shadow-sm'
                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Odcień i Waga farby */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Odcień / Numer
                            </label>
                            <input
                                type="text"
                                value={b1Shade}
                                onChange={(e) => setB1Shade(e.target.value)}
                                placeholder="np. 6.0 + 6.1"
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Waga farby (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b1Grams}
                                onChange={(e) => setB1Grams(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>

                    {/* Stężenie oksydantu i waga */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Oksydant (%)
                            </label>
                            <select
                                value={b1Dev}
                                onChange={(e) => setB1Dev(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-rose-500"
                            >
                                {DEVELOPERS.map((d) => (
                                    <option key={d} value={d}>
                                        Oksydant {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Waga oksydantu (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b1DevGrams}
                                onChange={(e) => setB1DevGrams(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>
                </div>

                {/* MISKA 2: TONER / DŁUGOŚCI */}
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-xs font-extrabold text-amber-800">
                                2
                            </div>
                            <h2 className="text-sm font-bold text-stone-900">
                                Miska 2: Długości / Toner
                            </h2>
                        </div>
                        <span className="text-xs font-bold text-stone-500">
                            {bowl2Cost.toFixed(2)} zł
                        </span>
                    </div>

                    {/* Wybór marki Miska 2 */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-700">
                            Marka produktu
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {BRANDS.map((brand) => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => setB2Brand(brand)}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${b2Brand === brand
                                        ? 'bg-stone-900 text-white shadow-sm'
                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Odcień i Waga tonera */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Odcień tonera
                            </label>
                            <input
                                type="text"
                                value={b2Shade}
                                onChange={(e) => setB2Shade(e.target.value)}
                                placeholder="np. 10V + 10P"
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Waga tonera (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b2Grams}
                                onChange={(e) => setB2Grams(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>

                    {/* Stężenie oksydantu i waga */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Aktywator / Oksydant
                            </label>
                            <select
                                value={b2Dev}
                                onChange={(e) => setB2Dev(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-900 outline-none focus:border-rose-500"
                            >
                                {DEVELOPERS.map((d) => (
                                    <option key={d} value={d}>
                                        Oksydant {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-700">
                                Waga oksydantu (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b2DevGrams}
                                onChange={(e) => setB2DevGrams(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-rose-500"
                            />
                        </div>
                    </div>
                </div>

                {/* KALKULATOR KOSZTU MATERIAŁU */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-800">
                        <Calculator className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Kalkulator Zużycia Chemii
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white p-3 shadow-xs border border-rose-100">
                            <p className="text-[11px] font-medium text-stone-500">
                                Koszt materiału netto:
                            </p>
                            <p className="mt-0.5 text-xl font-extrabold text-stone-900">
                                {totalCost.toFixed(2)} zł
                            </p>
                            <p className="text-[10px] text-stone-400">
                                Łącznie: {g1 + d1 + g2 + d2} g mieszanki
                            </p>
                        </div>

                        <div className="rounded-xl bg-rose-600 p-3 text-white shadow-sm">
                            <p className="text-[11px] font-medium text-rose-100">
                                Sugerowana dopłata:
                            </p>
                            <p className="mt-0.5 text-xl font-extrabold">
                                +{suggestedSurcharge} zł
                            </p>
                            <p className="text-[10px] text-rose-100">
                                Zaokrąglone do pełnych 10 zł
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notatka techniczna z wizyty */}
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                        Notatka techniczna (np. czas trzymania na końcach, reakcja włosa)
                    </label>
                    <textarea
                        rows={2}
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                        placeholder="np. Miska 2 przeciągnięta na ostatnie 12 minut na mokro przy myjce..."
                        className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-900 outline-none focus:border-rose-500"
                    />
                </div>

                {errorMsg && (
                    <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                        {errorMsg}
                    </div>
                )}

                {/* Przycisk Zapisu Wizyty */}
                <button
                    type="submit"
                    disabled={saving || clients.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="h-4 w-4 text-rose-400" />
                            <span>Zapisz Recepturę w Historii</span>
                        </>
                    )}
                </button>
            </form>

            {/* MODUŁ 4: GENERATOR SMS POZABIEGOWEGO (TROSKA) */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                            Moduł Troski – Zalecenia po wizycie
                        </h3>
                    </div>
                    {savedSuccess && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <CheckCircle2 className="h-3 w-3" /> Zapisano wizytę
                        </span>
                    )}
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                    System automatycznie dobiera zalecenia pod wpisany odcień tonera ({b2Shade || 'standard'}) i otwiera aplikację Wiadomości na iPhonie z gotowym tekstem.
                </p>

                <a
                    href={generateCareSmsHref()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-transform active:scale-[0.98]"
                >
                    <MessageSquareHeart className="h-4 w-4" />
                    <span>
                        Wyślij SMS z zaleceniami {selectedClient ? `do: ${selectedClient.name.split(' ')[0]}` : ''}
                    </span>
                </a>
            </div>
        </div>
    );
}

export default function NewVisitPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[50vh] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
                </div>
            }
        >
            <NewVisitContent />
        </Suspense>
    );
}