'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Check, Sparkles, Zap, Crown, ArrowLeft, 
  ShieldCheck, Presentation, 
  CreditCard, QrCode, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/aula';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setCurrentUser(data || { id: user.id, email: user.email, plan: 'free' });
        }
      }
    }
    getUser();
  }, []);

  const handleSelectPlan = async (planKey: string) => {
    if (!currentUser) {
      setSelectedPlanToBuy(planKey);
      setShowAuthModal(true);
      return;
    }

    if (planKey === 'free') {
      router.push(redirectTarget);
      return;
    }

    if (currentUser?.plan === planKey) {
      router.push(redirectTarget);
      return;
    }

    try {
      setLoadingPlan(planKey);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          billingCycle,
          userId: currentUser.id,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || 'Não foi possível gerar a sessão de pagamento.');
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      alert('Erro de conexão ao processar pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedPlanToBuy === 'free' || !selectedPlanToBuy) {
      router.push(redirectTarget);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-8">
        <Link href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">NOTAÍ Planos</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full space-y-10 flex-1">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full inline-block">
            Investimento no seu Desempenho
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Estude com inteligência, passe na frente.
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Economize horas de anotação e revisão por semana. Resumos estruturados, simulados comentados e apresentações em PowerPoint (.pptx) em segundos.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-500'}`}>
              Mensal
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-7 bg-slate-900 border border-slate-700 rounded-full p-1 relative transition flex items-center cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full bg-indigo-500 transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-7 bg-emerald-400' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white font-bold' : 'text-slate-500'}`}>
              Anual <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">Economize 30%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* GRATUITO */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gratuito</span>
                <h3 className="text-xl font-bold text-white">Iniciante</h3>
                <p className="text-xs text-slate-400">Para testar o poder da IA nas suas primeiras aulas do mês.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-white">R$ 0</span>
                <span className="text-xs text-slate-500"> /para sempre</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>3 aulas</strong> por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Áudios de até <strong>15 minutos</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Mapas Mentais e Tabelas Básicas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Flashcards e Simulado por aula</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('free')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
            >
              {currentUser ? 'Continuar no Plano Grátis' : 'Começar Grátis'}
            </button>
          </div>

          {/* PLUS */}
          <div className="bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-lg border border-indigo-400/30">
              Mais Escolhido
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Universitário
                </span>
                <h3 className="text-xl font-bold text-white">Plano Plus</h3>
                <p className="text-xs text-slate-300">Tudo o que você precisa para dominar o semestre da faculdade.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-white">
                  {billingCycle === 'monthly' ? 'R$ 19,90' : 'R$ 14,90'}
                </span>
                <span className="text-xs text-slate-400"> /mês {billingCycle === 'yearly' && '(cobrado anualmente)'}</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-indigo-500/20">
                <li className="flex items-center gap-2 font-medium text-indigo-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Aulas Ilimitadas</strong> no mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Áudios de até <strong>60 minutos</strong></span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-amber-300">
                  <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Exportar Slides em <strong>PowerPoint (.pptx)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Roteiro do Orador para Apresentações</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Modo Discreto em Sala de Aula</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronização em Nuvem sem limites</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('plus')}
              disabled={loadingPlan === 'plus'}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingPlan === 'plus' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Gerando Pagamento...
                </>
              ) : currentUser?.plan === 'plus' ? (
                'Seu Plano Atual'
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Assinar Plano Plus
                </>
              )}
            </button>
          </div>

          {/* PRO */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Foco Máximo
                </span>
                <h3 className="text-xl font-bold text-white">Pro Concursos</h3>
                <p className="text-xs text-slate-400">Para concurseiros, pós-graduandos e maratonas de estudo intensas.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-black text-white">
                  {billingCycle === 'monthly' ? 'R$ 39,90' : 'R$ 29,90'}
                </span>
                <span className="text-xs text-slate-500"> /mês {billingCycle === 'yearly' && '(cobrado anualmente)'}</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Tudo do plano Plus incluído</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Áudios de até <strong>120 minutos</strong> (aulas duplas)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Geração em massa de simulados tipo banca (CESPE/FGV)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Prioridade máxima no processamento de IA</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={loadingPlan === 'pro'}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-amber-500/30 text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingPlan === 'pro' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Gerando Pagamento...
                </>
              ) : currentUser?.plan === 'pro' ? (
                'Seu Plano Atual'
              ) : (
                <>
                  <Crown className="w-4 h-4" /> Assinar Pro Concursos
                </>
              )}
            </button>
          </div>

        </div>

        <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Garantia incondicional de 7 dias</p>
              <p className="text-[11px] text-slate-400">Cancele quando quiser diretamente no painel com 1 clique.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1"><QrCode className="w-4 h-4 text-emerald-400" /> Pix Instantâneo</span>
            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4 text-indigo-400" /> Cartão de Crédito</span>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full pt-8 text-center text-xs text-slate-500 border-t border-slate-800/80">
        NOTAÍ • Pagamentos processados com segurança pelo Mercado Pago.
      </footer>
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Carregando planos...</div>}>
      <PlansContent />
    </Suspense>
  );
}