// backend/api/generate-code.js (Enhanced Version)
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

// Helper: Generate preview HTML for React component
function generateComponentPreview(componentCode, componentName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .error-boundary { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }

            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }

            render() {
                if (this.state.hasError) {
                    return (
                        <div className="error-boundary">
                            <h3>❌ Component Error</h3>
                            <p><strong>Error:</strong> {this.state.error?.message}</p>
                        </div>
                    );
                }
                return this.props.children;
            }
        }

        ${componentCode}

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <ErrorBoundary>
                <${componentName} />
            </ErrorBoundary>
        );
    </script>
</body>
</html>`;
}

// Helper: Extract component name from React code
function extractComponentName(code) {
  const matches = [
    /export\s+default\s+function\s+(\w+)/,
    /function\s+(\w+)/,
    /const\s+(\w+)\s*=/,
    /export\s+default\s+(\w+)/
  ];
  
  for (const regex of matches) {
    const match = code.match(regex);
    if (match) return match[1];
  }
  
  return 'App';
}

// Helper: Generate preview data for React files
function generatePreviewData(files) {
  const previews = {};
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.jsx') || (path.endsWith('.js') && path.includes('src/'))) {
      const componentName = extractComponentName(content);
      previews[path] = {
        componentName,
        previewHtml: generateComponentPreview(content, componentName),
        isPreviewable: true
      };
    }
  });
  
  return previews;
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

    // Enhanced prompt for better React generation with preview support
    const prompt = `You are an expert React developer. Given the following screen mockups, generate a complete, production-ready React app using Tailwind CSS.

Requirements:
- Use a scalable file/folder structure
- Extract and reuse components where possible
- Add PropTypes and JSDoc comments to all components
- Ensure all imports are correct
- All code should be valid and ready to run
- Create components that are easily previewable in isolation
- Use modern React patterns (hooks, functional components)
- Make components responsive and accessible

Generate the following structure:
- package.json with all required dependencies
- public/index.html
- src/index.js (entry point)
- src/index.css (Tailwind imports)
- src/App.jsx (main app component)
- src/components/ (reusable components)
- src/pages/ (page components if multiple screens)
- tailwind.config.js
- postcss.config.js
- README.md

Respond with a single JSON object: { manifest, files: { path: content, ... } }`;

    // Convert all uploaded files to the format the AI model expects
    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));
    const aiResponse = await callGenerativeAI(prompt, imageParts, true);
    
    // Clean AI response before parsing
    let cleanedResponse = aiResponse.replace(/```[a-z]*|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch {
      parsed = await parseJsonWithCorrection(cleanedResponse, prompt, imageParts);
    }
    
    let { files: generatedFiles, manifest } = parsed;
    if (!generatedFiles || typeof generatedFiles !== 'object') generatedFiles = {};

    // Ensure minimum required files exist
    if (!generatedFiles['package.json']) {
      generatedFiles['package.json'] = JSON.stringify({
        name: 'generated-react-app',
        version: '0.1.0',
        private: true,
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-scripts': '5.0.1'
        },
        devDependencies: {
          tailwindcss: '^3.4.1',
          postcss: '^8.4.38',
          autoprefixer: '^10.4.19'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test'
        }
      }, null, 2);
    }

    // Ensure other required files
    if (!generatedFiles['public/index.html']) {
      generatedFiles['public/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated React App</title>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
    }

    if (!generatedFiles['src/index.js']) {
      generatedFiles['src/index.js'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    }

    if (!generatedFiles['src/index.css']) {
      generatedFiles['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
    }

    if (!generatedFiles['tailwind.config.js']) {
      generatedFiles['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    }

    if (!generatedFiles['postcss.config.js']) {
      generatedFiles['postcss.config.js'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    }

    if (!generatedFiles['src/App.jsx']) {
      generatedFiles['src/App.jsx'] = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to your Generated React App!
        </h1>
        <p className="text-gray-600">
          This app was generated automatically from your designs. Start editing to see changes.
        </p>
      </div>
    </div>
  );
}
`;
    }

    // Send response with manifest and files
    res.status(200).json({ manifest, files: generatedFiles });

    // --- End of handler ---
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
