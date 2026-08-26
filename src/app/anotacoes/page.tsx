'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, BrainCircuit, FileText, AlertTriangle, Search, 
  Filter, Calendar, ArrowLeft, Layers, Trash2, Sparkles, X, ChevronLeft, ChevronRight, RotateCw, Loader2,
  Table as TableIcon, Download, Printer, Award, CheckCircle2, XCircle, Trophy
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface MindMapNode {
  category: string;
  items: string[];
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface SummarySection {
  section: string;
  content: string;
}

interface ActivityDetected {
  type: 'Mapa Mental' | 'Tabela Comparativa' | 'Resumo Estruturado' | string;
  topic: string;
  requirements?: string[];
  nodes?: MindMapNode[];
  table?: TableData;
  summary?: SummarySection[];
}

interface NoteItem {
  id: string;
  subject: string;
  title: string;
  date: string;
  type: 'mapa' | 'resumo' | 'prova';
  tag: string;
  description: string;
  previewPoints: string[];
  activityData?: ActivityDetected;
}

interface Flashcard {
  front: string;
  back: string;
  tag?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const defaultNotes: NoteItem[] = [
  {
    id: '1',
    subject: 'História',
    title: 'Revolução Francesa: Causas e Grupos Políticos',
    date: '25 de Agosto de 2026',
    type: 'mapa',
    tag: 'Mapa Mental',
    description: 'Atividade gerada contendo a separação por causas socioeconômicas, tomada da bastilha e grupos políticos.',
    previewPoints: ['Crise do Antigo Regime', 'Girondinos vs Jacobinos', 'Declaração dos Direitos'],
    activityData: {
      type: 'Mapa Mental',
      topic: 'Revolução Francesa: Causas e Grupos Políticos',
      requirements: ['Elaborar mapa mental estruturado', 'Separar grupos políticos e fases'],
      nodes: [
        { category: 'Causas', items: ['Crise do Antigo Regime', 'Déficit financeiro', 'Fome popular'] },
        { category: 'Fase Inicial', items: ['Queda da Bastilha', 'Estados Gerais', 'Fim do feudalismo'] },
        { category: 'Grupos Políticos', items: ['Girondinos (moderados)', 'Jacobinos (radicais)', 'Planície (centro)'] },
        { category: 'Desfecho', items: ['Convenção Nacional', 'Fase do Terror', 'Reação Termidoriana'] }
      ]
    }
  },
  {
    id: '2',
    subject: 'Biologia',
    title: 'Mitose vs Meiose',
    date: '25 de Agosto de 2026',
    type: 'resumo',
    tag: 'Tabela Comparativa',
    description: 'Comparação detalhada dos processos de divisão celular, ploidia e finalidade.',
    previewPoints: ['Tipo de Célula', 'Número de Divisões', 'Variabilidade Genética'],
    activityData: {
      type: 'Tabela Comparativa',
      topic: 'Mitose vs Meiose',
      requirements: ['Comparar critérios fundamentais de divisão celular'],
      table: {
        headers: ['Critério', 'Mitose', 'Meiose'],
        rows: [
          ['Tipo de Célula', 'Células Somáticas', 'Células Germinativas'],
          ['Divisões Celulares', '1 Divisão', '2 Divisões'],
          ['Células-Filhas', '2 células idênticas (2n)', '4 células com variabilidade (n)'],
          ['Crossing-over', 'Não ocorre', 'Ocorre na Prófase I']
        ]
      }
    }
  }
];

export default function AnotacoesPage() {
  const [notes, setNotes] = useState<NoteItem[]>(defaultNotes);
  const [selectedSubject, setSelectedSubject] = useState<string>('Todas');
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modais
  const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);

  // Flashcards
  const [activeNoteForFlashcards, setActiveNoteForFlashcards] = useState<NoteItem | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Quiz / Simulado
  const [activeNoteForQuiz, setActiveNoteForQuiz] = useState<NoteItem | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Busca do Supabase com fallback para o localStorage
  useEffect(() => {
    const fetchNotes = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const formattedNotes: NoteItem[] = data.map((item) => ({
              id: item.id,
              subject: item.subject,
              title: item.title,
              date: item.date,
              type: item.type,
              tag: item.tag,
              description: item.description,
              previewPoints: item.preview_points || [],
              activityData: item.activity_data || undefined,
            }));
            setNotes([...formattedNotes, ...defaultNotes]);
            return;
          }
        } catch (e) {
          console.warn('Falha ao conectar com a nuvem, utilizando cache local:', e);
        }
      }

      const saved = localStorage.getItem('notai_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotes([...parsed, ...defaultNotes]);
        } catch (e) {
          console.error('Erro ao ler cache local:', e);
        }
      }
    };

    fetchNotes();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao deletar da nuvem:', err);
      }
    }

    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    const customOnly = updated.filter((n) => n.id !== '1' && n.id !== '2');
    localStorage.setItem('notai_notes', JSON.stringify(customOnly));
  };

  const handleOpenFlashcards = async (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveNoteForFlashcards(note);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setLoadingCards(true);

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          description: note.description,
          previewPoints: note.previewPoints
        })
      });

      if (!res.ok) throw new Error('Erro na requisição');
      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
      }
    } catch (err) {
      setFlashcards([
        {
          front: `Qual o ponto principal abordado em "${note.title}"?`,
          back: note.description,
          tag: 'Conceito Geral'
        }
      ]);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleOpenQuiz = async (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveNoteForQuiz(note);
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizCompleted(false);
    setLoadingQuiz(true);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          subject: note.subject,
          description: note.description,
          previewPoints: note.previewPoints
        })
      });

      if (!res.ok) throw new Error('Erro na requisição');
      const data = await res.json();
      if (data.quiz && data.quiz.length > 0) {
        setQuizQuestions(data.quiz);
      }
    } catch (err) {
      setQuizQuestions([
        {
          id: 1,
          question: `Sobre o conteúdo de "${note.title}", qual afirmativa é correta?`,
          options: [
            "A) O conteúdo aborda os conceitos essenciais da matéria",
            "B) Não possui relevância acadêmica",
            "C) É um tema sem desdobramentos práticos",
            "D) Nenhuma das anteriores"
          ],
          correctIndex: 0,
          explanation: "Este tema sintetiza os pontos centrais trabalhados em aula."
        }
      ]);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === quizQuestions[quizIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleExportNote = (note: NoteItem) => {
    let content = `# NOTAÍ - ${note.title}\n\n`;
    content += `**Disciplina:** ${note.subject}\n`;
    content += `**Data:** ${note.date}\n\n`;
    content += `**Descrição:** ${note.description}\n\n`;

    const act = note.activityData;
    if (act?.type === 'Mapa Mental' && act.nodes) {
      content += `## Estrutura do Mapa Mental:\n\n`;
      act.nodes.forEach((n) => {
        content += `### ${n.category}\n`;
        n.items?.forEach((it) => { content += `- ${it}\n`; });
        content += '\n';
      });
    } else if (act?.type === 'Tabela Comparativa' && act.table) {
      content += `## Tabela Comparativa:\n\n`;
      content += `| ${act.table.headers.join(' | ')} |\n`;
      content += `| ${act.table.headers.map(() => '---').join(' | ')} |\n`;
      act.table.rows.forEach((r) => {
        content += `| ${r.join(' | ')} |\n`;
      });
    } else if (act?.type === 'Resumo Estruturado' && act.summary) {
      content += `## Resumo Estruturado:\n\n`;
      act.summary.forEach((s) => {
        content += `### ${s.section}\n${s.content}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title.replace(/\s+/g, '_')}_notai.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = (note: NoteItem) => {
    let bodyHTML = '';
    const act = note.activityData;

    if (act?.type === 'Mapa Mental' && act.nodes) {
      bodyHTML = `
        <div style="display: flex; justify-content: center; margin: 20px 0;">
          <div style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🧠 ${note.title}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px;">
          ${act.nodes.map(n => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
              <h4 style="color: #4f46e5; margin: 0 0 10px 0; text-transform: uppercase; font-size: 13px; font-weight: bold;">${n.category}</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
                ${n.items?.map(it => `<li>${it}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    } else if (act?.type === 'Tabela Comparativa' && act.table) {
      bodyHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #0f172a;">
              ${act.table.headers.map(h => `<th style="padding: 12px; text-align: left; font-weight: bold;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${act.table.rows.map(row => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                ${row.map((cell, idx) => `<td style="padding: 12px; color: #334155; ${idx === 0 ? 'font-weight: bold; color: #0f172a;' : ''}">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (act?.type === 'Resumo Estruturado' && act.summary) {
      bodyHTML = `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 16px;">
          ${act.summary.map(s => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
              <h3 style="color: #2563eb; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${s.section}</h3>
              <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6;">${s.content}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      bodyHTML = `
        <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
          <p style="color: #334155; font-size: 13px; line-height: 1.6;">${note.description}</p>
          <div style="margin-top: 14px;">
            <strong>Tópicos principais:</strong>
            <ul style="margin-top: 6px; padding-left: 20px; font-size: 13px; color: #334155;">
              ${note.previewPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${note.title} - NOTAÍ</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: bold; color: #0f172a; margin: 0; }
            .meta { font-size: 12px; color: #64748b; margin-top: 6px; }
            .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-size: 12px; font-weight: bold; color: #4f46e5; letter-spacing: 1px; margin-bottom: 4px;">NOTAÍ • CADERNO DIGITAL</div>
              <h1 class="title">${note.title}</h1>
              <div class="meta">Disciplina: <strong>${note.subject}</strong> | Data: ${note.date}</div>
            </div>
            <div class="badge">${note.tag}</div>
          </div>

          ${bodyHTML}

          <div class="footer">
            Gerado automaticamente por NOTAÍ - Inteligência Artificial para Sala de Aula
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const subjects = ['Todas', 'Biologia', 'História', 'Física', 'Matemática', 'Geral'];

  const filteredNotes = notes.filter((note) => {
    const matchesSubject = selectedSubject === 'Todas' || note.subject === selectedSubject;
    const matchesType = selectedType === 'Todos' || note.type === selectedType;
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      
      {/* Topo */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              Minhas Anotações
            </h1>
            <p className="text-sm text-slate-400">Estude com Visualizador, Flashcards e Simulados por IA</p>
          </div>
        </div>

        <Link 
          href="/aula" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 text-sm"
        >
          <Layers className="w-4 h-4" /> Gravar Nova Aula
        </Link>
      </header>

      {/* Barra de Filtros e Busca */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por assunto, matéria ou termo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Todos">Todos os Formatos</option>
            <option value="mapa">Mapas Mentais</option>
            <option value="resumo">Resumos & Tabelas</option>
            <option value="prova">Pontos de Prova</option>
          </select>
        </div>
      </section>

      {/* Grid de Cards de Anotações */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-sm">
            Nenhuma anotação encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div 
              key={note.id} 
              onClick={() => setViewingNote(note)}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 cursor-pointer transition rounded-2xl p-5 flex flex-col justify-between space-y-4 group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    📚 {note.subject}
                  </span>
                  
                  {note.type === 'mapa' && (
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> {note.tag}
                    </span>
                  )}
                  {note.type === 'resumo' && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {note.tag}
                    </span>
                  )}
                  {note.type === 'prova' && (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {note.tag}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-slate-100 text-base group-hover:text-indigo-400 transition leading-snug">
                  {note.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {note.description}
                </p>

                {note.previewPoints && note.previewPoints.length > 0 && (
                  <div className="mt-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Destaques:</span>
                    {note.previewPoints.map((point, index) => (
                      <div key={index} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> {note.date}
                </span>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={(e) => handleOpenQuiz(note, e)}
                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-lg transition font-medium text-xs border border-amber-500/30"
                    title="Fazer Simulado / Quiz"
                  >
                    <Award className="w-3.5 h-3.5" /> Quiz
                  </button>

                  <button 
                    onClick={(e) => handleOpenFlashcards(note, e)}
                    className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg transition font-medium text-xs border border-indigo-500/30"
                    title="Estudar com Flashcards"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Cards
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintPDF(note);
                    }}
                    className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Imprimir ou Salvar PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={(e) => handleDelete(note.id, e)}
                    className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition" 
                    title="Excluir anotação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </section>

      {/* MODAL 1: VISUALIZADOR COMPLETO */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  {viewingNote.activityData?.type === 'Tabela Comparativa' ? <TableIcon className="w-5 h-5" /> :
                   viewingNote.activityData?.type === 'Resumo Estruturado' ? <FileText className="w-5 h-5" /> :
                   <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{viewingNote.title}</h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                      {viewingNote.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{viewingNote.tag} • Salvo em {viewingNote.date}</p>
                </div>
              </div>
              <button onClick={() => setViewingNote(null)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
              {viewingNote.activityData?.type === 'Mapa Mental' && viewingNote.activityData.nodes && (
                <>
                  <div className="flex justify-center">
                    <div className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 text-center text-sm md:text-base">
                      🧠 {viewingNote.title}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {viewingNote.activityData.nodes.map((node, i) => (
                      <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">{node.category}</span>
                        {node.items?.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-300 leading-relaxed">• {item}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {viewingNote.activityData?.type === 'Tabela Comparativa' && viewingNote.activityData.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-emerald-400 bg-slate-900/60">
                        {viewingNote.activityData.table.headers.map((head, idx) => (
                          <th key={idx} className="p-3.5 font-bold">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {viewingNote.activityData.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40 transition">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`p-3.5 ${cIdx === 0 ? 'font-semibold text-slate-200' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewingNote.activityData?.type === 'Resumo Estruturado' && viewingNote.activityData.summary && (
                <div className="space-y-4">
                  {viewingNote.activityData.summary.map((section, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-sm font-bold text-blue-400">{section.section}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400">Material completo salvo no histórico</span>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button 
                  onClick={() => handlePrintPDF(viewingNote)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-rose-500/30 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> PDF
                </button>
                <button 
                  onClick={() => handleExportNote(viewingNote)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar (.md)
                </button>
                <button 
                  onClick={() => {
                    const target = viewingNote;
                    setViewingNote(null);
                    handleOpenQuiz(target);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition"
                >
                  <Award className="w-3.5 h-3.5" /> Iniciar Quiz
                </button>
                <button 
                  onClick={() => {
                    const target = viewingNote;
                    setViewingNote(null);
                    handleOpenFlashcards(target);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Flashcards
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: MODO SIMULADO / QUIZ */}
      {activeNoteForQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Modo Simulado & Quiz</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeNoteForQuiz.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveNoteForQuiz(null)} 
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingQuiz ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-amber-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs text-slate-400">A IA está formulando suas questões e gabarito...</p>
              </div>
            ) : isQuizCompleted ? (
              <div className="py-8 text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Trophy className="w-12 h-12 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Simulado Concluído!</h4>
                  <p className="text-xs text-slate-400 mt-1">Confira seu aproveitamento no tema</p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-sm mx-auto space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pontuação Final</span>
                  <div className="text-4xl font-extrabold text-amber-400">
                    {score} / {quizQuestions.length}
                  </div>
                  <p className="text-xs text-slate-300">
                    Aproveitamento de <strong>{Math.round((score / quizQuestions.length) * 100)}%</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => handleOpenQuiz(activeNoteForQuiz)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={() => setActiveNoteForQuiz(null)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
                  >
                    Concluir Estudo
                  </button>
                </div>
              </div>
            ) : quizQuestions.length > 0 ? (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Questão {quizIndex + 1} de {quizQuestions.length}</span>
                  <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Pontos: {score}
                  </span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {quizQuestions[quizIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {quizQuestions[quizIndex].options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = optIdx === quizQuestions[quizIndex].correctIndex;
                      
                      let btnStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
                      
                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md shadow-rose-500/10';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-950 border-indigo-500 text-indigo-100 shadow-md shadow-indigo-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed flex items-center justify-between transition ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswerSubmitted && (
                    <div className="mt-4 p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-amber-400 block">💡 Explicação do Gabarito:</span>
                      <p className="leading-relaxed">{quizQuestions[quizIndex].explanation}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    {!isAnswerSubmitted ? 'Selecione uma opção e confirme' : 'Veja a explicação acima antes de avançar'}
                  </span>

                  {!isAnswerSubmitted ? (
                    <button 
                      onClick={handleConfirmAnswer}
                      disabled={selectedOption === null}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                    >
                      Confirmar Resposta
                    </button>
                  ) : (
                    <button 
                      onClick={handleNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
                    >
                      {quizIndex < quizQuestions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* MODAL 3: FLASHCARDS */}
      {activeNoteForFlashcards && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Revisão Ativa: Flashcards</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeNoteForFlashcards.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveNoteForFlashcards(null)} 
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingCards ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs text-slate-400">A IA está gerando suas perguntas e respostas de estudo...</p>
              </div>
            ) : flashcards.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Cartão {currentIndex + 1} de {flashcards.length}</span>
                  <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {flashcards[currentIndex].tag || 'Conceito'}
                  </span>
                </div>

                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[220px] p-8 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between select-none ${
                    isFlipped 
                      ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg shadow-indigo-500/10' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>{isFlipped ? '💡 Resposta / Explicação' : '❓ Pergunta'}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <RotateCw className="w-3 h-3" /> Clique para virar
                    </span>
                  </div>

                  <div className="my-4 text-center">
                    <p className={`text-base md:text-lg font-medium leading-relaxed ${isFlipped ? 'text-indigo-200' : 'text-slate-100'}`}>
                      {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
                    </p>
                  </div>

                  <div className="text-center text-[11px] text-slate-500">
                    {isFlipped ? 'Toque novamente para ver a pergunta' : 'Toque no cartão para conferir a resposta'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button 
                    onClick={() => {
                      setIsFlipped(false);
                      if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
                    }}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>

                  <button 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Virar Cartão
                  </button>

                  <button 
                    onClick={() => {
                      setIsFlipped(false);
                      if (currentIndex < flashcards.length - 1) setCurrentIndex((prev) => prev + 1);
                    }}
                    disabled={currentIndex === flashcards.length - 1}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition"
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}