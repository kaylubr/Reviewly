import { describe, expect, it } from 'vitest';
import { buildStudySetPrompt, capContent, FLASHCARD_COUNT, MAX_CONTENT_CHARACTERS, QUESTION_COUNT } from './prompt';

describe('buildStudySetPrompt', () => {
  it('includes the study material verbatim', () => {
    const prompt = buildStudySetPrompt('Mitosis produces two identical cells.');

    expect(prompt).toContain('Mitosis produces two identical cells.');
  });

  it('asks for the configured number of flashcards and questions', () => {
    const prompt = buildStudySetPrompt('anything');

    expect(prompt).toContain(`${FLASHCARD_COUNT} flashcards`);
    expect(prompt).toContain(`${QUESTION_COUNT} multiple choice questions`);
  });

  it('tells the model to stick to the supplied material', () => {
    const prompt = buildStudySetPrompt('anything');

    expect(prompt).toContain('Do not invent facts');
  });
});

describe('capContent', () => {
  it('leaves content under the cap untouched', () => {
    const content = 'short notes';

    expect(capContent(content)).toBe(content);
  });

  it('truncates content over the cap', () => {
    const content = 'a'.repeat(MAX_CONTENT_CHARACTERS + 500);
    const capped = capContent(content);

    expect(capped).toHaveLength(MAX_CONTENT_CHARACTERS);
  });

  it('does not touch content exactly at the cap', () => {
    const content = 'a'.repeat(MAX_CONTENT_CHARACTERS);

    expect(capContent(content)).toHaveLength(MAX_CONTENT_CHARACTERS);
  });
});
