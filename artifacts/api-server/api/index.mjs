// Fixed for Express 5 + Vercel Serverless
import express from 'express';

export const config = {
  runtime: 'nodejs',
};

const app = express();
app.use(express.json());

// ⚠️ IMPORTANT: In Express 5, use '*' without slash for catch-all
// DO NOT use '/*' or '/:param*' — they break in Express 5!
app.get('*', async (req, res) => {
  try {
    res.status(200).json({ 
      message: "✅ API is working!", 
      path: req.path 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default app;
