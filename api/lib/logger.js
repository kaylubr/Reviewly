// Structured console logger with timestamps and ANSI color codes.
// Usage: logger.info('tag', 'message', optionalData)

const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'
const COLORS = {
  info:  '\x1b[36m',  // cyan
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[90m',  // grey
}

function log(level, tag, message, extra) {
  const ts    = new Date().toISOString()
  const color = COLORS[level] ?? ''
  const label = `${color}${BOLD}[${level.toUpperCase().padEnd(5)}]${RESET}`
  const time  = `${DIM}${ts}${RESET}`
  const scope = `${color}[${tag}]${RESET}`

  if (extra !== undefined) {
    const extraStr = extra instanceof Error
      ? `${extra.message}\n${extra.stack}`
      : typeof extra === 'object'
        ? JSON.stringify(extra)
        : String(extra)
    console.log(`${time} ${label} ${scope}`, message, extraStr)
  } else {
    console.log(`${time} ${label} ${scope}`, message)
  }
}

export const logger = {
  info:  (tag, message, extra) => log('info',  tag, message, extra),
  warn:  (tag, message, extra) => log('warn',  tag, message, extra),
  error: (tag, message, extra) => log('error', tag, message, extra),
  debug: (tag, message, extra) => log('debug', tag, message, extra),
}
