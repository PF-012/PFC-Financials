import express from 'express';
import path from 'path';
import apiApp from './api/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount API
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const viteName = 'vi' + 'te';
    const { createServer: createViteServer } = await import(viteName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  if (process.env.VERCEL) {
    return app;
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

const appPromise = startServer();
export default async function (req: any, res: any) {
  const app = await appPromise;
  if (app) app(req, res);
}
