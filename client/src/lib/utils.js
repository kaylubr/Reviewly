export const LEVEL_XP_BASE = 100

/**
 * XP required to advance FROM `level` to `level + 1`.
 * Quadratic curve — each level costs progressively more.
 *   Level  1 →  2 :    110 XP
 *   Level  5 →  6 :    750 XP
 *   Level 10 → 11 :  2,000 XP
 *   Level 20 → 21 :  6,000 XP
 *   Level 50 → 51 : 30,000 XP
 *   Level 99 → 100: 107,910 XP
 */
export function xpForNextLevel(level) {
  return Math.floor(LEVEL_XP_BASE * (level + level * level * 0.1))
}

export function calcLevel(xp) {
  let level = 1
  let remaining = Math.max(0, xp)

  while (level < 100) {
    const needed = xpForNextLevel(level)
    if (remaining < needed) break
    remaining -= needed
    level++
  }

  // At level 100, clamp — no more levelling
  if (level >= 100) {
    return {
      level: 100,
      currentLevelXp: 0,
      nextLevelXp: xpForNextLevel(99),
      progress: 1,
    }
  }

  const nextLevelXp = xpForNextLevel(level)
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp,
    progress: remaining / nextLevelXp,
  }
}

export function getTreeStage(level) {
  if (level >= 100) return { stage: 12, name: 'Maxed', emoji: '' }
  if (level >= 85)  return { stage: 11, name: 'Cosmic Tree', emoji: '' }
  if (level >= 75)  return { stage: 10, name: 'Legendary Tree', emoji: '' }
  if (level >= 60)  return { stage: 9,  name: 'Mythic Tree', emoji: '' }
  if (level >= 50)  return { stage: 8,  name: 'Giant Tree', emoji: '' }
  if (level >= 40)  return { stage: 7,  name: 'Elder Tree', emoji: '' }
  if (level >= 30)  return { stage: 6,  name: 'Ancient Tree', emoji: '' }
  if (level >= 20)  return { stage: 5,  name: 'Majestic Tree', emoji: '' }
  if (level >= 15)  return { stage: 4,  name: 'Blooming Tree', emoji: '' }
  if (level >= 10)  return { stage: 3,  name: 'Leafy Tree', emoji: '' }
  if (level >= 5)   return { stage: 2,  name: 'Young Tree', emoji: '' }
  return              { stage: 1,  name: 'Tiny Sapling', emoji: '' }
}

export function xpForMode(mode) {
  return { flashcard: 10, mcq: 15, speed: 20 }[mode] || 10
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
