import path from 'path'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { generateRoute } from './routes/generate.js'
import { modelsRoute } from './routes/models.js'
import { publishRoute } from './routes/publish.js'
import { settingsRoute } from './routes/settings.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))

app.use('/api', generateRoute)
app.use('/api', modelsRoute)
app.use('/api', publishRoute)
app.use('/api', settingsRoute)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve('/app/dist')
  const indexHtml = path.join(distPath, 'index.html')
  app.use(express.static(distPath, { index: false }))
  app.use((_req, res) => {
    res.sendFile(indexHtml)
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('API key: configured via frontend Settings (X-API-Key header)')
})
