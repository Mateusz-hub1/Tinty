'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TintyLogo from '@/components/TintyLogo';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

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
                <div className="mx-auto mb-3 flex justify-center">
                    <TintyLogo className="h-16 w-16 shadow-xl rounded-2xl" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Tinty
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isRegistering ? 'Utwórz nowe konto' : 'Zaloguj się do swojego konta'}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
                {errorMsg && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        Adres E-mail
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="twoj@salon.pl"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        Hasło
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 znaków"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-all focus:border-rose-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
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
                    className="text-xs font-medium text-zinc-600 transition-colors hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                >
                    {isRegistering
                        ? 'Masz już konto? Zaloguj się'
                        : 'Nie masz konta? Zarejestruj się'}
                </button>
            </div>
        </div>
    );
}