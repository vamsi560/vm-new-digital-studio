import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from 'formidable';
import fs from 'fs/promises';

// Initialize AI
const genAI = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

// Utility to strip out markdown or invalid lines from AI response
function cleanCodeBlocks(raw) {
  const code = raw
    .replace(/```(?:jsx|js)?/g, '')     // remove markdown code fences
    .replace(/^.*\*\*.*$/gm, '')        // remove markdown bold lines
    .replace(/^Here's.*$/gm, '')        // remove English intros
    .replace(/^[A-Z].*:$/gm, '')        // remove lines like "Project Structure:"
    .trim();
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({ multiples: true });
    const [fields, files] = await form.parse(req);

    const uploadedScreens = files.screens || [];
    if (uploadedScreens.length === 0) {
      return res.status(400).json({ error: "No screens were uploaded." });
    }

    const prompt = `
      You are an expert React developer.
      Based on the screen mockups provided, generate valid and clean React component files.
      Only return valid JSX code — no markdown, no English commentary, and no explanations.
      Include proper exports, props handling, and avoid multiple <Routes> in a single file.
    `;

    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const rawText = await result.response.text();

    const cleanText = cleanCodeBlocks(rawText);

    const generatedFiles = {
      'src/components/Header.jsx': cleanText.substring(0, 400), // replace with parsed parts
      'src/pages/HomePage.jsx': cleanText.substring(400, 1200),
      'src/index.js': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
      `,
      'public/index.html': `
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"><title>Generated App</title></head>
  <body><div id="root"></div></body>
</html>
      `,
      'package.json': JSON.stringify({
        name: "generated-react-app",
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        },
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build"
        }
      }, null, 2)
    };

    res.status(200).json({ generatedFiles });

  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
