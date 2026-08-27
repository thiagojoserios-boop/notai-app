import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || searchParams.get('type');
    const id = searchParams.get('id') || searchParams.get('data.id');

    // Mercado Pago pode enviar dados no body ou query param
    const body = await request.json().catch(() => ({}));
    const paymentId = id || body?.data?.id;

    if (paymentId && (topic === 'payment' || body?.type === 'payment' || body?.action === 'payment.created' || body?.action === 'payment.updated')) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        try {
          const { userId, planKey } = JSON.parse(paymentData.external_reference);

          if (userId && planKey && supabase) {
            // Atualiza o plano do usuário e reseta contadores
            await supabase
              .from('profiles')
              .update({
                plan: planKey,
                classes_count_month: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          }
        } catch (parseError) {
          console.error('Erro ao processar external_reference:', parseError);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no processamento do webhook:', error);
    return NextResponse.json({ received: true }, { status: 200 }); // Sempre retornar 200 pro MP não ficar reenviando
  }
}