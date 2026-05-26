// This is the fixed code for your Vercel API
import express from 'express';

// Tell Vercel how to run this
export const config = {
  runtime: 'nodejs',
};

// Start the app
const app = express();
app.use(express.json());

// This line catches ALL requests safely without crashing
// Notice we use '/*' here which works perfectly
app.get('/*', async (req, res) => {
  try {
    // Just send back a simple message to prove it works
    res.status(200).json({ 
      message: "✅ Success! Your API is working.",
      path: req.path 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Send the app to Vercel
export default app;
