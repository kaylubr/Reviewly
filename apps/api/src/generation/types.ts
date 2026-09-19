import { z } from 'zod';

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

const flashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.number().int().min(1).max(5).catch(1),
});

const questionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().int().min(0),
    explanation: z.string().catch(''),
    difficulty: z.number().int().min(1).max(5).catch(1),
  })
  .refine((question) => question.correctIndex < question.options.length, {
    message: 'correctIndex points past the end of options',
  });

const studySetSchema = z.object({
  summary: z.string().catch(''),
  flashcards: z.array(flashcardSchema),
  questions: z.array(questionSchema),
});

export type GeneratedStudySet = z.infer<typeof studySetSchema>;

export type QuestionGenerator = (content: string) => Promise<GeneratedStudySet>;

export function parseGeneratedStudySet(value: unknown): GeneratedStudySet {
  const result = studySetSchema.safeParse(value);

  if (!result.success) {
    throw new GenerationError('The model returned questions in an unusable shape');
  }

  return result.data;
}
