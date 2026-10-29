import type { NextFunction, Request, Response } from 'express';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://harved.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

export function createHarvedCorsMiddleware(configuredOrigins = process.env.HARVED_ALLOWED_ORIGINS) {
  const allowedOrigins = new Set(
    (configuredOrigins || DEFAULT_ALLOWED_ORIGINS.join(','))
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  );

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.header('origin');
    if (origin) {
      if (!allowedOrigins.has(origin)) {
        res.status(403).json({ error: 'This origin is not allowed.' });
        return;
      }

      res.vary('Origin');
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.status(204).end();
      return;
    }

    next();
  };
}
