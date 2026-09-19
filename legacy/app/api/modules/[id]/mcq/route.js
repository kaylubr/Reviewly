import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params
    const insforge = getAdminClient()
    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '10')

    const { data, error } = await insforge.database
      .from('mcq_questions')
      .select('*')
      .eq('module_id', id)
      .eq('user_id', user.id)
      .limit(count)

    if (error) throw error
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    return NextResponse.json(shuffled)
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
