'use client';

import React from 'react';
import { X, Check, Zap, Sparkles, Presentation, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Limite do Plano Free Atingido</h2>
          <p className="text-xs text-slate-300">
            {reason || 'Você utilizou as 3 aulas gratuitas deste mês.'}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Plano Plus Universitário</span>
            <span className="text-sm font-extrabold text-white">R$ 19,90 <span className="text-[10px] font-normal text-slate-400">/mês</span></span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Até 30 horas de gravações de aula por mês</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Geração ilimitada de Slides (.pptx) com Roteiro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Flashcards e Simulados com nota ilimitados</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Upload de áudios longos de até 60 minutos</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/planos"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
          >
            <Sparkles className="w-4 h-4" /> Fazer Upgrade para o Plus
          </Link>

          <button
            onClick={onClose}
            className="w-full text-slate-400 hover:text-slate-300 text-xs py-2 transition"
          >
            Continuar no plano gratuito
          </button>
        </div>
      </div>
    </div>
  );
}