import path from 'path'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { generateRoute } from './routes/generate.js'

const envPath = path.resolve(process.cwd(), '.env')
console.log('[server] Loading .env from:', envPath)
const result = dotenv.config({ path: envPath })
if (result.error) {
  console.error('[server] Failed to load .env:', result.error.message)
} else {
  console.log('[server] .env loaded, keys:', Object.keys(result.parsed || {}))
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

app.use('/api', generateRoute)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  const hasKey = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`AI provider: ${hasKey ? (process.env.ANTHROPIC_API_KEY ? 'Anthropic' : 'OpenAI') : 'none (using placeholder)'}`)
})
