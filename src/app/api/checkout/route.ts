import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});

const PLAN_CONFIGS: Record<string, { title: string; price: number }> = {
  'plus-monthly': { title: 'NOTAÍ - Plano Plus Universitário (Mensal)', price: 19.90 },
  'plus-yearly': { title: 'NOTAÍ - Plano Plus Universitário (Anual)', price: 178.80 },
  'pro-monthly': { title: 'NOTAÍ - Plano Pro Concursos (Mensal)', price: 39.90 },
  'pro-yearly': { title: 'NOTAÍ - Plano Pro Concursos (Anual)', price: 358.80 },
};

export async function POST(request: Request) {
  try {
    const { planKey, billingCycle, userId, userEmail } = await request.json();

    const configKey = `${planKey}-${billingCycle}`;
    const selectedPlan = PLAN_CONFIGS[configKey];

    if (!selectedPlan || !userId) {
      return NextResponse.json({ error: 'Dados inválidos para checkout.' }, { status: 400 });
    }

    const preference = new Preference(client);
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://notai-app.vercel.app';

    const response = await preference.create({
      body: {
        items: [
          {
            id: configKey,
            title: selectedPlan.title,
            unit_price: Number(selectedPlan.price),
            quantity: 1,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: userEmail || undefined,
        },
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' } // Remove Boleto Bancário
          ],
          installments: 12,
        },
        external_reference: JSON.stringify({ userId, planKey }),
        back_urls: {
          success: `${origin}/aula?upgrade=success`,
          failure: `${origin}/planos?upgrade=failed`,
          pending: `${origin}/planos?upgrade=pending`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/webhook/mercadopago`,
      },
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error: any) {
    console.error('Erro ao gerar checkout:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}