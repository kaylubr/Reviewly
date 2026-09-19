import { GoogleGenAI } from '@google/genai';
import { buildStudySetPrompt } from './prompt';
import { GenerationError, parseGeneratedStudySet, type QuestionGenerator } from './types';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const studySetJsonSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
          difficulty: { type: 'integer', minimum: 1, maximum: 5 },
        },
        required: ['question', 'answer', 'difficulty'],
      },
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer', minimum: 0 },
          explanation: { type: 'string' },
          difficulty: { type: 'integer', minimum: 1, maximum: 5 },
        },
        required: ['question', 'options', 'correctIndex', 'explanation', 'difficulty'],
      },
    },
  },
  required: ['summary', 'flashcards', 'questions'],
};

export function createGeminiGenerator(): QuestionGenerator {
  let client: GoogleGenAI | null = null;

  return async (content) => {
    if (!client) {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new GenerationError('GEMINI_API_KEY is not configured, so questions cannot be generated');
      }

      client = new GoogleGenAI({ apiKey });
    }

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildStudySetPrompt(content),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: studySetJsonSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;

    if (!text) {
      throw new GenerationError('The model returned an empty response');
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new GenerationError('The model returned a response that was not valid JSON');
    }

    return parseGeneratedStudySet(parsed);
  };
}
