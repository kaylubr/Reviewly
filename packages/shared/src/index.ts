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
