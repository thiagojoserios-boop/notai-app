import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, fullTranscript } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave não encontrada' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é o classificador educacional NOTAÍ.
Analise a fala da aula e identifique a matéria acadêmica, atividades pedagógicas e alertas de prova.

Contexto recente: "${(fullTranscript || []).slice(-3).join(' ')}"
Última fala: "${text}"

Retorne ESTRITAMENTE um JSON puro no formato:
{
  "subject": "Biologia" | "História" | "Matemática" | "Física" | "Química" | "Geografia" | "Português" | "Filosofia" | "Direito" | "Geral",
  "hasActivity": true ou false,
  "activity": {
    "type": "Mapa Mental" | "Tabela Comparativa" | "Resumo Estruturado",
    "topic": "Título claro do tema solicitado",
    "requirements": ["Requisito 1", "Requisito 2"],
    
    "nodes": [
      { "category": "Etapa 1", "items": ["Item A", "Item B"] },
      { "category": "Etapa 2", "items": ["Item C", "Item D"] },
      { "category": "Etapa 3", "items": ["Item E", "Item F"] },
      { "category": "Etapa 4", "items": ["Item G", "Item H"] }
    ],

    "table": {
      "headers": ["Critério", "Item 1", "Item 2"],
      "rows": [
        ["Critério A", "Dado 1A", "Dado 2A"],
        ["Critério B", "Dado 1B", "Dado 2B"]
      ]
    },

    "summary": [
      { "section": "1. Contexto", "content": "Texto..." },
      { "section": "2. Pontos Chave", "content": "Texto..." }
    ]
  } ou null,
  "hasExamAlert": true ou false,
  "examAlertText": "Texto do alerta" ou null
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Falha ao processar análise da IA' }, { status: 500 });
  }
}