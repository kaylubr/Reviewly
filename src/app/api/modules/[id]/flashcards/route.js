import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params
    const insforge = getAdminClient()

    const { data, error } = await insforge.database
      .from('flashcards')
      .select('*')
      .eq('module_id', id)
      .eq('user_id', user.id)
      .order('difficulty', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
