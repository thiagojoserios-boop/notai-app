import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryTopic = searchParams.get('topic') || searchParams.get('type');
    const queryId = searchParams.get('id') || searchParams.get('data.id');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const paymentId = queryId || body?.data?.id || body?.id;

    if (paymentId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(paymentId) });

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        let referenceData: { userId?: string; planKey?: string } = {};

        try {
          referenceData = JSON.parse(paymentData.external_reference);
        } catch {
          referenceData = { userId: paymentData.external_reference, planKey: 'plus' };
        }

        const { userId, planKey } = referenceData;

        if (userId) {
          const targetPlan = planKey || 'plus';
          
          // Configurações de acordo com as colunas reais da sua tabela profiles
          const maxClasses = targetPlan === 'pro' ? 9999 : targetPlan === 'plus' ? 9999 : 3;
          const maxMinutes = targetPlan === 'pro' ? 120 : targetPlan === 'plus' ? 60 : 15;

          const { error, data } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: targetPlan,
              classes_used_this_month: 0,
              max_classes_month: maxClasses,
              max_audio_minutes: maxMinutes,
            })
            .eq('id', userId)
            .select();

          if (error) {
            console.error('[Webhook MP] Erro ao atualizar Supabase:', error);
          } else {
            console.log('[Webhook MP] Conta promovida com sucesso:', data);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook MP] Erro:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}