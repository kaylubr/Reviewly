import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const insforge = getAdminClient()
    const { searchParams } = new URL(request.url)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : null

    let query = insforge.database
      .from('sessions')
      .select('*, modules(title)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (limit !== null) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
