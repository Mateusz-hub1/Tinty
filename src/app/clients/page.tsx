'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    LogOut,
    Search,
    Plus,
    X,
    Phone,
    AlertTriangle,
    Coffee,
    Sparkles,
    Loader2,
    FlaskConical,
    User,
    History,
    ChevronDown,
    ChevronUp,
    Calendar,
} from 'lucide-react';

interface Visit {
    id: string;
    client_id: string;
    bowl1_brand: string | null;
    bowl1_shade: string | null;
    bowl1_grams: number;
    bowl1_developer: string | null;
    bowl1_dev_grams: number;
    bowl2_brand: string | null;
    bowl2_shade: string | null;
    bowl2_grams: number;
    bowl2_developer: string | null;
    bowl2_dev_grams: number;
    total_cost: number;
    suggested_surcharge: number;
    notes: string | null;
    created_at: string;
}

interface Client {
    id: string;
    name: string;
    phone: string | null;
    natural_base: number;
    porosity: 'low' | 'medium' | 'high';
    gray_percentage: number;
    warning_tags: string[];
    personal_notes: string | null;
}

const WARNING_OPTIONS = ['Henna', 'Keratyna', 'Uwrażliwione', 'Alergia PPD', 'Rozjaśniane'];

const POROSITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
};

export default function ClientsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [visitsByClient, setVisitsByClient] = useState<Record<string, Visit[]>>({});
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Formularz dodawania klientki
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [naturalBase, setNaturalBase] = useState<number>(6);
    const [porosity, setPorosity] = useState<'low' | 'medium' | 'high'>('medium');
    const [grayPercentage, setGrayPercentage] = useState<number>(0);
    const [warningTags, setWarningTags] = useState<string[]>([]);
    const [personalNotes, setPersonalNotes] = useState('');
    const [rodoAccepted, setRodoAccepted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            setUserEmail(user.email ?? null);
            await fetchData();
        };

        init();
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        const [clientsRes, visitsRes] = await Promise.all([
            supabase.from('clients').select('*').order('created_at', { ascending: false }),
            supabase.from('visits').select('*').order('created_at', { ascending: false }),
        ]);

        if (clientsRes.data) {
            setClients(clientsRes.data as Client[]);
        }

        if (visitsRes.data) {
            const grouped: Record<string, Visit[]> = {};
            for (const v of visitsRes.data as Visit[]) {
                if (!grouped[v.client_id]) {
                    grouped[v.client_id] = [];
                }
                grouped[v.client_id].push(v);
            }
            setVisitsByClient(grouped);
        }

        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const toggleWarningTag = (tag: string) => {
        setWarningTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setNaturalBase(6);
        setPorosity('medium');
        setGrayPercentage(0);
        setWarningTags([]);
        setPersonalNotes('');
        setRodoAccepted(false); // <-- dodaj tę linijkę tutaj
        setErrorMsg(null);
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setSaving(true);
        setErrorMsg(null);

        const { data, error } = await supabase
            .from('clients')
            .insert([
                {
                    user_id: userId,
                    name: name.trim(),
                    phone: phone.trim() || null,
                    natural_base: naturalBase,
                    porosity,
                    gray_percentage: grayPercentage,
                    warning_tags: warningTags,
                    personal_notes: personalNotes.trim() || null,
                    rodo_accepted: rodoAccepted, // <-- dodaj tę linię tutaj
                },
            ])
            .select()
            .single();

        if (error) {
            setErrorMsg('Błąd zapisu: ' + error.message);
        } else if (data) {
            setClients((prev) => [data as Client, ...prev]);
            resetForm();
            setIsFormOpen(false);
        }
        setSaving(false);
    };

    const filteredClients = clients.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone ? c.phone.toLowerCase().includes(q) : false;
        return matchName || matchPhone;
    });

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            {/* Pasek statusu */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <User className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                            Zalogowano
                        </p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {userEmail ?? 'Ładowanie...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Wyloguj</span>
                </button>
            </div>

            {/* Wyszukiwarka + Przycisk Dodaj */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Szukaj imienia lub telefonu..."
                        className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (isFormOpen) resetForm();
                        setIsFormOpen(!isFormOpen);
                    }}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-semibold text-white shadow-md transition-all active:scale-95 ${isFormOpen
                        ? 'bg-zinc-800 dark:bg-zinc-700'
                        : 'bg-rose-600 shadow-rose-500/20'
                        }`}
                    aria-label="Dodaj klientkę"
                >
                    {isFormOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
            </div>

            {/* Formularz dodawania nowej klientki */}
            {isFormOpen && (
                <form
                    onSubmit={handleAddClient}
                    className="space-y-4 rounded-2xl border border-rose-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Nowa Karta Klientki
                            </h2>
                        </div>
                        <span className="text-[11px] text-zinc-400">Diagnoza włosa</span>
                    </div>

                    {errorMsg && (
                        <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
                            {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Imię i nazwisko / Nick *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="np. Anna Kowalska"
                                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Telefon (do zaleceń SMS)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="np. 500 600 700"
                                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Baza naturalna (Poziom 1–10)
                            </label>
                            <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-zinc-700">
                                Poziom {naturalBase}
                            </span>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setNaturalBase(lvl)}
                                    className={`h-9 rounded-lg text-xs font-bold transition-all ${naturalBase === lvl
                                        ? 'bg-rose-600 text-white shadow-sm scale-105'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Porowatość włosa
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPorosity(p)}
                                    className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${porosity === p
                                        ? 'bg-zinc-900 text-white shadow-sm dark:bg-rose-600'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}
                                >
                                    {POROSITY_LABELS[p]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Udział siwizny (%)
                            </label>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                {grayPercentage}%
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {[0, 25, 50, 75, 100].map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setGrayPercentage(pct)}
                                    className={`rounded-xl py-2 text-xs font-semibold transition-all ${grayPercentage === pct
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Tagi ostrzegawcze (Chemia / Historia)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {WARNING_OPTIONS.map((tag) => {
                                const active = warningTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleWarningTag(tag)}
                                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${active
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                            }`}
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>{tag}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notatka osobista */}
                    <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            <Coffee className="h-3.5 w-3.5 text-amber-600" />
                            <span>Notatka osobista</span>
                        </label>
                        <textarea
                            rows={2}
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                            placeholder="np. Ulubiona kawa, pies, tematy do rozmowy..."
                            className="w-full rounded-xl border border-zinc-200 p-3 text-xs outline-none focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950"
                        />
                    </div>

                    {/* Zgoda RODO */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                required
                                checked={rodoAccepted}
                                onChange={(e) => setRodoAccepted(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            <span className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                <strong className="text-zinc-800 dark:text-zinc-200">Zgoda RODO:</strong> Wyrażam zgodę na przetwarzanie moich danych osobowych (w tym historii koloryzacji i informacji o wrażliwości włosów) w celu świadczenia usług fryzjerskich.
                            </span>
                        </label>
                    </div>

                    {/* Przycisk Zapisz Kartę Klientki */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span>Zapisz Kartę Klientki</span>
                        )}
                    </button>
                </form>
            )}

            {/* Lista Klientek */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
                    <p className="mt-2 text-xs text-zinc-400">Wczytywanie kartotek...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {searchQuery
                            ? 'Brak klientek pasujących do wyszukiwania'
                            : 'Brak zapisanych klientek'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                        Kliknij różowy przycisk &quot;+&quot; obok wyszukiwarki, aby dodać pierwszą kartę.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 items-start">
                    {filteredClients.map((client) => {
                        const clientVisits = visitsByClient[client.id] || [];
                        const isExpanded = expandedClientId === client.id;

                        return (
                            <div
                                key={client.id}
                                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                            {client.name}
                                        </h3>
                                        {client.phone && (
                                            <a
                                                href={`tel:${client.phone}`}
                                                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400"
                                            >
                                                <Phone className="h-3 w-3" />
                                                <span>{client.phone}</span>
                                            </a>
                                        )}
                                    </div>

                                    <Link
                                        href={`/visit/new?clientId=${client.id}`}
                                        className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95 dark:bg-rose-600"
                                    >
                                        <FlaskConical className="h-3.5 w-3.5 text-rose-400 dark:text-white" />
                                        <span>Wizyta</span>
                                    </Link>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        Baza: {client.natural_base}/10
                                    </span>
                                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        Porowatość: {POROSITY_LABELS[client.porosity]}
                                    </span>
                                    {client.gray_percentage > 0 && (
                                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            Siwizna: {client.gray_percentage}%
                                        </span>
                                    )}
                                </div>

                                {client.warning_tags && client.warning_tags.length > 0 && (
                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                        {client.warning_tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300"
                                            >
                                                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {client.personal_notes && (
                                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
                                        <Coffee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                        <p className="leading-relaxed">{client.personal_notes}</p>
                                    </div>
                                )}

                                <div className="mt-3 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedClientId(isExpanded ? null : client.id)
                                        }
                                        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <History className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                            <span>Historia receptur ({clientVisits.length})</span>
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="mt-2 space-y-2">
                                            {clientVisits.length === 0 ? (
                                                <p className="px-2 py-2 text-xs text-zinc-400">
                                                    Brak zapisanych receptur dla tej klientki.
                                                </p>
                                            ) : (
                                                clientVisits.map((v) => (
                                                    <div
                                                        key={v.id}
                                                        className="space-y-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                                                    >
                                                        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-1.5 dark:border-zinc-800">
                                                            <span className="inline-flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                                                                <Calendar className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                                                                {formatDate(v.created_at)}
                                                            </span>
                                                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                                Chemii: {Number(v.total_cost).toFixed(2)} zł (Dopłata: {v.suggested_surcharge} zł)
                                                            </span>
                                                        </div>

                                                        {v.bowl1_grams > 0 && (
                                                            <p className="text-zinc-700 dark:text-zinc-300">
                                                                <strong className="text-zinc-900 dark:text-zinc-100">
                                                                    Miska 1 (Odrost):
                                                                </strong>{' '}
                                                                {v.bowl1_brand} {v.bowl1_shade || '—'} ({v.bowl1_grams}g) + Oksydant{' '}
                                                                {v.bowl1_developer} ({v.bowl1_dev_grams}g)
                                                            </p>
                                                        )}

                                                        {v.bowl2_grams > 0 && (
                                                            <p className="text-zinc-700 dark:text-zinc-300">
                                                                <strong className="text-zinc-900 dark:text-zinc-100">
                                                                    Miska 2 (Toner):
                                                                </strong>{' '}
                                                                {v.bowl2_brand} {v.bowl2_shade || '—'} ({v.bowl2_grams}g) + Oksydant{' '}
                                                                {v.bowl2_developer} ({v.bowl2_dev_grams}g)
                                                            </p>
                                                        )}

                                                        {v.notes && (
                                                            <p className="italic text-zinc-500 dark:text-zinc-400">
                                                                „{v.notes}”
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}