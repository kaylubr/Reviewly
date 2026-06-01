import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params
    const insforge = getAdminClient()

    const { data: mcq, error } = await insforge.database
      .from('mcq_questions')
      .select('*')
      .eq('module_id', id)
      .eq('user_id', user.id)
      .limit(15)

    if (error) throw error

    const questions = (mcq || [])
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(q => ({ ...q, type: 'mcq' }))

    return NextResponse.json(questions)
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
