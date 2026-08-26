'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, BookOpen, AlertTriangle, ArrowLeft, 
  CheckCircle, BrainCircuit, X, Download, Share2, Layers, HelpCircle, Send, PlayCircle, Loader2,
  Table as TableIcon, FileText, Check, Mic, MicOff, Volume2, Printer, UploadCloud, Music, FileAudio
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
  requirements: string[];
  nodes?: MindMapNode[];
  table?: TableData;
  summary?: SummarySection[];
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

  // Estados do Microfone
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Estados de Upload de Arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.shouldKeepListening = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        recognitionRef.current.shouldKeepListening = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Erro ao iniciar microfone:', err);
      }
    }
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
    processWithAI(inputText);
    setInputText('');
  };

  const simulatePhrase = (phrase: string) => {
    if (isLoading) return;
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

      if (isSupabaseConfigured && supabase) {
        await supabase.from('notes').insert([
          {
            id: newNote.id,
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

  const handleExportFile = () => {
    if (!detectedActivity) return;

    let content = `# NOTAÍ - ${detectedActivity.topic}\n\n`;
    content += `**Disciplina:** ${detectedSubject}\n`;
    content += `**Tipo:** ${detectedActivity.type}\n`;
    content += `**Data:** ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    if (detectedActivity.requirements && Array.isArray(detectedActivity.requirements)) {
      content += `## Requisitos Identificados:\n${detectedActivity.requirements.map((r) => `- ${r}`).join('\n')}\n\n`;
    }

    if (detectedActivity.type === 'Mapa Mental' && detectedActivity.nodes) {
      content += `## Estrutura do Mapa Mental:\n\n`;
      detectedActivity.nodes.forEach((n) => {
        content += `### ${n.category}\n`;
        n.items?.forEach((it) => { content += `- ${it}\n`; });
        content += '\n';
      });
    } else if (detectedActivity.type === 'Tabela Comparativa' && detectedActivity.table) {
      content += `## Tabela Comparativa:\n\n`;
      content += `| ${detectedActivity.table.headers.join(' | ')} |\n`;
      content += `| ${detectedActivity.table.headers.map(() => '---').join(' | ')} |\n`;
      detectedActivity.table.rows.forEach((r) => {
        content += `| ${r.join(' | ')} |\n`;
      });
    } else if (detectedActivity.type === 'Resumo Estruturado' && detectedActivity.summary) {
      content += `## Resumo Estruturado:\n\n`;
      detectedActivity.summary.forEach((s) => {
        content += `### ${s.section}\n${s.content}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(detectedActivity.topic || 'anotacao').replace(/\s+/g, '_')}_notai.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    if (!detectedActivity) return;

    let bodyHTML = '';

    if (detectedActivity.type === 'Mapa Mental' && detectedActivity.nodes) {
      bodyHTML = `
        <div style="display: flex; justify-content: center; margin: 20px 0;">
          <div style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🧠 ${detectedActivity.topic}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px;">
          ${detectedActivity.nodes.map((n) => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
              <h4 style="color: #4f46e5; margin: 0 0 10px 0; text-transform: uppercase; font-size: 13px; font-weight: bold;">${n.category}</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
                ${n.items?.map((it) => `<li>${it}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    } else if (detectedActivity.type === 'Tabela Comparativa' && detectedActivity.table) {
      bodyHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #0f172a;">
              ${detectedActivity.table.headers.map((h) => `<th style="padding: 12px; text-align: left; font-weight: bold;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${detectedActivity.table.rows.map((row) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                ${row.map((cell, idx) => `<td style="padding: 12px; color: #334155; ${idx === 0 ? 'font-weight: bold; color: #0f172a;' : ''}">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (detectedActivity.type === 'Resumo Estruturado' && detectedActivity.summary) {
      bodyHTML = `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 16px;">
          ${detectedActivity.summary.map((s) => `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px;">
              <h3 style="color: #2563eb; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${s.section}</h3>
              <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6;">${s.content}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${detectedActivity.topic} - NOTAÍ</title>
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
              <div style="font-size: 12px; font-weight: bold; color: #4f46e5; letter-spacing: 1px; margin-bottom: 4px;">NOTAÍ • IA EDUCACIONAL</div>
              <h1 class="title">${detectedActivity.topic}</h1>
              <div class="meta">Disciplina: <strong>${detectedSubject}</strong> | Data: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="badge">${detectedActivity.type}</div>
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      
      {/* Topo com Seleção de Modo (Ao Vivo vs Upload) */}
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
              {activeTab === 'live' ? 'Captura ao vivo via microfone ou texto' : 'Processamento completo de gravação de áudio'}
            </p>
          </div>
        </div>

        {/* Alternador de Modo e Ações */}
        <div className="flex items-center gap-3">
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
                  <MicOff className="w-4 h-4" /> Parar Escuta
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Ativar Microfone
                </>
              )}
            </button>
          )}

          <Link 
            href="/anotacoes"
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Ver Anotações
          </Link>

          {(isLoading || uploadLoading) && (
            <span className="text-xs text-indigo-400 flex items-center gap-1.5 animate-pulse bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando com IA...
            </span>
          )}
        </div>
      </header>

      {/* ÁREA DE UPLOAD DE ARQUIVO */}
      {activeTab === 'upload' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto w-full space-y-6 text-center my-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <FileAudio className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Carregar Gravação de Aula</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Envie arquivos nos formatos <strong>MP3, M4A, WAV ou AAC</strong> gravados pelo celular. A IA estruturará a aula e os mapas mentais.
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
                  onClick={handlePrintPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-rose-500/30 transition shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" /> Gerar PDF
                </button>
                <button 
                  onClick={handleExportFile}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Markdown (.md)
                </button>
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