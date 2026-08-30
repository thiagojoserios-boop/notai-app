import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade - NOTAÍ',
  description: 'Política de Privacidade e Termos de Uso do aplicativo NOTAÍ',
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <Link href="/" className="text-xs text-indigo-400 hover:underline uppercase tracking-wider font-semibold">
            ← Voltar para o NOTAÍ
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 text-white">Política de Privacidade</h1>
          <p className="text-sm text-slate-400 mt-1">Última atualização: Agosto de 2026</p>
        </div>

        <section className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed">
          <p>
            A sua privacidade é fundamental para nós. Esta Política de Privacidade descreve como o aplicativo <strong>NOTAÍ</strong> coleta, utiliza, armazena e protege as informações dos usuários.
          </p>

          <h2 className="text-lg font-semibold text-white pt-2">1. Coleta e Uso de Dados</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Áudios e Gravações:</strong> O aplicativo solicita acesso ao microfone do dispositivo exclusivamente para capturar as aulas quando acionado pelo usuário. Os arquivos de áudio são processados temporariamente para transcrição e geração de resumos pedagógicos via inteligência artificial.</li>
            <li><strong>Informações de Conta:</strong> Coletamos apenas informações básicas de autenticação (como e-mail e nome de exibição) para sincronizar suas anotações e gerenciar o acesso às ferramentas.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white pt-2">2. Armazenamento e Segurança</h2>
          <p>
            As notas, transcrições e mapas mentais gerados são armazenados de forma segura em servidores criptografados. Não compartilhamos, vendemos ou alugamos dados pessoais de usuários para terceiros para fins de marketing ou publicidade.
          </p>

          <h2 className="text-lg font-semibold text-white pt-2">3. Permissões do Dispositivo</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Microfone:</strong> Necessário para permitir a gravação de áudio das aulas.</li>
            <li><strong>Acesso à Rede:</strong> Necessário para sincronizar suas anotações na nuvem e comunicar com as APIs de processamento.</li>
          </ul>

          <h2 className="text-lg font-semibold text-white pt-2">4. Seus Direitos e Exclusão de Dados</h2>
          <p>
            Você pode solicitar a qualquer momento a exclusão permanente de sua conta e de todos os seus áudios e resumos armazenados através dos nossos canais de suporte.
          </p>

          <h2 className="text-lg font-semibold text-white pt-2">5. Contato de Suporte</h2>
          <p>
            Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato através do e-mail: <strong className="text-indigo-400">suporte@meunotai.com.br</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}