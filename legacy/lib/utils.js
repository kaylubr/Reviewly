export const LEVEL_XP_BASE = 100

export function calcLevel(xp) {
  let level = 1
  let remaining = xp
  while (remaining >= level * LEVEL_XP_BASE) {
    remaining -= level * LEVEL_XP_BASE
    level++
  }
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: level * LEVEL_XP_BASE,
    progress: remaining / (level * LEVEL_XP_BASE)
  }
}

export function getTreeStage(level) {
  if (level >= 20) return { stage: 5, name: 'Mystical Tree', emoji: '🌳✨' }
  if (level >= 15) return { stage: 4, name: 'Blooming Tree', emoji: '🌸🌳' }
  if (level >= 10) return { stage: 3, name: 'Leafy Tree', emoji: '🌿🌳' }
  if (level >= 5)  return { stage: 2, name: 'Young Tree', emoji: '🌱🌳' }
  return { stage: 1, name: 'Tiny Sapling', emoji: '🌱' }
}

export function xpForMode(mode) {
  return { flashcard: 10, mcq: 15, speed: 20 }[mode] || 10
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
