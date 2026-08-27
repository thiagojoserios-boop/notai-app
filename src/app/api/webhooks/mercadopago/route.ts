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
    const action = body?.action || body?.type || queryTopic;

    console.log('[Webhook MP] Recebido:', { paymentId, action });

    if (paymentId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(paymentId) });

      console.log('[Webhook MP] Status do pagamento:', paymentData.status);

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        let referenceData: { userId?: string; planKey?: string } = {};

        try {
          referenceData = JSON.parse(paymentData.external_reference);
        } catch {
          // Caso a external_reference seja apenas o userId puro
          referenceData = { userId: paymentData.external_reference, planKey: 'plus' };
        }

        const { userId, planKey } = referenceData;

        if (userId) {
          const targetPlan = planKey || 'plus';

          const { error, data } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: targetPlan,
              classes_count_month: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select();

          if (error) {
            console.error('[Webhook MP] Erro ao atualizar Supabase:', error);
          } else {
            console.log('[Webhook MP] Usuário promovido com sucesso:', data);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook MP] Erro interno:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}