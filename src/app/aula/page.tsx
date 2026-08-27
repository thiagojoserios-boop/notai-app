'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, BookOpen, AlertTriangle, ArrowLeft, 
  CheckCircle, BrainCircuit, X, Download, Share2, Layers, HelpCircle, Send, PlayCircle, Loader2,
  Table as TableIcon, FileText, Check, Mic, MicOff, Volume2, Printer, UploadCloud, Music, FileAudio,
  EyeOff, User, LogOut, Zap
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';

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
  requirements: string[];
  nodes?: MindMapNode[];
  table?: TableData;
  summary?: SummarySection[];
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  plan: 'free' | 'plus' | 'pro';
  classes_used_this_month: number;
  max_classes_month: number;
  max_audio_minutes: number;
}

export default function LiveClass() {
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [importantPoints, setImportantPoints] = useState<string[]>([]);
  const [detectedActivity, setDetectedActivity] = useState<ActivityDetected | null>(null);
  const [detectedSubject, setDetectedSubject] = useState<string>('Geral');
  const [showResultModal, setShowResultModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modais de Auth e Upgrade
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modo Discreto / Tela Oculta
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Estados do Microfone
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Estados de Upload de Arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar Perfil do Usuário
  const loadUserProfile = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setUserProfile(data as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil do usuário:', err);
    }
  };

  useEffect(() => {
    loadUserProfile();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(() => {
        loadUserProfile();
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Relógio do Modo Discreto
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cronômetro
  useEffect(() => {
    let timer: any;
    if (isListening) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isListening]);

  // Reconhecimento de Voz
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          if (transcriptPart.trim()) {
            processWithAI(transcriptPart.trim());
          }
          currentInterim = '';
        } else {
          currentInterim += transcriptPart;
        }
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn('Evento de áudio:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        alert('Permissão de microfone negada. Autorize no navegador.');
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current?.shouldKeepListening) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.shouldKeepListening = false;
        recognitionRef.current.stop();
      }
    };
  }, [userProfile]);

  const checkQuotaAndProceed = (): boolean => {
    if (!userProfile) {
      setShowAuthModal(true);
      return false;
    }

    if (
      userProfile.plan === 'free' &&
      userProfile.classes_used_this_month >= userProfile.max_classes_month
    ) {
      setUpgradeReason(
        `Você atingiu o limite de ${userProfile.max_classes_month} aulas gratuitas deste mês no plano Free.`
      );
      setShowUpgradeModal(true);
      return false;
    }

    return true;
  };

  const incrementClassUsage = async () => {
    if (!userProfile || !isSupabaseConfigured || !supabase) return;
    try {
      const nextCount = userProfile.classes_used_this_month + 1;
      await supabase
        .from('profiles')
        .update({ classes_used_this_month: nextCount })
        .eq('id', userProfile.id);

      setUserProfile({
        ...userProfile,
        classes_used_this_month: nextCount,
      });
    } catch (err) {
      console.warn('Erro ao atualizar contagem de aula:', err);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.shouldKeepListening = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      if (!checkQuotaAndProceed()) return;

      try {
        recognitionRef.current.shouldKeepListening = true;
        recognitionRef.current.start();
        setIsListening(true);
        if (transcript.length === 0) {
          incrementClassUsage();
        }
      } catch (err) {
        console.error('Erro ao iniciar microfone:', err);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processWithAI = async (text: string) => {
    setTranscript((prev) => [...prev, text]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fullTranscript: [...transcript, text] }),
      });

      if (!response.ok) throw new Error('Falha na resposta da API');

      const data = await response.json();

      if (data.subject) {
        setDetectedSubject(data.subject);
      }

      if (data.hasExamAlert && data.examAlertText) {
        setImportantPoints((prev) => [...prev, data.examAlertText]);
      }

      if (data.hasActivity && data.activity) {
        setDetectedActivity(data.activity);
      }
    } catch (err) {
      console.error('Erro ao chamar a IA:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploadLoading) return;

    if (!checkQuotaAndProceed()) return;

    // Trava de tamanho/duração do Plano Free (aprox 25MB para 15 min)
    if (userProfile?.plan === 'free' && selectedFile.size > 25 * 1024 * 1024) {
      setUpgradeReason(
        'Arquivos de áudio maiores que 15 minutos são exclusivos dos planos Plus e Pro.'
      );
      setShowUpgradeModal(true);
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('audio', selectedFile);

    try {
      const res = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar o áudio no servidor.');
      }

      if (data.transcripts && Array.isArray(data.transcripts)) {
        setTranscript(data.transcripts);
      }

      if (data.subject) {
        setDetectedSubject(data.subject);
      }

      if (data.hasExamAlert && data.examAlertText) {
        setImportantPoints((prev) => [...prev, data.examAlertText]);
      }

      if (data.hasActivity && data.activity) {
        setDetectedActivity(data.activity);
        setShowResultModal(true);
      } else {
        alert('Áudio processado com sucesso!');
      }

      incrementClassUsage();
    } catch (err: any) {
      console.error('Erro ao enviar áudio:', err);
      alert(`Aviso: ${err.message || 'Falha ao processar arquivo de áudio.'}`);
    } finally {
      setUploadLoading(false);
      setSelectedFile(null);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    if (transcript.length === 0 && !checkQuotaAndProceed()) return;

    if (transcript.length === 0) incrementClassUsage();
    processWithAI(inputText);
    setInputText('');
  };

  const simulatePhrase = (phrase: string) => {
    if (isLoading) return;
    if (transcript.length === 0 && !checkQuotaAndProceed()) return;

    if (transcript.length === 0) incrementClassUsage();
    processWithAI(phrase);
  };

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;

    if (detectedActivity) {
      const reqList = Array.isArray(detectedActivity.requirements) 
        ? detectedActivity.requirements.join(', ') 
        : 'Requisitos registrados';
      setQuickAnswer(`O professor de ${detectedSubject} solicitou um(a) ${detectedActivity.type} sobre "${detectedActivity.topic}". Requisitos: ${reqList}.`);
    } else {
      setQuickAnswer('Nenhum comando formal identificado até o momento.');
    }
    setQuickQuestion('');
  };

  const handleSaveToNotes = async () => {
    if (!detectedActivity) return;

    try {
      const typeKey = detectedActivity.type === 'Mapa Mental' ? 'mapa' : 'resumo';

      let previewPoints: string[] = [];
      if (detectedActivity.nodes && Array.isArray(detectedActivity.nodes)) {
        previewPoints = detectedActivity.nodes.map((n) => n.category);
      } else if (detectedActivity.table && Array.isArray(detectedActivity.table.rows)) {
        previewPoints = detectedActivity.table.rows.map((r) => r[0]);
      } else if (detectedActivity.summary && Array.isArray(detectedActivity.summary)) {
        previewPoints = detectedActivity.summary.map((s) => s.section);
      }

      const reqs = Array.isArray(detectedActivity.requirements)
        ? detectedActivity.requirements.join(', ')
        : 'Atividade identificada em sala';

      const newNote = {
        id: Date.now().toString(),
        subject: detectedSubject || 'Geral',
        title: detectedActivity.topic || 'Anotação de Aula',
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        type: typeKey,
        tag: detectedActivity.type || 'Resumo',
        description: `Atividade identificada na aula. ${reqs}`,
        previewPoints: previewPoints.slice(0, 3),
        activityData: detectedActivity,
      };

      if (isSupabaseConfigured && supabase && userProfile) {
        await supabase.from('notes').insert([
          {
            id: newNote.id,
            user_id: userProfile.id,
            subject: newNote.subject,
            title: newNote.title,
            date: newNote.date,
            type: newNote.type,
            tag: newNote.tag,
            description: newNote.description,
            preview_points: newNote.previewPoints,
            activity_data: newNote.activityData,
          },
        ]);
      }

      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('notai_notes');
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem('notai_notes', JSON.stringify([newNote, ...existing]));
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao sincronizar anotação:', err);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setUserProfile(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      
      {/* MODAL DE AUTENTICAÇÃO */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => loadUserProfile()}
      />

      {/* MODAL DE UPGRADE / COTAS */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />

      {/* OVERLAY: MODO DISCRETO (OLED PURA) */}
      {isStealthMode && (
        <div 
          onDoubleClick={() => setIsStealthMode(false)}
          className="fixed inset-0 z-[999] bg-black flex flex-col justify-between p-8 select-none cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-800 text-xs font-mono">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-900 animate-ping' : 'bg-neutral-800'}`} />
              {isListening ? 'GRAVANDO' : 'PAUSADO'}
            </span>
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-6xl font-light text-neutral-800 font-mono tracking-widest">
              {currentTime}
            </h1>
            <p className="text-[10px] text-neutral-800 uppercase tracking-widest">
              Modo Discreto Ativo
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsStealthMode(false)}
              className="text-[11px] text-neutral-700 bg-neutral-950 border border-neutral-900 px-4 py-2 rounded-full hover:text-neutral-400 transition"
            >
              Toque 2x na tela para desbloquear
            </button>
          </div>
        </div>
      )}

      {/* Topo Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              Sala de Aula Inteligente
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'live' ? 'Captura contínua ou manual em sala' : 'Processamento completo de gravação de áudio'}
            </p>
          </div>
        </div>

        {/* Status de Cota do Usuário e Alternador */}
        <div className="flex flex-wrap items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex flex-col text-right">
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">{userProfile.email}</span>
                <span className="text-[10px] text-indigo-400">
                  {userProfile.plan.toUpperCase()} • {userProfile.classes_used_this_month}/{userProfile.max_classes_month} aulas
                </span>
              </div>
              <button 
                onClick={handleLogout}
                title="Sair"
                className="p-1 hover:text-rose-400 text-slate-500 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" /> Entrar / Cadastrar
            </button>
          )}

          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'live' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Ao Vivo
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                if (isListening) toggleListening();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> Enviar Áudio
            </button>
          </div>

          {activeTab === 'live' && speechSupported && (
            <>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition select-none ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Parar ({formatTimer(elapsedSeconds)})
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Gravar Aula
                  </>
                )}
              </button>

              <button
                onClick={() => setIsStealthMode(true)}
                title="Modo Discreto: escurece a tela para economizar bateria e não chamar atenção na aula"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs transition font-medium"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Modo Discreto
              </button>
            </>
          )}

          <Link 
            href="/anotacoes"
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Ver Anotações
          </Link>
        </div>
      </header>

      {/* ÁREA DE UPLOAD */}
      {activeTab === 'upload' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto w-full space-y-6 text-center my-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <FileAudio className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Carregar Gravação de Aula</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Envie arquivos em <strong>MP3, M4A, WAV ou AAC</strong> gravados pelo celular. A IA identificará o conteúdo e criará mapas mentais.
            </p>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <input 
              type="file" 
              ref={fileInputRef}
              accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/60 p-8 rounded-2xl cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition" />
              {selectedFile ? (
                <div className="text-xs font-medium text-emerald-400 flex items-center gap-2">
                  <Music className="w-4 h-4" /> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-300">Clique para selecionar o arquivo de áudio</p>
                  <span className="text-[11px] text-slate-500">ou arraste e solte o arquivo aqui</span>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedFile || uploadLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processando áudio com Gemini IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Transcrever e Estruturar Aula
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* MODO AO VIVO */
        <>
          {isListening && interimText && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl mb-4 flex items-center gap-3 text-xs text-indigo-200 animate-pulse">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="italic">Ouvindo: &quot;{interimText}&quot;</span>
            </div>
          )}

          <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-indigo-400" /> Simular comandos rápidos:
            </span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => simulatePhrase("Turma, façam uma tabela comparativa detalhada entre Mitose e Meiose.")}
                disabled={isLoading}
                className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-600/30 transition disabled:opacity-50"
              >
                🧬 Biologia: Tabela Mitose vs Meiose
              </button>
              <button 
                onClick={() => simulatePhrase("Pessoal, elaborem um resumo estruturado em tópicos sobre a Era Vargas e suas fases.")}
                disabled={isLoading}
                className="text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition disabled:opacity-50"
              >
                📜 História: Resumo da Era Vargas
              </button>
              <button 
                onClick={() => simulatePhrase("Alunos, montem um mapa mental sobre as Leis de Newton e dinâmica dos corpos.")}
                disabled={isLoading}
                className="text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition disabled:opacity-50"
              >
                ⚡ Física: Mapa Mental Leis de Newton
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Falas Capturadas (Microfone ou Texto)
                  </h2>
                  <span className="text-xs text-slate-500">{transcript.length} falas</span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 text-sm leading-relaxed text-slate-300">
                  {transcript.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Mic className="w-8 h-8 text-slate-600" />
                      <p>Fale no microfone ou digite o comando do professor abaixo.</p>
                    </div>
                  ) : (
                    transcript.map((line, idx) => (
                      <p key={idx} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/50 flex items-start gap-3">
                        <span className="text-xs text-indigo-400 font-mono mt-0.5">#{idx + 1}</span>
                        <span>{line}</span>
                      </p>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={handleSimulateSubmit} className="pt-3 border-t border-slate-800 flex gap-2">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Fale no microfone ou digite aqui o que o professor falou..." 
                  disabled={isLoading}
                  className="flex-1 bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Analisar
                </button>
              </form>
            </div>

            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-purple-400" /> Atividade Detectada
                  </h3>
                  {detectedActivity && (
                    <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                      📚 {detectedSubject}
                    </span>
                  )}
                </div>

                {detectedActivity ? (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-indigo-500/30">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        detectedActivity.type === 'Tabela Comparativa' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        detectedActivity.type === 'Resumo Estruturado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {detectedActivity.type}
                      </span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Pronto</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100">{detectedActivity.topic}</p>
                    
                    <div className="text-xs text-slate-400 space-y-1.5">
                      <p className="font-medium text-slate-300">Requisitos mapeados:</p>
                      {detectedActivity.requirements?.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> {req}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setShowResultModal(true)}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
                    >
                      <Sparkles className="w-4 h-4" /> Visualizar Conteúdo Gerado
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Aguardando a IA detectar uma tarefa nas falas.
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> &ldquo;O que o professor pediu?&rdquo;
                </h3>
                
                <form onSubmit={handleAskAI} className="space-y-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={quickQuestion}
                      onChange={(e) => setQuickQuestion(e.target.value)}
                      placeholder="Ex: O que ele mandou fazer?" 
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl p-3 pr-8 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button type="submit" className="absolute right-2.5 top-2.5 text-indigo-400 hover:text-indigo-300">
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {quickAnswer && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-indigo-400 block mb-1">IA NOTAÍ:</span>
                    {quickAnswer}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Vai Cair na Prova
                </h3>

                {importantPoints.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Nenhum alerta de prova registrado.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {importantPoints.map((point, index) => (
                      <div key={index} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}

      {/* Modal Multi-Formatos */}
      {showResultModal && detectedActivity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  {detectedActivity.type === 'Tabela Comparativa' ? <TableIcon className="w-5 h-5" /> :
                   detectedActivity.type === 'Resumo Estruturado' ? <FileText className="w-5 h-5" /> :
                   <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{detectedActivity.topic}</h3>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                      {detectedSubject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Formato: {detectedActivity.type} gerado pela IA</p>
                </div>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
              {detectedActivity.type === 'Mapa Mental' && (
                <>
                  <div className="flex justify-center">
                    <div className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 text-center text-sm md:text-base">
                      🧠 {detectedActivity.topic}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {detectedActivity.nodes?.map((node, i) => (
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

              {detectedActivity.type === 'Tabela Comparativa' && detectedActivity.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-emerald-400 bg-slate-900/60">
                        {detectedActivity.table.headers.map((head, idx) => (
                          <th key={idx} className="p-3.5 font-bold">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                      {detectedActivity.table.rows.map((row, rIdx) => (
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

              {detectedActivity.type === 'Resumo Estruturado' && detectedActivity.summary && (
                <div className="space-y-4">
                  {detectedActivity.summary.map((section, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="text-sm font-bold text-blue-400">{section.section}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400">Atividade pronta para estudo ou entrega</span>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button 
                  onClick={handleSaveToNotes}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition ${
                    savedSuccess 
                      ? 'bg-emerald-600 shadow-emerald-600/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {savedSuccess ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Salvo em {detectedSubject}!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> Salvar em {detectedSubject}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}