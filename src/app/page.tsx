'use client';


import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mic, BookOpen, BrainCircuit, Sparkles, Award, 
  ArrowRight, ShieldCheck, Flame, Clock, 
  ChevronRight, FileText, Table as TableIcon, Layers, Play
} from 'lucide-react';

interface NoteItem {
  id: string;
  subject: string;
  title: string;
  date: string;
  type: string;
  tag: string;
}

export default function HomePage() {
  const [totalNotes, setTotalNotes] = useState(2);
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notai_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTotalNotes(parsed.length + 2); // Somando as anotações padrão
          setRecentNotes(parsed.slice(0, 3));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Topo / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                NOTAÍ
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block -mt-1">
                IA Educacional
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/anotacoes"
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl transition"
            >
              Minhas Anotações
            </Link>
            <Link 
              href="/aula"
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" /> Entrar na Aula
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-12">
        
        {/* Banner de Boas-Vindas */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-900 border border-indigo-500/20 p-8 md:p-12 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inteligência Contextual em Sala de Aula</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Nunca mais perca o que o professor pediu na aula.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              O NOTAÍ escuta sua aula ao vivo, detecta comandos de trabalhos, gera mapas mentais, resumos estruturados e prepara flashcards e simulados instantâneos para você estudar.
            </p>

            {/* Ações Rápidas em Destaque */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                href="/aula"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center gap-2.5 text-sm group"
              >
                <Mic className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition" />
                <span>Gravar Aula ao Vivo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>

              <Link 
                href="/anotacoes"
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-6 py-3.5 rounded-2xl border border-slate-700 transition flex items-center gap-2.5 text-sm"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Acessar Caderno Digital</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Métricas e Indicadores de Desempenho */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Anotações Salvas</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalNotes}</div>
            <p className="text-[11px] text-slate-500">Cadernos sincronizados</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Revisão Ativa</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">Flashcards</div>
            <p className="text-[11px] text-slate-500">Repetição espaçada com IA</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Retenção de Prova</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">Simulados</div>
            <p className="text-[11px] text-slate-500">Gabarito comentado</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Precisão da IA</span>
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">100%</div>
            <p className="text-[11px] text-slate-500">Classificação contextual</p>
          </div>
        </section>

        {/* Módulos do Sistema */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Recursos Disponíveis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Reconhecimento de Voz */}
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-6 rounded-2xl space-y-3 transition group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Escuta Inteligente</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Microfone integrado no navegador com detecção de matéria e extração em tempo real de tarefas e alertas de prova.
              </p>
              <Link href="/aula" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 pt-2">
                Iniciar escuta <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Multi-Formatos */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl space-y-3 transition group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Multi-Formatos Pedagógicos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere automaticamente Mapas Mentais com conexões conceituais, Tabelas Comparativas completas ou Resumos em tópicos.
              </p>
              <Link href="/aula" className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 pt-2">
                Ver formatos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Estudo Ativo */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-6 rounded-2xl space-y-3 transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Flashcards & Simulados</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transforme qualquer aula salva em cartões interativos de memorização ou faça simulados de múltipla escolha com nota e correção.
              </p>
              <Link href="/anotacoes" className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 pt-2">
                Praticar agora <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

        {/* Anotações Recentes */}
        {recentNotes.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Suas Anotações Recentes
              </h2>
              <Link href="/anotacoes" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Ver todas ({totalNotes}) &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentNotes.map((note) => (
                <Link 
                  key={note.id}
                  href="/anotacoes"
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {note.subject}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200 mt-2 line-clamp-1">{note.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500">{note.date}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Rodapé */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>NOTAÍ • Inteligência Artificial em Sala de Aula &copy; 2026</p>
      </footer>

    </div>
  );
}