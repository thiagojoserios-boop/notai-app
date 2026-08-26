import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, subject, description, previewPoints } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título não fornecido' }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave não encontrada' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um professor e elaborador de provas acadêmicas.
Com base no conteúdo de aula abaixo, gere um simulado com 4 questões de múltipla escolha para testar a retenção do aluno.

Disciplina: "${subject || 'Geral'}"
Tema: "${title}"
Descrição: "${description}"
Tópicos abordados: "${(previewPoints || []).join(', ')}"

Retorne ESTRITAMENTE um JSON puro no seguinte formato:
{
  "quiz": [
    {
      "id": 1,
      "question": "Enunciado claro e contextualizado da questão",
      "options": [
        "A) Primeira alternativa",
        "B) Segunda alternativa",
        "C) Terceira alternativa",
        "D) Quarta alternativa"
      ],
      "correctIndex": 0, // Índice numérico da resposta correta (0 para A, 1 para B, 2 para C, 3 para D)
      "explanation": "Explicação pedagógica rápida do porquê esta alternativa é a correta."
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
    console.error('Erro ao gerar quiz:', error);
    return NextResponse.json({ error: 'Falha ao criar quiz' }, { status: 500 });
  }
}