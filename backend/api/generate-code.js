import formidable from 'formidable';
import fs from 'fs/promises';
import { callGenerativeAI, parseJsonWithCorrection } from './utils/shared.js';

// Helper: Convert uploaded file to GenerativePart
async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString('base64'),
      mimeType: file.mimetype,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const uploadedScreens = files.screens || [];
    if (uploadedScreens.length === 0) {
      return res.status(400).json({ error: 'No screens were uploaded.' });
    }

    // Enhanced prompt for dynamic package.json
    const prompt = `You are an expert React developer. Given the following screen mockups, generate a complete, production-ready React app using Tailwind CSS.\n\n- Use a scalable file/folder structure.\n- Extract and reuse components where possible.\n- Add PropTypes and JSDoc comments to all components.\n- Ensure all imports are correct.\n- Output a manifest JSON listing all files and their purposes.\n- Generate a package.json that includes only the dependencies actually required by the generated code (analyze all imports and features).\n- Include public/index.html, src/index.js, src/App.jsx, components, pages, and a README.md.\n- All code should be valid and ready to run.\n- Respond with a single JSON object: { manifest, files: { path: content, ... } }.`;

    // Convert all uploaded files to the format the AI model expects
    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));
    const aiResponse = await callGenerativeAI(prompt, imageParts, true);
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = await parseJsonWithCorrection(aiResponse, prompt, imageParts);
    }
    let { files: generatedFiles, manifest } = parsed;
    if (!generatedFiles || typeof generatedFiles !== 'object') generatedFiles = {};

    // --- DYNAMIC PACKAGE.JSON HANDLING ---
    let pkg = null;
    if (generatedFiles['package.json']) {
      try {
        pkg = JSON.parse(generatedFiles['package.json']);
      } catch {
        pkg = null;
      }
    }
    if (!pkg) {
      pkg = {
        name: 'generated-react-app',
        version: '0.1.0',
        private: true,
        dependencies: {},
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test'
        }
      };
    }
    // Ensure minimum required dependencies
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies.react) pkg.dependencies.react = '^18.2.0';
    if (!pkg.dependencies['react-dom']) pkg.dependencies['react-dom'] = '^18.2.0';
    if (!pkg.dependencies['react-scripts']) pkg.dependencies['react-scripts'] = '5.0.1';
    // Optionally ensure prop-types and tailwindcss if used in code (not implemented here for brevity)
    generatedFiles['package.json'] = JSON.stringify(pkg, null, 2);

    if (!generatedFiles['public/index.html']) {
      generatedFiles['public/index.html'] = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Generated React App</title></head><body><div id='root'></div></body></html>`;
    }
    if (!generatedFiles['src/index.js']) {
      generatedFiles['src/index.js'] = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App />\u003c/React.StrictMode>);`;
    }
    if (!generatedFiles['src/App.jsx']) {
      generatedFiles['src/App.jsx'] = `import React from 'react';\nexport default function App() {\n  return <div>Welcome to your generated React app!</div>;\n}`;
    }
    if (!generatedFiles['README.md']) {
      generatedFiles['README.md'] = `# Generated React App\n\nThis project was generated automatically.\n\n## Setup\n\n1. Install dependencies:\n\n   npm install\n\n2. Start the app:\n\n   npm start\n`;
    }

    res.status(200).json({ generatedFiles, manifest });
  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
