import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generateFlashcards, generateMCQ, summarizeContent } from '../controllers/aiController.js'
import { insforge } from '../config/insforge.js'
import { logger } from '../lib/logger.js'
import { extractFileContent } from '../lib/pdfExtract.js'

const router = express.Router()

// POST /api/modules/:id/generate
// AI-generates flashcards and MCQ questions for a module
router.post('/:id/generate', requireAuth, async (req, res, next) => {
  const { id } = req.params
  const userId = req.user.id
  try {
    logger.info('generate', `Start — module=${id} user=${userId}`)

    // Fetch the module (verify ownership via user context)
    const { data: module, error } = await insforge.database
      .from('modules')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !module) {
      logger.warn('generate', `Module not found — id=${id}`)
      return res.status(404).json({ error: 'Module not found' })
    }

    const content = module.content || ''
    const fileUrl = module.file_url || null
    logger.info('generate', `Module fetched — contentLen=${content.length} fileUrl=${fileUrl ? fileUrl.substring(0, 70) : 'none'}`)

    if (!content && !fileUrl) {
      logger.warn('generate', 'Module has no content or file, aborting')
      return res.status(400).json({ error: 'Module has no content to generate questions from' })
    }

    // If the module has no text content but has a file, extract text from it server-side.
    // This is more reliable than the InsForge AI file parser.
    let effectiveContent = content
    if (!content && fileUrl) {
      logger.info('generate', 'No text content — extracting from file...')
      effectiveContent = await extractFileContent(fileUrl) || ''
      if (!effectiveContent) {
        logger.warn('generate', 'File text extraction returned empty — cannot generate')
        return res.status(422).json({ error: 'Could not extract text from the uploaded file. Please paste your content as text.' })
      }
      logger.info('generate', `Extracted ${effectiveContent.length} chars from file`)
    }

    // Generate in parallel (pass null fileUrl since we already have the text)
    logger.info('generate', 'Calling AI (flashcards + MCQ + summary)...')
    const aiStart = Date.now()
    const [flashcardsResult, mcqResult, summary] = await Promise.all([
      generateFlashcards(effectiveContent, null),
      generateMCQ(effectiveContent, null, 15),
      summarizeContent(effectiveContent, null)
    ])
    logger.info('generate', `AI done in ${Date.now() - aiStart}ms — flashcards=${flashcardsResult?.flashcards?.length} mcq=${mcqResult?.questions?.length}`)

    // Delete existing generated content for this module
    logger.debug('generate', 'Deleting old flashcards and MCQ...')
    await Promise.all([
      insforge.database.from('flashcards').delete().eq('module_id', id),
      insforge.database.from('mcq_questions').delete().eq('module_id', id)
    ])

    // Insert flashcards
    const flashcardsToInsert = (flashcardsResult.flashcards || []).map(fc => ({
      module_id: id,
      user_id: userId,
      question: fc.question,
      answer: fc.answer,
      difficulty: fc.difficulty || 1
    }))

    // Insert MCQ questions
    const mcqToInsert = (mcqResult.questions || []).map(q => ({
      module_id: id,
      user_id: userId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 1
    }))

    logger.debug('generate', `Inserting ${flashcardsToInsert.length} flashcards and ${mcqToInsert.length} MCQ questions...`)
    const [fcInsert, mcqInsert] = await Promise.all([
      flashcardsToInsert.length > 0
        ? insforge.database.from('flashcards').insert(flashcardsToInsert).select()
        : { data: [] },
      mcqToInsert.length > 0
        ? insforge.database.from('mcq_questions').insert(mcqToInsert).select()
        : { data: [] }
    ])

    // Mark module as processed + update description/summary
    await insforge.database
      .from('modules')
      .update({ ai_processed: true, description: summary, updated_at: new Date().toISOString() })
      .eq('id', id)

    logger.info('generate', `Done — inserted ${(fcInsert.data || []).length} flashcards, ${(mcqInsert.data || []).length} MCQ`)
    res.json({
      flashcards_count: (fcInsert.data || []).length,
      mcq_count: (mcqInsert.data || []).length,
      summary
    })
  } catch (err) {
    if (err.message?.includes('File could not be processed')) {
      logger.warn('generate', `File processing failed for module=${id}: ${err.message}`)
      return res.status(422).json({ error: err.message })
    }
    logger.error('generate', `Unhandled error for module=${id}`, err)
    next(err)
  }
})

// GET /api/modules/:id/flashcards
router.get('/:id/flashcards', requireAuth, async (req, res, next) => {
  try {
    logger.debug('flashcards', `Fetching flashcards for module=${req.params.id}`)
    const { data, error } = await insforge.database
      .from('flashcards')
      .select('*')
      .eq('module_id', req.params.id)
      .eq('user_id', req.user.id)
      .order('difficulty', { ascending: true })

    if (error) throw error
    logger.debug('flashcards', `Returned ${(data || []).length} flashcards`)
    res.json(data || [])
  } catch (err) {
    logger.error('flashcards', `Error fetching flashcards for module=${req.params.id}`, err)
    next(err)
  }
})

// GET /api/modules/:id/mcq
router.get('/:id/mcq', requireAuth, async (req, res, next) => {
  try {
    const { count = 10 } = req.query
    logger.debug('mcq', `Fetching MCQ for module=${req.params.id} count=${count}`)
    const { data, error } = await insforge.database
      .from('mcq_questions')
      .select('*')
      .eq('module_id', req.params.id)
      .eq('user_id', req.user.id)
      .limit(parseInt(count))

    if (error) throw error

    // Shuffle
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    logger.debug('mcq', `Returned ${shuffled.length} MCQ questions`)
    res.json(shuffled)
  } catch (err) {
    logger.error('mcq', `Error fetching MCQ for module=${req.params.id}`, err)
    next(err)
  }
})

// GET /api/modules/:id/speed
// Returns mix of flashcards and MCQ for speed round
router.get('/:id/speed', requireAuth, async (req, res, next) => {
  try {
    logger.debug('speed', `Fetching speed questions for module=${req.params.id}`)
    const { data: mcq, error: e1 } = await insforge.database
      .from('mcq_questions')
      .select('*')
      .eq('module_id', req.params.id)
      .eq('user_id', req.user.id)
      .limit(15)

    if (e1) throw e1

    const questions = (mcq || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(q => ({ ...q, type: 'mcq' }))

    logger.debug('speed', `Returned ${questions.length} speed questions`)
    res.json(questions)
  } catch (err) {
    logger.error('speed', `Error fetching speed questions for module=${req.params.id}`, err)
    next(err)
  }
})

export default router

