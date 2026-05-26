import express from 'express';
// If you use Neon DB, uncomment the next line
// import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'nodejs',
};

const app = express();
app.use(express.json());

// ✅ FIX: Use '/*' instead of '*' here!
// This catches all routes without crashing Vercel
app.get('/*', async (req, res) => {
  try {
    // --- YOUR LOGIC STARTS HERE ---
    
    // Example: Simple response to test if it works
    res.status(200).json({ 
      message: "API is working!", 
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // If you have database logic, put it here:
    // const sql = neon(process.env.DATABASE_URL);
    // const result = await sql`SELECT version()`;
    // res.json({ dbVersion: result[0].version });

    // --- YOUR LOGIC ENDS HERE ---
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default app;
