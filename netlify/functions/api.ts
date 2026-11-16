import express from 'express';
import cookieParser from 'cookie-parser';
import { initSchema } from '../../database/db.ts';
import { seedDatabaseIfEmpty } from '../../database/seed.ts';
import { createApiRouter } from '../../server/routes.ts';

// Netlify Functions wrapper for Express API routes
let initialized = false;
function ensureDb() {
  if (!initialized) {
    initSchema();
    seedDatabaseIfEmpty();
    initialized = true;
  }
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use((_req, _res, next) => {
  ensureDb();
  next();
});
app.use('/.netlify/functions/api', createApiRouter());
app.use('/api', createApiRouter());

export const handler = async (event: {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
}) => {
  ensureDb();
  const query = event.queryStringParameters
    ? '?' + new URLSearchParams(event.queryStringParameters).toString()
    : '';
  const targetUrl = `${event.path}${query}`;

  return new Promise((resolve) => {
    const req = Object.assign(Object.create(null), {
      method: event.httpMethod,
      url: targetUrl,
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : {},
      cookies: {},
    });

    const headers: Record<string, string> = {};
    let statusCode = 200;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      setHeader(k: string, v: string) {
        headers[k] = v;
      },
      cookie() {
        return this;
      },
      clearCookie() {
        return this;
      },
      json(payload: unknown) {
        headers['Content-Type'] = 'application/json';
        resolve({ statusCode, headers, body: JSON.stringify(payload) });
      },
      send(payload: string) {
        resolve({ statusCode, headers, body: String(payload) });
      },
    };

    app(req as never, res as never);
  });
};
