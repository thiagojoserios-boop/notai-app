import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const { topic, subject, activityData } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave GEMINI_API_KEY não configurada.' }, { status: 500 });
    }

    const prompt = `
Você é um especialista em educação e técnicas de memorização ativa.
Com base no conteúdo da aula/atividade fornecido, crie:
1. 4 a 6 Flashcards para memorização espaçada (com frente/pergunta e verso/resposta explicativa).
2. 3 a 5 Questões de Simulado (múltipla escolha) com 4 opções (A, B, C, D), indicando a alternativa correta e a explicação didática.

Dados da Aula:
- Assunto/Tema: ${topic}
- Disciplina: ${subject}
- Conteúdo Base: ${JSON.stringify(activityData || {})}

Retorne estritamente em formato JSON estruturado.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ['front', 'back'],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        letter: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['letter', 'text'],
                    },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['flashcards', 'quiz'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao gerar Flashcards e Quiz:', error);
    return NextResponse.json({ error: error.message || 'Falha ao gerar material de estudo.' }, { status: 500 });
  }
}