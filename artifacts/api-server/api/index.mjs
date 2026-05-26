import express from 'express';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export const config = {
  runtime: 'nodejs18.x',
};

const app = express();
app.use(express.json());

// ✅ FIXED: Use /* instead of *
app.get('/*', async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.json({ message: 'API is working!', dbVersion: result[0].version });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
