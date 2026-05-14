import { createClient } from '@insforge/sdk'
import { logger } from '../lib/logger.js'

const AI_MODEL = process.env.AI_MODEL || 'anthropic/claude-sonnet-4.5'

function getAdminClient() {
  return createClient({
    baseUrl: process.env.INSFORGE_URL,
    anonKey: process.env.INSFORGE_API_KEY
  })
}

/**
 * Generate flashcards from content text or file URL.
 */
async function generateFlashcards(content, fileUrl = null) {
  const client = getAdminClient()

  const messages = fileUrl
    ? [{ role: 'user', content: [
        { type: 'text', text: buildFlashcardPrompt(content) },
        { type: 'file', file: { filename: 'document.pdf', file_data: fileUrl } }
      ]}]
    : [{ role: 'user', content: buildFlashcardPrompt(content) }]

  try {
    const completion = await client.ai.chat.completions.create({
      model: AI_MODEL, messages, temperature: 0.7, maxTokens: 4000,
      ...(fileUrl ? { fileParser: { enabled: true } } : {})
    })
    const raw = completion?.choices?.[0]?.message?.content
    if (!raw) throw new Error('AI returned empty flashcard response')
    return parseJsonResponse(raw)
  } catch (err) {
    // Any failure from file-parsing (timeout, unavailable, etc.) — fall back gracefully
    if (fileUrl) {
      if (content) {
        logger.warn('ai', `File processing failed (flashcards): ${err.message} — retrying text-only`)
        const fallback = await client.ai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: buildFlashcardPrompt(content) }],
          temperature: 0.7, maxTokens: 4000
        })
        const raw = fallback?.choices?.[0]?.message?.content
        if (!raw) throw new Error('AI returned empty flashcard response')
        return parseJsonResponse(raw)
      }
      throw new Error('File could not be processed by AI. Please add text content to the module.')
    }
    throw err
  }
}

/**
 * Generate MCQ questions from content text or file URL.
 */
async function generateMCQ(content, fileUrl = null, count = 10) {
  const client = getAdminClient()

  const messages = fileUrl
    ? [{ role: 'user', content: [
        { type: 'text', text: buildMCQPrompt(content, count) },
        { type: 'file', file: { filename: 'document.pdf', file_data: fileUrl } }
      ]}]
    : [{ role: 'user', content: buildMCQPrompt(content, count) }]

  try {
    const completion = await client.ai.chat.completions.create({
      model: AI_MODEL, messages, temperature: 0.7, maxTokens: 6000,
      ...(fileUrl ? { fileParser: { enabled: true } } : {})
    })
    const raw = completion?.choices?.[0]?.message?.content
    if (!raw) throw new Error('AI returned empty MCQ response')
    return parseJsonResponse(raw)
  } catch (err) {
    if (fileUrl) {
      if (content) {
        logger.warn('ai', `File processing failed (MCQ): ${err.message} — retrying text-only`)
        const fallback = await client.ai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: buildMCQPrompt(content, count) }],
          temperature: 0.7, maxTokens: 6000
        })
        const raw = fallback?.choices?.[0]?.message?.content
        if (!raw) throw new Error('AI returned empty MCQ response')
        return parseJsonResponse(raw)
      }
      throw new Error('File could not be processed by AI. Please add text content to the module.')
    }
    throw err
  }
}

/**
 * Summarize content into key concepts.
 */
async function summarizeContent(content, fileUrl = null) {
  const client = getAdminClient()

  const messages = fileUrl
    ? [{ role: 'user', content: [
        { type: 'text', text: 'Summarize this study material into key concepts and topics in 2-3 sentences. Return plain text, no JSON.' },
        { type: 'file', file: { filename: 'document.pdf', file_data: fileUrl } }
      ]}]
    : [{ role: 'user', content: `Summarize this study material into key concepts and topics in 2-3 sentences. Return plain text, no JSON.\n\nContent:\n${content}` }]

  try {
    const completion = await client.ai.chat.completions.create({
      model: AI_MODEL, messages, temperature: 0.5, maxTokens: 500,
      ...(fileUrl ? { fileParser: { enabled: true } } : {})
    })
    return completion?.choices?.[0]?.message?.content || ''
  } catch (err) {
    if (fileUrl && content) {
      logger.warn('ai', `File processing failed (summary): ${err.message} — retrying text-only`)
      try {
        const fallback = await client.ai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: `Summarize in 2-3 sentences:\n\n${content}` }],
          temperature: 0.5, maxTokens: 500
        })
        return fallback?.choices?.[0]?.message?.content || ''
      } catch { return '' }
    }
    // Summarize failing is non-fatal, return empty
    return ''
  }
}

// ─── Prompt builders ───────────────────────────────────────

function buildFlashcardPrompt(content) {
  return `You are an expert study assistant. Generate 15 high-quality flashcard question-and-answer pairs from the following study material.

Rules:
- Make questions clear and specific
- Answers should be concise (1-3 sentences max)
- Vary difficulty: mix easy (difficulty:1), medium (difficulty:2), and hard (difficulty:3) questions
- Focus on key concepts, definitions, facts, and relationships

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "flashcards": [
    { "question": "...", "answer": "...", "difficulty": 1 },
    { "question": "...", "answer": "...", "difficulty": 2 }
  ]
}

Study Material:
${content?.slice(0, 8000) || 'Use the provided file'}`
}

function buildMCQPrompt(content, count) {
  return `You are an expert study assistant. Generate ${count} high-quality multiple choice questions from the following study material.

Rules:
- Each question must have exactly 4 options
- Only one option is correct
- Include a brief explanation for the correct answer
- Vary difficulty: easy (1), medium (2), hard (3)
- Options must be plausible distractors

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "...",
      "difficulty": 1
    }
  ]
}

Study Material:
${content?.slice(0, 8000) || 'Use the provided file'}`
}

function parseJsonResponse(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to extract embedded JSON object from surrounding text
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`AI returned non-JSON response: ${cleaned.substring(0, 200)}`)
  }
}

export { generateFlashcards, generateMCQ, summarizeContent }
