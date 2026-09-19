export const MAX_CONTENT_CHARACTERS = 100_000;
export const FLASHCARD_COUNT = 15;
export const QUESTION_COUNT = 15;

export function capContent(content: string): string {
  return content.length > MAX_CONTENT_CHARACTERS ? content.slice(0, MAX_CONTENT_CHARACTERS) : content;
}

export function buildStudySetPrompt(content: string): string {
  return [
    'You are an expert study assistant. Read the study material below and produce a study set.',
    '',
    `Write ${FLASHCARD_COUNT} flashcards, each with a question, a concise answer, and a difficulty from 1 to 5.`,
    `Write ${QUESTION_COUNT} multiple choice questions, each with exactly 4 options, the index of the correct`,
    'option, an explanation of why that answer is right, and a difficulty from 1 to 5.',
    'The correct answers must vary in position across the questions.',
    'Also write a summary of the material in 2 or 3 sentences.',
    'Base everything only on the material below. Do not invent facts that are not in it.',
    '',
    'Study material:',
    '---',
    content,
    '---',
  ].join('\n');
}
