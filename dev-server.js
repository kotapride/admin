import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import loginHandler from './api/login.js';
import recordsHandler from './api/records.js';
import recordIdHandler from './api/records/[id].js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serverless API bridge for local development with hot-reloading
app.all('/api/login', async (req, res) => {
  try {
    const { default: handler } = await import(`./api/login.js?t=${Date.now()}`);
    return handler(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.all('/api/records', async (req, res) => {
  try {
    const { default: handler } = await import(`./api/records.js?t=${Date.now()}`);
    return handler(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.all('/api/records/:id', async (req, res) => {
  try {
    req.query = { ...req.query, id: req.params.id };
    const { default: handler } = await import(`./api/records/[id].js?t=${Date.now()}`);
    return handler(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🛡️ APP 2 (admin-panel) running at: http://localhost:${PORT}`);
    console.log(`  🔗 Serverless API routes:`);
    console.log(`     - POST   http://localhost:${PORT}/api/login`);
    console.log(`     - GET    http://localhost:${PORT}/api/records`);
    console.log(`     - GET/PATCH/DELETE http://localhost:${PORT}/api/records/:id`);
    console.log(`======================================================\n`);
  });
}

startServer();
