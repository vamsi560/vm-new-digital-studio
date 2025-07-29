import fetch from 'node-fetch';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment.' });
  }
  try {
    const { prompt, imageParts, stream } = req.body;
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...(Array.isArray(imageParts) ? imageParts : [])
          ]
        }
      ]
    };
    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: errText });
    }
    const geminiData = await geminiRes.json();
    const modelText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      geminiData.candidates?.[0]?.content?.parts?.[0] ||
      geminiData.candidates?.[0]?.content?.text ||
      JSON.stringify(geminiData);
    res.status(200).send(modelText);
  } catch (err) {
    res.status(503).json({ error: err.message || 'Gemini model error' });
  }
}
