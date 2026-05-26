import express from 'express';

export const config = {
  runtime: 'nodejs',
};

const app = express();
app.use(express.json());

// This line catches ALL requests safely
app.get('/*', async (req, res) => {
  try {
    // Just send back a success message for testing
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
