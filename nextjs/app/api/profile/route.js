import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const insforge = getAdminClient()

    const { data, error } = await insforge.database
      .from('profiles').select('*').eq('id', user.id).maybeSingle()

    if (error) throw error

    if (!data) {
      const { data: created, error: cErr } = await insforge.database
        .from('profiles')
        .insert([{
          id: user.id,
          username: user.name || user.email?.split('@')[0] || 'Learner',
          avatar_url: user.avatar_url || null
        }])
        .select().single()
      if (cErr) throw cErr
      return NextResponse.json(created)
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
