import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const insforge = getAdminClient()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const { data, error } = await insforge.database
      .from('daily_xp')
      .select('date, xp_earned, sessions_count')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const found = (data || []).find(r => r.date === dateStr)
      result.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        xp_earned: found?.xp_earned || 0,
        sessions_count: found?.sessions_count || 0
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
