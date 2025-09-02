import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

// CORS configuration
const corsMiddleware = cors({
  origin: true, // Allow all origins for testing
  credentials: true
});

// Initialize Gemini AI model
const gemini = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

export default async function handler(req, res) {
  console.log('Analyze Prompt API Request received:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    body: req.body
  });

  // Handle CORS
  await new Promise((resolve) => corsMiddleware(req, res, resolve));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { prompt, platform, framework, styling, architecture } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Analyzing prompt:', { prompt, platform, framework, styling, architecture });

    // Analyze the prompt using Gemini AI
    const analysisPrompt = `
Analyze the following project description and provide a detailed breakdown:

Project Description: ${prompt}
Platform: ${platform || 'web'}
Framework: ${framework || 'React'}
Styling: ${styling || 'Tailwind CSS'}
Architecture: ${architecture || 'Component-Based'}

Please provide:
1. Project Overview
2. Key Features
3. Technical Requirements
4. Component Structure
5. Data Flow
6. UI/UX Considerations
7. Implementation Recommendations

Return the analysis in a structured format.
    `;

    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(analysisPrompt);
    const analysis = result.response.text();

    res.json({
      success: true,
      analysis,
      prompt,
      platform: platform || 'web',
      framework: framework || 'React',
      styling: styling || 'Tailwind CSS',
      architecture: architecture || 'Component-Based',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analyze prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
} 