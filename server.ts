import express from 'express';
import path from 'path';
import apiApp from './api/index.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Mount API routes. On Vercel this module is used as a serverless handler.
app.use(apiApp);

async function configureDevelopmentServer() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') return;
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

async function configureProductionStaticServer() {
  if (process.env.VERCEL || process.env.NODE_ENV !== 'production') return;
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const ready = (async () => {
  await configureDevelopmentServer();
  await configureProductionStaticServer();
  return app;
})();

if (!process.env.VERCEL) {
  ready.then((server) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

export default async function handler(req: any, res: any) {
  try {
    const server = await ready;
    return server(req, res);
  } catch (error) {
    console.error('Request handler initialization failed:', error);
    res.statusCode = 500;
    return res.end('Server initialization failed');
  }
}
