'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/clients');
      } else {
        router.replace('/login');
      }
      setChecking(false);
    };

    checkSession();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      <span className="mt-3 text-xs font-medium text-stone-400">
        Ładowanie Tinty...
      </span>
    </div>
  );
}