import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getDbStatus,
  getAllQuotations,
  getQuotationById,
  saveOrUpdateQuotation,
  deleteQuotationById,
  getNextSequentialRef,
  getAllUsers,
  saveAllUsers,
  syncQuotations,
} from './server/database';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Initialize database connection (MongoDB with fallback to local JSON database)
  await initDatabase();

  // -------------------------------------------------------------
  // API Routes (Must be mounted BEFORE Vite middleware)
  // -------------------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/db-status', async (req, res) => {
    try {
      const status = await getDbStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get DB status' });
    }
  });

  app.post('/api/db/reconnect', async (req, res) => {
    try {
      const status = await initDatabase();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reconnect database' });
    }
  });

  // Get all quotations
  app.get('/api/quotations', async (req, res) => {
    try {
      const quotations = await getAllQuotations();
      res.json(quotations);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch quotations' });
    }
  });

  // Get next sequential reference number atomically
  app.post('/api/quotations/next-ref', async (req, res) => {
    try {
      const dateStr = req.body?.date;
      const date = dateStr ? new Date(dateStr) : new Date();
      const result = await getNextSequentialRef(date);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate next ref' });
    }
  });

  // Get quotation by ID
  app.get('/api/quotations/:id', async (req, res) => {
    try {
      const quotation = await getQuotationById(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: 'Quotation not found' });
      }
      res.json(quotation);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get quotation' });
    }
  });

  // Save or update a quotation
  app.post('/api/quotations', async (req, res) => {
    try {
      const quote = req.body;
      if (!quote || !quote.id) {
        return res.status(400).json({ error: 'Invalid quotation payload' });
      }
      const saved = await saveOrUpdateQuotation(quote);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save quotation' });
    }
  });

  // Delete a quotation
  app.delete('/api/quotations/:id', async (req, res) => {
    try {
      const success = await deleteQuotationById(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete quotation' });
    }
  });

  // Sync / bulk import quotations from client (for migration)
  app.post('/api/quotations/sync', async (req, res) => {
    try {
      const { quotations } = req.body;
      if (!Array.isArray(quotations)) {
        return res.status(400).json({ error: 'Expected quotations array' });
      }
      const result = await syncQuotations(quotations);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync quotations' });
    }
  });

  // Get users
  app.get('/api/users', async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
  });

  // Save users
  app.post('/api/users', async (req, res) => {
    try {
      const users = req.body;
      if (!Array.isArray(users)) {
        return res.status(400).json({ error: 'Expected users array' });
      }
      const saved = await saveAllUsers(users);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save users' });
    }
  });

  // -------------------------------------------------------------
  // Vite Middleware / Static Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Interglass Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
