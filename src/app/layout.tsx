import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Configurações de Viewport e cores da barra de status no celular
export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Metadados completos para SEO, Open Graph e PWA
export const metadata: Metadata = {
  metadataBase: new URL('https://meunotai.com.br'),
  title: {
    default: 'NOTAÍ | Inteligência Artificial de Sala de Aula',
    template: '%s | NOTAÍ',
  },
  description:
    'Grave suas aulas, transcreva áudios e receba resumos em tópicos, mapas mentais, flashcards e apresentações prontas em segundos com IA.',
  keywords: [
    'resumo de aula com ia',
    'mapa mental automatico',
    'gerador de slides ia',
    'estudos faculdade',
    'concursos publicos',
    'notai',
    'transcrever aula',
  ],
  authors: [{ name: 'NOTAÍ' }],
  creator: 'NOTAÍ',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NOTAÍ',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'NOTAÍ | Nunca mais perca o que o professor falou na aula',
    description:
      'Grave a aula e gere mapas mentais, flashcards e slides prontos instantaneamente com Inteligência Artificial.',
    url: 'https://meunotai.com.br',
    siteName: 'NOTAÍ',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOTAÍ | Inteligência de Sala de Aula',
    description:
      'Mapas mentais, tabelas e apresentações com IA a partir do áudio da sua aula.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <head>
        {/* Suporte complementar para iOS Web App (Safari) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NOTAÍ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}