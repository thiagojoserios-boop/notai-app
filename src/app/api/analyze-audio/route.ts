import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio enviado' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave GEMINI_API_KEY não configurada' }, { status: 500 });
    }

    const fileName = file.name.toLowerCase();
    let mimeType = file.type || 'audio/mp3';

    if (fileName.endsWith('.mp3')) mimeType = 'audio/mp3';
    else if (fileName.endsWith('.wav')) mimeType = 'audio/wav';
    else if (fileName.endsWith('.m4a') || fileName.endsWith('.aac')) mimeType = 'audio/aac';
    else if (fileName.endsWith('.ogg')) mimeType = 'audio/ogg';
    else if (fileName.endsWith('.flac')) mimeType = 'audio/flac';

    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é o assistente educacional NOTAÍ especializado em aulas gravadas.
Analise este áudio e realize as seguintes etapas em português:

1. Extraia e transcreva as falas e explicações mais importantes da aula.
2. Identifique a disciplina acadêmica correspondente.
3. Elabore uma atividade didática estruturada a partir do conteúdo (Mapa Mental, Tabela Comparativa ou Resumo Estruturado).
4. Verifique se há alertas de prova ou trabalhos importantes.

Retorne ESTRITAMENTE um JSON puro no seguinte formato:
{
  "transcripts": ["Fala principal 1...", "Fala principal 2..."],
  "subject": "Biologia" | "História" | "Matemática" | "Física" | "Química" | "Geografia" | "Português" | "Filosofia" | "Direito" | "Geral",
  "hasActivity": true,
  "activity": {
    "type": "Mapa Mental" | "Tabela Comparativa" | "Resumo Estruturado",
    "topic": "Tema principal da aula",
    "requirements": ["Requisito 1", "Requisito 2"],
    "nodes": [
      { "category": "Subtópico 1", "items": ["Item A", "Item B"] },
      { "category": "Subtópico 2", "items": ["Item C", "Item D"] },
      { "category": "Subtópico 3", "items": ["Item E", "Item F"] },
      { "category": "Subtópico 4", "items": ["Item G", "Item H"] }
    ],
    "table": {
      "headers": ["Critério", "Coluna 1", "Coluna 2"],
      "rows": [
        ["Critério A", "Dado 1", "Dado 2"],
        ["Critério B", "Dado 3", "Dado 4"]
      ]
    },
    "summary": [
      { "section": "1. Introdução", "content": "Texto explicativo..." },
      { "section": "2. Desenvolvimento", "content": "Texto explicativo..." }
    ]
  },
  "hasExamAlert": false,
  "examAlertText": null
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let rawText = (response.text || '{}').trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(rawText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Erro na rota de áudio:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar o áudio com a IA' },
      { status: 500 }
    );
  }
}