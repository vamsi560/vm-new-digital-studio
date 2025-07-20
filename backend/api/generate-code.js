import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from "formidable";
import fs from "fs/promises";

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

const TAILWIND_INDICATORS = [
  'className="bg-',
  'className="text-',
  'className="flex',
  'className="grid',
];

function containsTailwindClasses(fileMap) {
  return Object.values(fileMap).some((content) =>
    TAILWIND_INDICATORS.some((cls) => content.includes(cls))
  );
}

function cleanCodeBlocks(raw) {
  const code = raw
    .replace(/```(?:jsx|js)?/g, '')
    .replace(/^.*\*\*.*$/gm, '')
    .replace(/^Here's.*$/gm, '')
    .replace(/^[A-Z].*:$/gm, '')
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
      return res.status(400).json({ error: 'No screens were uploaded.' });
    }

    const prompt = `
      You are an expert React developer.
      Based on the screen mockups provided, generate valid and clean React component files.
      Only return valid JSX code — no markdown, no English commentary, and no explanations.
      Include proper exports, props handling, and avoid multiple <Routes> in a single file.
    `;

    async function fileToGenerativePart(file) {
      const fileData = await fs.readFile(file.filepath);
      return {
        inlineData: {
          data: Buffer.from(fileData).toString('base64'),
          mimeType: file.mimetype,
        },
      };
    }

    const imageParts = await Promise.all(
      uploadedScreens.map(fileToGenerativePart)
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let rawText = '';
    let retry = 0;
    const maxRetries = 3;

    while (retry < maxRetries) {
      try {
        const result = await model.generateContent([prompt, ...imageParts]);
        rawText = await result.response.text();
        break;
      } catch (error) {
        if (error.response?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, (retry + 1) * 1000));
          retry++;
        } else {
          throw error;
        }
      }
    }

    if (!rawText) {
      return res.status(500).json({ error: 'AI generation failed after retries.' });
    }

    const cleanText = cleanCodeBlocks(rawText);

    const jsxFiles = {
      'src/components/Header.jsx': cleanText.substring(0, 400),
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
        name: 'generated-react-app',
        version: '1.0.0',
        private: true,
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
        },
      }, null, 2),
    };

    const usesTailwind = containsTailwindClasses(jsxFiles);
    if (usesTailwind) {
      jsxFiles['tailwind.config.js'] = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

      jsxFiles['postcss.config.js'] = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

      jsxFiles['src/index.css'] = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

      jsxFiles['src/index.js'] = jsxFiles['src/index.js'].replace(
        `import App from './App';`,
        `import './index.css';\nimport App from './App';`
      );

      const pkg = JSON.parse(jsxFiles['package.json']);
      pkg.devDependencies = {
        tailwindcss: '^3.4.1',
        autoprefixer: '^10.4.14',
        postcss: '^8.4.24',
      };
      jsxFiles['package.json'] = JSON.stringify(pkg, null, 2);
    }

    res.status(200).json({ generatedFiles: jsxFiles });
  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
