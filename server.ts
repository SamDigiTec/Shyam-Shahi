import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { initSchema } from './database/db.ts';
import { seedDatabaseIfEmpty } from './database/seed.ts';
import { createApiRouter } from './server/routes.ts';

// Initialize SQLite schema & seed initial portfolio CMS records
initSchema();
seedDatabaseIfEmpty();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded media assets & generated studio images with CDN-friendly cache headers
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(
  '/uploads',
  express.static(uploadsDir, {
    maxAge: '7d',
    immutable: false,
  })
);
app.use(
  '/src/assets/images',
  express.static(path.resolve(process.cwd(), 'src', 'assets', 'images'), {
    maxAge: '30d',
    immutable: true,
  })
);

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// Mount API routes & sitemap
const apiRouter = createApiRouter();
app.use('/api', apiRouter);
app.get('/sitemap.xml', (req, res, next) => {
  req.url = '/sitemap.xml';
  apiRouter(req, res, next);
});

async function startServer(): Promise<void> {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distDir, {
        maxAge: '1y',
        index: false,
      })
    );
    app.get('*', (req, res) => {
      if (req.path.startsWith('/admin')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shyam Shahi Portfolio CMS running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
