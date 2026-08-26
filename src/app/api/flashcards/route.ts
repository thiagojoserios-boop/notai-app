import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, description, previewPoints } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título não fornecido' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave não encontrada' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um tutor especialista em memorização ativa e repetição espaçada.
Crie um conjunto de 4 a 6 Flashcards educativos e diretos com base neste conteúdo de aula:

Título da Aula: "${title}"
Descrição: "${description}"
Tópicos Chave: "${(previewPoints || []).join(', ')}"

Retorne ESTRITAMENTE um objeto JSON puro no seguinte formato:
{
  "flashcards": [
    {
      "front": "Pergunta objetiva ou conceito para testar a memória",
      "back": "Resposta clara, direta e explicativa",
      "tag": "Dica / Categoria rápida"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao gerar flashcards:', error);
    return NextResponse.json({ error: 'Falha ao criar flashcards' }, { status: 500 });
  }
}