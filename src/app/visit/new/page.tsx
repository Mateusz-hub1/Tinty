'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
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
    PackageOpen,
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

interface BrandSpec {
    packagePrice: number; // Cena całej tubki w PLN
    packageGrams: number; // Pojemność tubki w gramach
}

// Specyfikacja opakowań poszczególnych marek
const BRAND_SPECS: Record<string, BrandSpec> = {
    "L'Oréal": { packagePrice: 45, packageGrams: 60 },      // 0.75 zł/g
    Wella: { packagePrice: 42, packageGrams: 60 },          // 0.70 zł/g
    Schwarzkopf: { packagePrice: 39, packageGrams: 60 },    // 0.65 zł/g
    Matrix: { packagePrice: 45, packageGrams: 90 },         // 0.50 zł/g
    Fanola: { packagePrice: 35, packageGrams: 100 },        // 0.35 zł/g
};

// Bazowa cena oksydantu: 30 zł za butelkę 1000 g (0.03 zł/g)
const DEVELOPER_BOTTLE_PRICE = 30;
const DEVELOPER_BOTTLE_GRAMS = 1000;

const BRANDS = ["L'Oréal", 'Matrix', 'Wella', 'Schwarzkopf', 'Fanola'];
const DEVELOPERS = ['1.9%', '3%', '6%', '9%', '12%'];

// Pomocniczy komponent paska zużycia tubki
function TubeUsageIndicator({
    brand,
    usedGrams,
}: {
    brand: string;
    usedGrams: number;
}) {
    const spec = BRAND_SPECS[brand] || { packagePrice: 45, packageGrams: 60 };
    const tubeSize = spec.packageGrams;
    const safeUsed = Math.max(0, usedGrams);

    const remainingGrams = Math.max(0, tubeSize - safeUsed);
    const remainingPct = Math.round((remainingGrams / tubeSize) * 100);
    const usedPct = Math.min(100, Math.round((safeUsed / tubeSize) * 100));
    const isOverOneTube = safeUsed > tubeSize;

    return (
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                    <PackageOpen className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>
                        Tubka {brand} ({tubeSize}g): zużyto {safeUsed}g
                    </span>
                </span>
                {isOverOneTube ? (
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                        Zużyto {(safeUsed / tubeSize).toFixed(1)} tubki
                    </span>
                ) : (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        Pozostało: {remainingGrams}g ({remainingPct}%)
                    </span>
                )}
            </div>

            {/* Wizualny pasek pozostałego produktu w tubce */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${isOverOneTube
                        ? 'bg-amber-500'
                        : remainingPct < 25
                            ? 'bg-rose-500'
                            : 'bg-emerald-500'
                        }`}
                    style={{ width: `${isOverOneTube ? 100 : remainingPct}%` }}
                />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
                <span>Wykorzystano w misce: {usedPct}%</span>
                <span>Cena opakowania: {spec.packagePrice} zł</span>
            </div>
        </div>
    );
}

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

    // Miska 1: Odrost
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

    // Stoper
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
                if (
                    preselectedClientId &&
                    clientList.some((c) => c.id === preselectedClientId)
                ) {
                    setSelectedClientId(preselectedClientId);
                } else if (clientList.length > 0) {
                    setSelectedClientId(clientList[0].id);
                }
            }
            setLoading(false);
        };
        init();
    }, [router, preselectedClientId]);

    // Subtelny, dwutonowy gong relaksacyjny (Web Audio API)
    const playRelaxingChime = () => {
        try {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([200, 150, 300]);
            }
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            const ctx = new AudioCtx();

            const triggerChimeNote = (startTime: number, freq: number, duration: number) => {
                const osc = ctx.createOscillator();
                const subOsc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                subOsc.type = 'triangle';

                osc.frequency.setValueAtTime(freq, startTime);
                subOsc.frequency.setValueAtTime(freq * 1.5, startTime); // Delikatna kwinta harmoniczna

                // Miękkie narastanie (attack) i długie wybrzmiewanie (release) jak w misie tybetańskiej
                gain.gain.setValueAtTime(0.0001, startTime);
                gain.gain.linearRampToValueAtTime(0.18, startTime + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                osc.connect(gain);
                subOsc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                subOsc.start(startTime);
                osc.stop(startTime + duration);
                subOsc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            // Ton 1: 528 Hz (C5), Ton 2: 660 Hz (E5)
            triggerChimeNote(now, 528, 2.2);
            triggerChimeNote(now + 0.65, 660, 2.8);
        } catch {
            // Ignoruj gdy AudioContext zablokowany
        }
    };

    useEffect(() => {
        if (isRunning && secondsLeft > 0) {
            intervalRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        playRelaxingChime();
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

    // --- PRECYZYJNY KALKULATOR KOSZTÓW MATERIAŁU ---
    const g1 = Math.max(0, parseFloat(b1Grams) || 0);
    const d1 = Math.max(0, parseFloat(b1DevGrams) || 0);
    const g2 = Math.max(0, parseFloat(b2Grams) || 0);
    const d2 = Math.max(0, parseFloat(b2DevGrams) || 0);

    const spec1 = BRAND_SPECS[b1Brand] || { packagePrice: 45, packageGrams: 60 };
    const spec2 = BRAND_SPECS[b2Brand] || { packagePrice: 45, packageGrams: 60 };

    const developerRatePerGram = DEVELOPER_BOTTLE_PRICE / DEVELOPER_BOTTLE_GRAMS; // 30 / 1000 = 0.03 zł/g

    // Koszt składnika farby = waga_g * (cena_opakowania / wielkosc_opakowania_g)
    const b1ColorCost = g1 * (spec1.packagePrice / spec1.packageGrams);
    const b1DevCost = d1 * developerRatePerGram;
    const bowl1Cost = b1ColorCost + b1DevCost;

    const b2ColorCost = g2 * (spec2.packagePrice / spec2.packageGrams);
    const b2DevCost = d2 * developerRatePerGram;
    const bowl2Cost = b2ColorCost + b2DevCost;

    // Koszt łączny materiału = suma wszystkich składników z obu misek
    const totalCost = bowl1Cost + bowl2Cost;

    // Rekomendowana dopłata = koszt materiału zaokrąglony w górę do pełnych 10 zł
    const suggestedSurcharge = totalCost > 0 ? Math.ceil(totalCost / 10) * 10 : 0;

    const selectedClient = clients.find((c) => c.id === selectedClientId);

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

    const generateCareSmsHref = () => {
        const firstName = selectedClient
            ? selectedClient.name.split(' ')[0]
            : 'Kochana';
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

        const message = `Cześć ${firstName}! ✨ Dziękuję za dzisiejszą wizytę! Twój kolor (${b2Brand} ${shadeInfo}) wygląda zjawiskowo. Wskazówka pielęgnacyjna: ${careTip} Do zobaczenia na kolejnym odświeżeniu koloru! 💕`;

        const phoneClean = selectedClient?.phone?.replace(/\s+/g, '') || '';
        return `sms:${phoneClean}?&body=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
                <p className="mt-2 text-xs text-zinc-500">Przygotowywanie receptury...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Wybór Klientki */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <User className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Klientka na fotelu</span>
                </label>

                {clients.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        Brak klientek w bazie. Dodaj najpierw klientkę w zakładce &quot;Klientki&quot;.
                    </div>
                ) : (
                    <select
                        value={selectedClientId}
                        onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setSavedSuccess(false);
                        }}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm font-bold text-zinc-900 outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} (Baza: {c.natural_base}/10 | Siwizna: {c.gray_percentage}%)
                            </option>
                        ))}
                    </select>
                )}

                {selectedClient && selectedClient.warning_tags?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 dark:border-amber-900/60 dark:bg-amber-950/60">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                            Uwaga:
                        </span>
                        {selectedClient.warning_tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950 dark:bg-amber-900 dark:text-amber-100"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* STOPER Z GONGIEM RELAKSACYJNYM */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                            Stoper Procesu (Gong Chime)
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
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
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
                                ? 'bg-amber-500 text-zinc-950'
                                : 'bg-rose-600 text-white'
                                }`}
                            aria-label={isRunning ? 'Pauza' : 'Start'}
                        >
                            {isRunning ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5 fill-current" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPresetTimer(timerMinutes)}
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 transition-transform active:scale-95"
                            aria-label="Resetuj stoper"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-4">
                {/* MISKA 1: ODROST */}
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-xs font-extrabold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                1
                            </div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Miska 1: Odrost / Baza
                            </h2>
                        </div>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {bowl1Cost.toFixed(2).replace('.', ',')} zł
                        </span>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Marka produktu
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {BRANDS.map((brand) => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => setB1Brand(brand)}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${b1Brand === brand
                                        ? 'bg-zinc-900 text-white shadow-sm dark:bg-rose-600'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Odcień / Numer
                            </label>
                            <input
                                type="text"
                                value={b1Shade}
                                onChange={(e) => setB1Shade(e.target.value)}
                                placeholder="np. 6.0 + 6.1"
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Waga farby (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b1Grams}
                                onChange={(e) => setB1Grams(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                    </div>

                    {/* Wskaźnik zużycia tubki dla Miski 1 */}
                    <TubeUsageIndicator brand={b1Brand} usedGrams={g1} />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Oksydant (%)
                            </label>
                            <select
                                value={b1Dev}
                                onChange={(e) => setB1Dev(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            >
                                {DEVELOPERS.map((d) => (
                                    <option key={d} value={d}>
                                        Oksydant {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Waga oksydantu (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b1DevGrams}
                                onChange={(e) => setB1DevGrams(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                    </div>
                </div>

                {/* MISKA 2: TONER / DŁUGOŚCI */}
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-100 text-xs font-extrabold text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                                2
                            </div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Miska 2: Długości / Toner
                            </h2>
                        </div>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {bowl2Cost.toFixed(2).replace('.', ',')} zł
                        </span>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Marka produktu
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {BRANDS.map((brand) => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => setB2Brand(brand)}
                                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${b2Brand === brand
                                        ? 'bg-zinc-900 text-white shadow-sm dark:bg-rose-600'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Odcień tonera
                            </label>
                            <input
                                type="text"
                                value={b2Shade}
                                onChange={(e) => setB2Shade(e.target.value)}
                                placeholder="np. 10V + 10P"
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Waga tonera (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b2Grams}
                                onChange={(e) => setB2Grams(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                    </div>

                    {/* Wskaźnik zużycia tubki dla Miski 2 */}
                    <TubeUsageIndicator brand={b2Brand} usedGrams={g2} />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Aktywator / Oksydant
                            </label>
                            <select
                                value={b2Dev}
                                onChange={(e) => setB2Dev(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            >
                                {DEVELOPERS.map((d) => (
                                    <option key={d} value={d}>
                                        Oksydant {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Waga oksydantu (g)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={b2DevGrams}
                                onChange={(e) => setB2DevGrams(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                    </div>
                </div>

                {/* KALKULATOR KOSZTU ZUŻYTEGO MATERIAŁU */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between text-rose-800 dark:text-rose-400">
                        <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                Kalkulator Zużycia Materiału
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Oksydant: 0,03 zł/g
                        </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                        <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
                            <div>
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    Rzeczywisty koszt chemii:
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Miska 1 ({bowl1Cost.toFixed(2).replace('.', ',')} zł) + Miska 2 ({bowl2Cost.toFixed(2).replace('.', ',')} zł)
                                </p>
                            </div>
                            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                                {totalCost.toFixed(2).replace('.', ',')} zł
                            </p>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-rose-600 p-3.5 text-white shadow-sm">
                            <div>
                                <p className="text-xs font-bold">
                                    Sugerowana dopłata do usługi:
                                </p>
                                <p className="text-[11px] text-rose-100">
                                    Zaokrąglone w górę do pełnych 10 zł
                                </p>
                            </div>
                            <p className="text-2xl font-extrabold">
                                {suggestedSurcharge} zł
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notatka techniczna z wizyty */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Notatka techniczna z wizyty
                    </label>
                    <textarea
                        rows={2}
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                        placeholder="np. Miska 2 przeciągnięta na ostatnie 12 minut na mokro przy myjce..."
                        className="w-full rounded-xl border border-zinc-200 p-3 text-xs outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                </div>

                {errorMsg && (
                    <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        {errorMsg}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving || clients.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-rose-600"
                >
                    {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="h-4 w-4 text-rose-400 dark:text-white" />
                            <span>Zapisz Recepturę w Historii</span>
                        </>
                    )}
                </button>
            </form>

            {/* GENERATOR SMS POZABIEGOWEGO */}
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                            Zalecenia po wizycie (SMS)
                        </h3>
                    </div>
                    {savedSuccess && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <CheckCircle2 className="h-3 w-3" /> Zapisano wizytę
                        </span>
                    )}
                </div>

                <p className="text-xs leading-relaxed text-emerald-800 dark:text-zinc-300">
                    Automatycznie dobiera wskazówki pielęgnacyjne pod odcień tonera ({b2Shade || 'standard'}) i otwiera Wiadomości z gotowym tekstem.
                </p>

                <a
                    href={generateCareSmsHref()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
                >
                    <MessageSquareHeart className="h-4 w-4" />
                    <span>
                        Wyślij SMS z zaleceniami{' '}
                        {selectedClient ? `do: ${selectedClient.name.split(' ')[0]}` : ''}
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