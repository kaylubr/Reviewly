import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const insforge = getAdminClient()

    const [allRes, earnedRes] = await Promise.all([
      insforge.database.from('achievements').select('*').order('xp_reward', { ascending: true }),
      insforge.database.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id)
    ])

    if (allRes.error) throw allRes.error
    if (earnedRes.error) throw earnedRes.error

    const earnedIds = new Set((earnedRes.data || []).map(e => e.achievement_id))

    return NextResponse.json({
      all: allRes.data || [],
      earned: earnedRes.data || [],
      earned_ids: [...earnedIds]
    })
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
