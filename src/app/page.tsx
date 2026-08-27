'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Mic, FileText, CheckCircle2, 
  HelpCircle, Presentation, ArrowRight, ShieldCheck,
  Zap, BrainCircuit, Play, ChevronRight, Lock
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setCurrentUser(data || { id: user.id, email: user.email, plan: 'free' });
        }
      }
    }
    checkAuth();
  }, []);

  const handleProtectedAction = (destination: string) => {
    if (currentUser) {
      router.push(destination);
    } else {
      router.push(`/planos?redirect=${encodeURIComponent(destination)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block">NOTAÍ</span>
            <span className="text-[10px] text-indigo-400 tracking-wider font-semibold uppercase block -mt-1">IA Educacional</span>
          </div>
        </div>

        <nav className="flex items-center gap-3 md:gap-4">
          <Link
            href="/planos"
            className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Planos & Upgrade
          </Link>

          <button
            onClick={() => handleProtectedAction('/anotacoes')}
            className="text-xs font-medium px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition"
          >
            Minhas Anotações
          </button>

          <button
            onClick={() => handleProtectedAction('/aula')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" /> Entrar na Aula
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex-1 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> Inteligência Contextual em Sala de Aula
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Nunca mais perca o que o professor pediu na aula.
          </h1>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            O NOTAÍ escuta sua aula ao vivo, detecta comandos de trabalhos, gera mapas mentais, resumos estruturados e prepara flashcards, simulados e apresentações em PowerPoint (.pptx) instantâneos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleProtectedAction('/aula')}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-7 py-4 rounded-2xl transition shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" /> Gravar Aula ao Vivo <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleProtectedAction('/anotacoes')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-sm font-semibold px-7 py-4 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" /> Acessar Caderno Digital
            </button>
          </div>
        </div>

        {/* Grid de Recursos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Escuta Inteligente</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Microfone integrado no navegador com detecção de matéria e extração em tempo real de tarefas e alertas de prova.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Formatos Pedagógicos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gere mapas mentais, tabelas comparativas, resumos executivos e slides completos com roteiro de orador.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Presentation className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Flashcards & Simulados</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transforme qualquer anotação em cartões interativos de repetição espaçada e simulados com nota comentada.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        NOTAÍ • Inteligência Artificial Educacional © 2026.
      </footer>
    </div>
  );
}