'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mic, BookOpen, BrainCircuit, Award, 
  Presentation, EyeOff, ArrowRight, CheckCircle, 
  FileText, Table as TableIcon, Layers, Zap, Download
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Note {
  id: string;
  subject: string;
  title: string;
  date: string;
  type: string;
  tag: string;
  description: string;
}

export default function HomePage() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);

  useEffect(() => {
    async function loadStats() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);

          if (!error && data) {
            setRecentNotes(
              data.map((d: any) => ({
                id: d.id,
                subject: d.subject,
                title: d.title,
                date: d.date,
                type: d.type,
                tag: d.tag,
                description: d.description,
              }))
            );
            setTotalNotes(data.length);
            return;
          }
        } catch (e) {}
      }

      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('notai_notes');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setRecentNotes(parsed.slice(0, 4));
            setTotalNotes(parsed.length);
          } catch (e) {}
        }
      }
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                NOTAÍ
              </span>
              <span className="text-[9px] uppercase tracking-widest text-indigo-400 block -mt-1 font-semibold">
                IA Educacional
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/anotacoes"
              className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" /> Minhas Anotações
            </Link>

            <Link
              href="/planos"
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 hover:bg-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Planos & Upgrade
            </Link>

            <Link
              href="/aula"
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Mic className="w-4 h-4" /> Entrar na Aula
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 flex-1 w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" /> Inteligência Contextual em Sala de Aula
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Nunca mais perca o que o professor pediu na aula.
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              O NOTAÍ escuta sua aula ao vivo (ou gravações de áudio), detecta comandos de trabalhos, gera mapas mentais, resumos estruturados, simulados comentados e <strong>apresentações de slides em PowerPoint (.pptx)</strong> prontas com roteiro de fala.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/aula"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-xl shadow-indigo-600/30"
              >
                <Mic className="w-4 h-4" /> Gravar Aula ao Vivo <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/anotacoes"
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium px-5 py-3 rounded-xl text-xs transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" /> Acessar Caderno Digital
              </Link>
            </div>
          </div>
        </div>

        {/* MÉTRICAS / DESTAQUES RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Anotações Salvas
            </span>
            <p className="text-2xl font-black text-white">{totalNotes}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Cadernos sincronizados</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Revisão Ativa
            </span>
            <p className="text-xl font-extrabold text-white">Flashcards</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Repetição espaçada com IA</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Retenção de Prova
            </span>
            <p className="text-xl font-extrabold text-white">Simulados</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Gabarito e nota imediata</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
              <Presentation className="w-3.5 h-3.5 text-emerald-400" /> Apresentações
            </span>
            <p className="text-xl font-extrabold text-white">PowerPoint</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Exporta .pptx + Roteiro</span>
          </div>
        </div>

        {/* CARDS DE RECURSOS */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Recursos Disponíveis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Escuta & Modo Discreto */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl flex flex-col justify-between space-y-4 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Escuta & Modo Discreto</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Microfone em tempo real ou upload de áudio com tela preta AMOLED para não chamar atenção na sala de aula.
                </p>
              </div>
              <Link href="/aula" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-2">
                Iniciar escuta <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Formatos Pedagógicos */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl flex flex-col justify-between space-y-4 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Multi-Formatos Pedagógicos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Geração automática de Mapas Mentais conceituais, Tabelas Comparativas completas ou Resumos Estruturados.
                </p>
              </div>
              <Link href="/anotacoes" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-2">
                Ver formatos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Flashcards & Simulados */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl flex flex-col justify-between space-y-4 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Flashcards & Simulados</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transforme qualquer aula salva em cartões interativos de memorização ativa ou faça simulados com correção.
                </p>
              </div>
              <Link href="/anotacoes" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-2">
                Praticar agora <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4: Slides PowerPoint */}
            <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl flex flex-col justify-between space-y-4 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Presentation className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Seminários & Slides (.pptx)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Monte apresentações completas com roteiro de fala para o orador e baixe diretamente no formato PowerPoint.
                </p>
              </div>
              <Link href="/anotacoes" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-2">
                Gerar slides <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ANOTAÇÕES RECENTES */}
        {recentNotes.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Suas Anotações Recentes
              </h2>
              <Link href="/anotacoes" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                Ver todas ({totalNotes}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href="/anotacoes"
                  className="bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-2xl transition space-y-2 group block"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                    {note.subject}
                  </span>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">{note.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        NOTAÍ • Inteligência Artificial em Tempo Real para Alunos e Concurseiros
      </footer>
    </div>
  );
}