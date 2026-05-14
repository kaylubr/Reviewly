import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { logger } from './lib/logger.js'
import modulesRouter from './routes/modules.js'
import sessionsRouter from './routes/sessions.js'
import profileRouter from './routes/profile.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

// HTTP request logger — logs: METHOD /path STATUS response-time ms - bytes
app.use(morgan(':method :url :status :res[content-length]B :response-time ms'))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/modules', modulesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/profile', profileRouter)

app.use((err, req, res, next) => {
  logger.error('express', `${req.method} ${req.path} → ${err.message}`, err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export default app
