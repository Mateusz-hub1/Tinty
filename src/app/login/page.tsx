'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            if (isRegistering) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/clients');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/clients');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMsg(err.message);
            } else {
                setErrorMsg('Wystąpił nieoczekiwany błąd');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[75vh] flex-col justify-center px-2">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-200">
                    <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    {isRegistering ? 'Dołącz do Tinty' : 'Witaj w Tinty'}
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                    {isRegistering
                        ? 'Stwórz konto i zapanuj nad recepturami'
                        : 'Twój mobilny asystent koloryzacji'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Adres E-mail
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="twoj@salon.pl"
                            className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Hasło
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 znaków"
                            className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <span>{isRegistering ? 'Zarejestruj się' : 'Zaloguj się'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setErrorMsg(null);
                    }}
                    className="text-xs font-medium text-stone-600 hover:text-rose-600 transition-colors"
                >
                    {isRegistering
                        ? 'Masz już konto? Zaloguj się'
                        : 'Nie masz konta? Zarejestruj się za darmo'}
                </button>
            </div>
        </div>
    );
}