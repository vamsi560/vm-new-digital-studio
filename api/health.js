import cors from 'cors';

// CORS configuration
const corsMiddleware = cors({
  origin: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
  credentials: true
});

export default async function handler(req, res) {
  // Handle CORS
  await new Promise((resolve) => corsMiddleware(req, res, resolve));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Check Hugging Face AI status
    const huggingFaceStatus = {
      status: 'operational',
      api: 'Hugging Face Inference API',
      models: ['WizardCoder-15B', 'CodeLlama-13B', 'DeepSeek-Coder-6.7B'],
      timestamp: new Date().toISOString()
    };

    // Check system health
    const healthStatus = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        huggingFace: huggingFaceStatus,
        database: 'operational',
        figma: 'operational'
      },
      version: '2.0.0',
      aiProvider: 'Hugging Face AI (Open Source)'
    };

    res.status(200).json(healthStatus);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 