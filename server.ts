import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RuleManager } from './src/rate-limiter.js'; // Note .js extension is sometimes needed, or just standard for ESM

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const manager = new RuleManager();

  // --- API Routes ---
  app.get('/api/rules', (req, res) => {
    res.json(manager.getRules());
  });

  app.post('/api/rules', (req, res) => {
    const rule = manager.setRule(req.body);
    res.json(rule);
  });

  app.delete('/api/rules/:id', (req, res) => {
    manager.deleteRule(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/request', (req, res) => {
    const { clientId, endpoint } = req.body;
    
    if (!clientId || !endpoint) {
      return res.status(400).json({ error: 'Missing clientId or endpoint' });
    }

    const result = manager.processRequest(clientId, endpoint);
    
    // Always attach simulated headers
    res.setHeader('X-RateLimit-Algorithm', result.log.algorithmUsed);
    res.setHeader('X-RateLimit-RuleId', result.log.ruleId);
    res.setHeader('X-Time-Of-Flight', Math.floor(Math.random() * 10) + 'ms');

    if (!result.accepted) {
      return res.status(429).json(result);
    }
    return res.json(result);
  });

  app.get('/api/logs', (req, res) => {
    res.json(manager.getLogs());
  });

  app.get('/api/stats', (req, res) => {
    res.json(manager.getStats());
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // --- Static Serving for Production ---
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Limitless Server running on port ${PORT}`);
  });
}

startServer();
