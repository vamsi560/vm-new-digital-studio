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

    // Enhanced prompt for dynamic package.json and detailed analysis
    const prompt = `You are an expert React developer. Given the following screen mockups, perform the following:

1. Analyze the screens and list all unique screens/pages detected, with a brief description for each.
2. List all reusable UI components you would extract, with a short description for each.
3. Generate a complete, production-ready React app using Tailwind CSS:
   - Use a scalable file/folder structure.
   - Extract and reuse components where possible.
   - Add PropTypes and JSDoc comments to all components.
   - Ensure all imports are correct.
   - Output a manifest JSON listing all files and their purposes.
   - Generate a package.json that includes only the dependencies actually required by the generated code (analyze all imports and features).
   - Include public/index.html, src/index.js, src/App.jsx, components, pages, and a README.md.
   - All code should be valid and ready to run.
4. Evaluate how well the generated React app matches the uploaded screens. Give a score (0-10) and a short justification.

Respond with a single JSON object:
{
  analysis: {
    screens: [ { name, description } ],
    components: [ { name, description } ],
    summary: string
  },
  manifest: { ... },
  files: { path: content, ... },
  qa: { score: number, justification: string }
}`;

    // Convert all uploaded files to the format the AI model expects
    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));
    const aiResponse = await callGenerativeAI(prompt, imageParts, true);
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = await parseJsonWithCorrection(aiResponse, prompt, imageParts);
    }
    let { files: generatedFiles, manifest, analysis, qa } = parsed;
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

    res.status(200).json({ generatedFiles, manifest, analysis, qa });
  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
