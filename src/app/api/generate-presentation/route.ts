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
Você é um especialista acadêmico e orador profissional.
Com base no conteúdo da aula/atividade abaixo, crie uma estrutura completa de apresentação de slides para seminário (entre 4 a 6 slides).

Dados da Aula:
- Assunto/Tema: ${topic}
- Disciplina: ${subject}
- Conteúdo Base: ${JSON.stringify(activityData || {})}

Para CADA slide da apresentação, forneça:
1. "title": Título curto e atraente do slide.
2. "bulletPoints": Lista com 3 a 4 tópicos diretos e objetivos para estarem visíveis no slide.
3. "speakerNotes": Roteiro em 1ª pessoa ("O que você deve falar"). Deve ser um texto fluido, didático e natural, pronto para o aluno ler/falar na frente da turma sem travar ou parecer um robô.
4. "visualSuggestion": Sugestão de imagem, gráfico ou ícone para ilustrar o slide.

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
            presentationTitle: { type: Type.STRING },
            targetDuration: { type: Type.STRING, description: 'Ex: 5 a 10 minutos' },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  speakerNotes: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                },
                required: ['slideNumber', 'title', 'bulletPoints', 'speakerNotes'],
              },
            },
          },
          required: ['presentationTitle', 'slides'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao gerar apresentação:', error);
    return NextResponse.json({ error: error.message || 'Falha ao gerar slides.' }, { status: 500 });
  }
}