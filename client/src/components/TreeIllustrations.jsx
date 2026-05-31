/**
 * Flat / semi-flat SVG tree illustrations — Stages 1-12
 * Foliage:      #b9ff66 (lime)
 * Deep foliage: #88cc00
 * Trunk:        #1a0800
 * All transparent backgrounds — the arena bg shows through.
 * ViewBox: 0 0 300 300. Pass width/height to scale.
 */

/* ── Stage 1 (Lv 1-4): Tiny Sprout ─────────────────────────── */
export function TreeStage1({ width = 220, height = 220 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <path d="M150 275 C150 258 149 230 150 185" stroke="#1a0800" strokeWidth="5" strokeLinecap="round"/>
      {/* Left leaf */}
      <path d="M150 215 C143 205 120 200 111 212 C104 224 128 229 144 220 Q149 216 150 215 Z" fill="#b9ff66"/>
      {/* Right leaf */}
      <path d="M150 215 C157 205 180 200 189 212 C196 224 172 229 156 220 Q151 216 150 215 Z" fill="#b9ff66"/>
      {/* Bud */}
      <ellipse cx="150" cy="181" rx="7" ry="9" fill="#b9ff66"/>
    </svg>
  )
}

// Placeholder aliases for stages 2..12. These can be replaced with
// distinct SVGs later. For now they reuse the Stage1 illustration
// to avoid runtime import errors.
export const TreeStage2 = TreeStage1
export const TreeStage3 = TreeStage1
export const TreeStage4 = TreeStage1
export const TreeStage5 = TreeStage1
export const TreeStage6 = TreeStage1
export const TreeStage7 = TreeStage1
export const TreeStage8 = TreeStage1
export const TreeStage9 = TreeStage1
export const TreeStage10 = TreeStage1
export const TreeStage11 = TreeStage1
export const TreeStage12 = TreeStage1
