import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

const XP_PER_CORRECT = { flashcard: 10, mcq: 15, speed: 20 }
const LEVEL_XP_BASE = 100
const DAILY_XP_CAP_SESSION = 5

function calcLevel(xp) {
  let level = 1
  let remaining = xp
  while (remaining >= level * LEVEL_XP_BASE) {
    remaining -= level * LEVEL_XP_BASE
    level++
  }
  return { level, currentLevelXp: remaining, nextLevelXp: level * LEVEL_XP_BASE }
}

function getXpMultiplier(sessionsCountToday) {
  const multipliers = [1.0, 0.8, 0.6, 0.4, 0.2]
  return sessionsCountToday >= 1 && sessionsCountToday <= DAILY_XP_CAP_SESSION
    ? multipliers[sessionsCountToday - 1]
    : 0
}

function getPreviousDay(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request)
    const insforge = getAdminClient()
    const { module_id, mode, correct_answers, total_questions, duration_seconds } = await request.json()

    if (!module_id || !mode || total_questions === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = user.id
    const baseXp = XP_PER_CORRECT[mode] || 10
    const score = total_questions > 0 ? Math.round((correct_answers / total_questions) * 100) : 0

    const today = new Date().toISOString().split('T')[0]
    const { data: todaysSessions } = await insforge.database
      .from('sessions').select('id').eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`).lt('completed_at', `${today}T23:59:59`)

    const sessionsCountToday = todaysSessions?.length || 0
    const currentSessionNumber = sessionsCountToday + 1
    const xpMultiplier = getXpMultiplier(currentSessionNumber)

    let xpEarned = correct_answers * baseXp
    if (score === 100) xpEarned += 50
    if (mode === 'speed' && duration_seconds < 60) xpEarned += 25
    xpEarned = Math.floor(xpEarned * xpMultiplier)

    const { data: session, error: sErr } = await insforge.database
      .from('sessions')
      .insert([{ user_id: userId, module_id, mode, score, total_questions, correct_answers, duration_seconds: duration_seconds || 0, xp_earned: xpEarned }])
      .select().single()

    if (sErr) throw sErr

    const { data: profile, error: pErr } = await insforge.database
      .from('profiles')
      .select('xp, level, streak, last_active, total_sessions, total_study_time_minutes')
      .eq('id', userId).maybeSingle()

    if (pErr) throw pErr

    const lastActive = profile?.last_active
    const isNewDay = lastActive !== today
    const isConsecutive = lastActive === getPreviousDay(today)
    const newStreak = isNewDay ? (isConsecutive ? (profile?.streak || 0) + 1 : 1) : (profile?.streak || 1)
    const newXp = (profile?.xp || 0) + xpEarned
    const { level: newLevel } = calcLevel(newXp)
    const leveledUp = newLevel > (profile?.level || 1)

    await insforge.database.from('profiles').update({
      xp: newXp, level: newLevel, streak: newStreak, last_active: today,
      total_sessions: (profile?.total_sessions || 0) + 1,
      total_study_time_minutes: (profile?.total_study_time_minutes || 0) + Math.floor((duration_seconds || 0) / 60)
    }).eq('id', userId)

    const { data: modSessions } = await insforge.database
      .from('sessions').select('score').eq('module_id', module_id).eq('user_id', userId)

    const avgMastery = modSessions?.length
      ? Math.round(modSessions.reduce((s, r) => s + r.score, 0) / modSessions.length) : score

    await insforge.database.from('modules')
      .update({ total_sessions: (modSessions?.length || 1), mastery_score: avgMastery })
      .eq('id', module_id).eq('user_id', userId)

    const { data: dailyXp } = await insforge.database
      .from('daily_xp').select('xp_earned, sessions_count')
      .eq('user_id', userId).eq('date', today).maybeSingle()

    if (dailyXp) {
      await insforge.database.from('daily_xp')
        .update({ xp_earned: dailyXp.xp_earned + xpEarned, sessions_count: dailyXp.sessions_count + 1 })
        .eq('user_id', userId).eq('date', today)
    } else {
      await insforge.database.from('daily_xp')
        .insert([{ user_id: userId, date: today, xp_earned: xpEarned, sessions_count: 1 }])
    }

    const newAchievements = await checkAndAwardAchievements(insforge, userId, {
      newStreak, newLevel, totalSessions: (profile?.total_sessions || 0) + 1, score, mode, duration_seconds
    })

    return NextResponse.json({
      xp_earned: xpEarned, new_xp: newXp, new_level: newLevel,
      leveled_up: leveledUp, new_streak: newStreak, score,
      new_achievements: newAchievements, session_id: session.id
    })
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[sessions/complete]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkAndAwardAchievements(insforge, userId, stats) {
  const { newStreak, newLevel, totalSessions, score, mode, duration_seconds } = stats
  const candidates = []
  if (totalSessions === 1) candidates.push('first_session')
  if (newStreak >= 3) candidates.push('streak_3')
  if (newStreak >= 7) candidates.push('streak_7')
  if (newStreak >= 30) candidates.push('streak_30')
  if (newLevel >= 5) candidates.push('level_5')
  if (newLevel >= 10) candidates.push('level_10')
  if (newLevel >= 20) candidates.push('level_20')
  if (score === 100) candidates.push('perfect_score')
  if (mode === 'speed' && duration_seconds < 60) candidates.push('speed_demon')
  if (totalSessions >= 10) candidates.push('sessions_10')
  if (totalSessions >= 50) candidates.push('sessions_50')

  if (candidates.length === 0) return []

  const { data: earned } = await insforge.database
    .from('user_achievements').select('achievement_id').eq('user_id', userId).in('achievement_id', candidates)

  const earnedIds = new Set((earned || []).map(e => e.achievement_id))
  const newOnes = candidates.filter(id => !earnedIds.has(id))
  if (newOnes.length === 0) return []

  await insforge.database.from('user_achievements')
    .insert(newOnes.map(id => ({ user_id: userId, achievement_id: id })))

  const { data: details } = await insforge.database.from('achievements').select('*').in('id', newOnes)

  const bonusXp = (details || []).reduce((s, a) => s + (a.xp_reward || 0), 0)
  if (bonusXp > 0) {
    const { data: profile } = await insforge.database.from('profiles').select('xp').eq('id', userId).maybeSingle()
    await insforge.database.from('profiles').update({ xp: (profile?.xp || 0) + bonusXp }).eq('id', userId)
  }

  return details || []
}
