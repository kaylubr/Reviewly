export type ReviewMode = 'flashcard' | 'mcq' | 'speed';

export type UserDto = {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  totalSessions: number;
  totalStudyTimeMinutes: number;
  createdAt: string;
};

export type ModuleDto = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  tags: string[];
  masteryScore: number;
  totalSessions: number;
  aiProcessed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ModuleDetailDto = ModuleDto & {
  flashcardCount: number;
  questionCount: number;
};

export type GenerateResultDto = {
  flashcardCount: number;
  questionCount: number;
  summary: string;
};

export type ExtractedDocumentDto = {
  text: string;
  characters: number;
};

export type FlashcardDto = {
  id: string;
  question: string;
  answer: string;
  difficulty: number;
};

export type McqQuestionDto = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  difficulty: number;
};

export type SessionStatsInput = {
  moduleId: string;
  mode: ReviewMode;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number;
};

export type SessionCompleteDto = {
  sessionId: string;
  score: number;
  moduleTotalSessions: number;
  masteryScore: number;
};
