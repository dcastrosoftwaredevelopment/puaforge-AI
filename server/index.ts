import path from 'path';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { generateRoute } from './routes/generate.js';
import { modelsRoute } from './routes/models.js';
import { publishRoute } from './routes/publish.js';
import { settingsRoute } from './routes/settings.js';
import { authRoute } from './routes/auth.js';
import { userSettingsRoute } from './routes/userSettings.js';
import { profileRoute } from './routes/profile.js';
import { projectsRoute } from './routes/projects.js';
import { usageRoute } from './routes/usage.js';
import adminRouter from './routes/admin.js';
import teamsRouter from './routes/teams.js';
import { runMigrations } from './db.js';
import { initEmailQueue } from './services/emailQueue.js';
import { siteServingMiddleware } from './middleware/siteServing.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

// Serve published sites on custom domains — must be before /api routes
app.use(siteServingMiddleware);

app.use('/api', authRoute);
app.use('/api', userSettingsRoute);
app.use('/api', profileRoute);
app.use('/api', projectsRoute);
app.use('/api', generateRoute);
app.use('/api', modelsRoute);
app.use('/api', publishRoute);
app.use('/api', settingsRoute);
app.use('/api', usageRoute);
app.use('/api/admin', adminRouter);
app.use('/api/teams', teamsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve('/app/dist');
  const indexHtml = path.join(distPath, 'index.html');
  app.use(express.static(distPath, { index: false }));
  app.use((_req, res) => {
    res.sendFile(indexHtml);
  });
}

// Global JSON error handler — must be registered after all routes
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[server error]', err);
  res.status(500).json({ error: message });
});

runMigrations()
  .then(async () => {
    await initEmailQueue();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('Failed to run migrations:', err);
    process.exit(1);
  });
