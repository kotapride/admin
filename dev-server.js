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
app.use(express.json());

// Serverless API bridge for local development
app.all('/api/login', (req, res) => {
  return loginHandler(req, res);
});

app.all('/api/records', (req, res) => {
  return recordsHandler(req, res);
});

app.all('/api/records/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return recordIdHandler(req, res);
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
