'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(() => {
        router.push('/anotacoes');
      });
    } else {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-xs text-slate-400">Autenticando e sincronizando seu caderno...</p>
    </div>
  );
}