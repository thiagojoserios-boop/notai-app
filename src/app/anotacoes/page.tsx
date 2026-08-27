'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, ArrowLeft, Search, Filter, 
  Trash2, BrainCircuit, Sparkles, X, Award, RotateCcw, 
  Presentation, ChevronLeft, ChevronRight, Copy, Check, Mic, Loader2, CheckCircle,
  Download
} from 'lucide-react';
import Link from 'next/link';
import pptxgen from 'pptxgenjs';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Flashcard {
  front: string;
  back: string;
}

interface QuizOption {
  letter: string;
  text: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
}

interface SlideItem {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualSuggestion?: string;
}

interface PresentationData {
  presentationTitle: string;
  targetDuration?: string;
  slides: SlideItem[];
}

interface Note {
  id: string;
  subject: string;
  title: string;
  date: string;
  type: string;
  tag: string;
  description: string;
  previewPoints: string[];
  activityData?: any;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Estados de Carregamento por Card
  const [loadingStudyId, setLoadingStudyId] = useState<string | null>(null);
  const [loadingSlidesId, setLoadingSlidesId] = useState<string | null>(null);

  // Flashcards & Quiz
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [studyTab, setStudyTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [key: number]: string }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Apresentação de Slides
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);

  useEffect(() => {
    async function loadNotes() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped: Note[] = data.map((d) => ({
              id: d.id,
              subject: d.subject,
              title: d.title,
              date: d.date,
              type: d.type,
              tag: d.tag,
              description: d.description,
              previewPoints: d.preview_points || [],
              activityData: d.activity_data,
            }));
            setNotes(mapped);
            return;
          }
        } catch (e) {
          console.warn('Erro ao ler do Supabase, buscando local...', e);
        }
      }

      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('notai_notes');
        if (raw) {
          try {
            setNotes(JSON.parse(raw));
          } catch (e) {}
        }
      }
    }

    loadNotes();
  }, []);

  const subjects = ['all', ...Array.from(new Set(notes.map((n) => n.subject)))];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || n.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir esta anotação?')) return;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {}
    }

    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notai_notes', JSON.stringify(updated));
    }
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const handleGenerateStudyMaterials = async (note: Note) => {
    setSelectedNote(note);
    setFlashcards([]);
    setQuizQuestions([]);
    setPresentation(null);
    setLoadingStudyId(note.id);

    try {
      const res = await fetch('/api/generate-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: note.title,
          subject: note.subject,
          activityData: note.activityData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFlashcards(data.flashcards || []);
        setQuizQuestions(data.quiz || []);
        setCurrentFlashcardIndex(0);
        setIsFlipped(false);
        setSelectedQuizAnswers({});
        setShowQuizResults(false);
      } else {
        alert(`Erro: ${data.error || 'Não foi possível gerar os flashcards.'}`);
      }
    } catch (err: any) {
      alert(`Falha na conexão: ${err.message || 'Erro inesperado'}`);
    } finally {
      setLoadingStudyId(null);
    }
  };

  const handleGeneratePresentation = async (note: Note) => {
    setSelectedNote(note);
    setFlashcards([]);
    setQuizQuestions([]);
    setPresentation(null);
    setLoadingSlidesId(note.id);

    try {
      const res = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: note.title,
          subject: note.subject,
          activityData: note.activityData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.slides && data.slides.length > 0) {
        setPresentation(data);
        setCurrentSlideIndex(0);
      } else {
        alert(`Erro na IA: ${data.error || 'A IA não retornou slides válidos.'}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o servidor: ${err.message || 'Erro de rede'}`);
    } finally {
      setLoadingSlidesId(null);
    }
  };

  const handleDownloadPPTX = () => {
    if (!presentation) return;

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // Slide de Capa
    const coverSlide = pptx.addSlide();
    coverSlide.background = { color: '0F172A' };

    coverSlide.addText(presentation.presentationTitle, {
      x: 1.0,
      y: 2.0,
      w: 11.3,
      h: 1.5,
      fontSize: 32,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });

    coverSlide.addText(`Disciplina: ${selectedNote?.subject || 'Geral'} | NOTAÍ`, {
      x: 1.0,
      y: 3.6,
      w: 11.3,
      h: 0.8,
      fontSize: 16,
      color: '818CF8',
      align: 'center',
    });

    // Slides de Conteúdo com Notas do Orador
    presentation.slides.forEach((slide) => {
      const s = pptx.addSlide();
      s.background = { color: '020617' };

      // Título
      s.addText(slide.title, {
        x: 0.8,
        y: 0.6,
        w: 11.5,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: 'F8FAFC',
      });

      // Tópicos
      const bulletText = slide.bulletPoints.map((bp) => ({
        text: bp,
        options: { fontSize: 16, color: 'CBD5E1', bullet: true, breakLine: true, spacing: { line: 32 } },
      }));

      s.addText(bulletText, {
        x: 0.8,
        y: 1.8,
        w: 11.5,
        h: 4.2,
        align: 'left',
      });

      // Roteiro do Apresentador
      if (slide.speakerNotes) {
        s.addNotes(`Roteiro de Apresentação (NOTAÍ):\n\n${slide.speakerNotes}`);
      }
    });

    const fileName = `${(presentation.presentationTitle || 'apresentacao').replace(/\s+/g, '_')}.pptx`;
    pptx.writeFile({ fileName });
  };

  const handleCopySpeakerNotes = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctAnswer) correct++;
    });
    return correct;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Topo */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Caderno de Anotações
            </h1>
            <p className="text-xs text-slate-400">
              Revise matérias, gere simulados e exporte slides em PowerPoint com IA
            </p>
          </div>
        </div>

        <Link
          href="/aula"
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Sparkles className="w-4 h-4" /> Gravar Nova Aula
        </Link>
      </header>

      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por tema, resumo ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`text-xs px-3 py-1.5 rounded-xl capitalize shrink-0 transition ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sub === 'all' ? 'Todas as Matérias' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhuma anotação encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">Grave uma aula ao vivo para começar a povoar seu caderno.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isGeneratingThisSlide = loadingSlidesId === note.id;
            const isGeneratingThisStudy = loadingStudyId === note.id;

            return (
              <div
                key={note.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                      {note.subject}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{note.date}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{note.description}</p>

                  {note.previewPoints && note.previewPoints.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      {note.previewPoints.map((pt, i) => (
                        <div key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botões de Ação do Card */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleGenerateStudyMaterials(note)}
                      disabled={isGeneratingThisStudy || isGeneratingThisSlide}
                      className="bg-purple-600/20 hover:bg-purple-600 disabled:opacity-50 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {isGeneratingThisStudy ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Criando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" /> Flashcards & Quiz
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGeneratePresentation(note)}
                      disabled={isGeneratingThisStudy || isGeneratingThisSlide}
                      className="bg-amber-600/20 hover:bg-amber-600 disabled:opacity-50 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {isGeneratingThisSlide ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Criando slides...
                        </>
                      ) : (
                        <>
                          <Presentation className="w-3 h-3" /> Gerar Slides
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => handleDelete(note.id, e)}
                      className="text-slate-500 hover:text-rose-400 text-xs transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: APRESENTAÇÃO DE SLIDES & PPTX DOWNLOAD */}
      {presentation && selectedNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{presentation.presentationTitle}</h3>
                  <p className="text-xs text-slate-400">
                    Seminário pronto • {presentation.slides.length} slides • Duração sugerida: {presentation.targetDuration || '5 a 8 min'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPPTX}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md"
                >
                  <Download className="w-4 h-4" /> Baixar PowerPoint (.pptx)
                </button>

                <button
                  onClick={() => setPresentation(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visualizador de Slide Atual */}
            {presentation.slides[currentSlideIndex] && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Lado Esquerdo: O Slide Visual */}
                <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-2xl min-h-[320px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                        Slide {presentation.slides[currentSlideIndex].slideNumber} de {presentation.slides.length}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">NOTAÍ Slides</span>
                    </div>

                    <h4 className="text-lg font-bold text-white leading-snug">
                      {presentation.slides[currentSlideIndex].title}
                    </h4>

                    <div className="space-y-2 pt-2">
                      {presentation.slides[currentSlideIndex].bulletPoints.map((bp, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{bp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {presentation.slides[currentSlideIndex].visualSuggestion && (
                    <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] text-slate-500 italic">
                      💡 <strong>Dica visual:</strong> {presentation.slides[currentSlideIndex].visualSuggestion}
                    </div>
                  )}
                </div>

                {/* Lado Direito: O Roteiro do Orador */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-amber-400" /> Roteiro de Fala (O que dizer)
                      </span>
                      <button
                        onClick={() => handleCopySpeakerNotes(presentation.slides[currentSlideIndex].speakerNotes)}
                        className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 transition flex items-center gap-1"
                      >
                        {copiedNote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedNote ? 'Copiado!' : 'Copiar fala'}
                      </button>
                    </div>

                    <p className="text-xs text-amber-100/90 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-amber-500/20">
                      &quot;{presentation.slides[currentSlideIndex].speakerNotes}&quot;
                    </p>
                  </div>

                  <p className="text-[11px] text-amber-400/70 italic">
                    Use como guia para apresentar de forma didática e sem esquecer os pontos-chave.
                  </p>
                </div>

              </div>
            )}

            {/* Controles de Navegação do Slide */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 px-3.5 py-2 rounded-xl transition"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {presentation.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      currentSlideIndex === idx ? 'bg-amber-400 w-6' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1))}
                disabled={currentSlideIndex === presentation.slides.length - 1}
                className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-semibold px-4 py-2 rounded-xl transition"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: FLASHCARDS & SIMULADO */}
      {(flashcards.length > 0 || quizQuestions.length > 0) && selectedNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedNote.title}</h3>
                  <p className="text-xs text-slate-400">Simulador de Fixação e Flashcards</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFlashcards([]);
                  setQuizQuestions([]);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setStudyTab('flashcards')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  studyTab === 'flashcards' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🗂️ Flashcards ({flashcards.length})
              </button>
              <button
                onClick={() => setStudyTab('quiz')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  studyTab === 'quiz' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📝 Simulado ({quizQuestions.length} questões)
              </button>
            </div>

            {studyTab === 'flashcards' && flashcards.length > 0 && (
              <div className="space-y-4">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="bg-slate-950 border border-purple-500/30 min-h-[220px] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/60 transition shadow-inner select-none relative"
                >
                  <span className="text-[10px] uppercase font-bold text-purple-400 absolute top-3 right-3 bg-purple-500/10 px-2 py-0.5 rounded">
                    {isFlipped ? 'Resposta' : 'Pergunta (Clique p/ virar)'}
                  </span>
                  <p className="text-base font-medium text-slate-100 max-w-md leading-relaxed">
                    {isFlipped ? flashcards[currentFlashcardIndex].back : flashcards[currentFlashcardIndex].front}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={currentFlashcardIndex === 0}
                    className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span>{currentFlashcardIndex + 1} de {flashcards.length}</span>
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentFlashcardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                    }}
                    disabled={currentFlashcardIndex === flashcards.length - 1}
                    className="px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {studyTab === 'quiz' && quizQuestions.length > 0 && (
              <div className="space-y-6">
                {quizQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <p className="text-xs font-bold text-slate-200">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5">
                      {q.options.map((opt) => {
                        const isSelected = selectedQuizAnswers[qIdx] === opt.letter;
                        const isCorrect = q.correctAnswer === opt.letter;
                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850';

                        if (showQuizResults) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-purple-600/30 border-purple-500 text-purple-200 font-medium';
                        }

                        return (
                          <button
                            key={opt.letter}
                            onClick={() => {
                              if (!showQuizResults) {
                                setSelectedQuizAnswers((prev) => ({ ...prev, [qIdx]: opt.letter }));
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition ${btnStyle}`}
                          >
                            <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                              {opt.letter}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/60 mt-2">
                        💡 <strong>Explicação:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  {showQuizResults ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Award className="w-4 h-4" />
                        <span>Acertos: {calculateScore()} de {quizQuestions.length}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowQuizResults(false);
                          setSelectedQuizAnswers({});
                        }}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Refazer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowQuizResults(true)}
                      disabled={Object.keys(selectedQuizAnswers).length === 0}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-lg"
                    >
                      Verificar Respostas e Nota
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}