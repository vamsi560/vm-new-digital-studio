// 📁 File: api/analyze-prompt.js

import { callGenerativeAI } from './utils/shared';

module.exports = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'No prompt provided for analysis.' });
    }

    const analyzerPrompt = `A user has provided this app idea: "${prompt}".
Act as an expert software architect. Analyze the request and create a clear plan using Markdown:

1. **Pages**: List each page with a brief description.
2. **Reusable Components**: List UI components (e.g., Navbar, Card) with short descriptions.

This output will be shown to the user.`;

    const plan = await callGenerativeAI(analyzerPrompt);
    res.status(200).json({ plan });
  } catch (err) {
    console.error('Error in /api/analyze-prompt:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
