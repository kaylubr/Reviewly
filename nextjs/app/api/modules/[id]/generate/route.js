import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'
import { generateFlashcards, generateMCQ, summarizeContent } from '@/lib/ai'
import { extractFileContent } from '@/lib/pdfExtract'

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params
    const insforge = getAdminClient()

    const { data: module, error } = await insforge.database
      .from('modules')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const content = module.content || ''
    const fileUrl = module.file_url || null

    if (!content && !fileUrl) {
      return NextResponse.json({ error: 'Module has no content to generate questions from' }, { status: 400 })
    }

    let effectiveContent = content
    if (!content && fileUrl) {
      effectiveContent = await extractFileContent(fileUrl) || ''
      if (!effectiveContent) {
        return NextResponse.json({ error: 'Could not extract text from the uploaded file. Please paste your content as text.' }, { status: 422 })
      }
    }

    const [flashcardsResult, mcqResult, summary] = await Promise.all([
      generateFlashcards(effectiveContent, null),
      generateMCQ(effectiveContent, null, 15),
      summarizeContent(effectiveContent, null)
    ])

    await Promise.all([
      insforge.database.from('flashcards').delete().eq('module_id', id),
      insforge.database.from('mcq_questions').delete().eq('module_id', id)
    ])

    const flashcardsToInsert = (flashcardsResult.flashcards || []).map(fc => ({
      module_id: id, user_id: user.id,
      question: fc.question, answer: fc.answer, difficulty: fc.difficulty || 1
    }))

    const mcqToInsert = (mcqResult.questions || []).map(q => ({
      module_id: id, user_id: user.id,
      question: q.question, options: q.options,
      correct_index: q.correct_index, explanation: q.explanation || '',
      difficulty: q.difficulty || 1
    }))

    const [fcInsert, mcqInsert] = await Promise.all([
      flashcardsToInsert.length > 0
        ? insforge.database.from('flashcards').insert(flashcardsToInsert).select()
        : { data: [] },
      mcqToInsert.length > 0
        ? insforge.database.from('mcq_questions').insert(mcqToInsert).select()
        : { data: [] }
    ])

    await insforge.database
      .from('modules')
      .update({ ai_processed: true, description: summary, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({
      flashcards_count: (fcInsert.data || []).length,
      mcq_count: (mcqInsert.data || []).length,
      summary
    })
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message?.includes('File could not be processed')) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
