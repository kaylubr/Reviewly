import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { insforge } from '../config/insforge.js'
import { logger } from '../lib/logger.js'

const router = express.Router()

// GET /api/profile
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      // Auto-create profile if missing
      const { data: created, error: cErr } = await insforge.database
        .from('profiles')
        .insert([{
          id: req.user.id,
          username: req.user.name || req.user.email?.split('@')[0] || 'Learner',
          avatar_url: req.user.avatar_url || null
        }])
        .select()
        .single()
      if (cErr) throw cErr
      return res.json(created)
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
})

// GET /api/profile/weekly-xp
router.get('/weekly-xp', requireAuth, async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const { data, error } = await insforge.database
      .from('daily_xp')
      .select('date, xp_earned, sessions_count')
      .eq('user_id', req.user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    // Fill in missing days
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

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/profile/achievements
router.get('/achievements', requireAuth, async (req, res, next) => {
  try {
    const [allRes, earnedRes] = await Promise.all([
      insforge.database.from('achievements').select('*').order('xp_reward', { ascending: true }),
      insforge.database.from('user_achievements').select('*, achievements(*)').eq('user_id', req.user.id)
    ])

    if (allRes.error) throw allRes.error
    if (earnedRes.error) throw earnedRes.error

    const earnedIds = new Set((earnedRes.data || []).map(e => e.achievement_id))

    res.json({
      all: allRes.data || [],
      earned: earnedRes.data || [],
      earned_ids: [...earnedIds]
    })
  } catch (err) {
    next(err)
  }
})

export default router
