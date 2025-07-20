import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from 'formidable';
import fs from 'fs/promises';

// Initialize Gemini
const genAI = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

// Convert file to Gemini-compatible part
async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const uploadedScreens = Array.isArray(files.screens) ? files.screens : [files.screens];

    if (!uploadedScreens.length) {
      return res.status(400).json({ error: "No screens were uploaded." });
    }

    // Prompt setup
    const prompt = `
      You are a senior React developer. Based on the uploaded UI screens, generate a complete working Create React App (CRA) structure.
      1. Use functional components and JSX.
      2. Create at least two reusable components if possible.
      3. Export all components correctly.
      4. Avoid multiple routes or nested routers unless specified.
      5. Generate a valid package.json with react-scripts.
    `;

    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Example file content split (mock demo, adapt with parsing if needed)
    const headerCode = text.substring(0, 500);
    const homePageCode = text.substring(500, 1500);

    const generatedFiles = {
      'package.json': JSON.stringify({
        name: "vm-digital-studio-generated",
        version: "1.0.0",
        private: true,
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
          test: "react-scripts test"
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1"
        }
      }, null, 2),

      'public/index.html': `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,

      'src/index.js': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`,

      'src/App.js': `
import React from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div>
      <Header />
      <HomePage />
    </div>
  );
}

export default App;
`,

      'src/components/Header.jsx': `// Header Component (AI-generated)
${headerCode}`,

      'src/pages/HomePage.jsx': `// Home Page Component (AI-generated)
${homePageCode}`
    };

    res.status(200).json({ generatedFiles });

  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
