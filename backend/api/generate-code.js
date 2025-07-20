import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from "formidable";
import fs from "fs/promises";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

function cleanCodeBlocks(raw) {
  return raw
    .replace(/```(?:jsx|js)?/g, '')
    .replace(/^.*\*\*.*$/gm, '')
    .replace(/^Here's.*$/gm, '')
    .replace(/^[A-Z].*:\s*$/gm, '')
    .trim();
}

function parseFilesFromResponse(text) {
  const fileMap = {};
  const blocks = text.split(/\/\/\s*File:\s*/).filter(Boolean);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const filename = lines.shift().trim();
    fileMap[filename] = lines.join('\n').trim();
  }
  return fileMap;
}

function containsTailwindClasses(fileMap) {
  const indicators = ['className="bg-', 'className="text-', 'className="flex', 'className="grid'];
  return Object.values(fileMap).some((content) =>
    indicators.some((cls) => content.includes(cls))
  );
}

function ensureAppAndIndex(fileMap, pageFiles) {
  if (!fileMap['src/App.jsx']) {
    const imports = pageFiles.map((f, i) => `import Page${i + 1} from './pages/${f.split('/').pop()}';`).join('\n');
    const renders = pageFiles.length === 1
      ? `<Page1 />`
      : `<div>\n${pageFiles.map((_, i) => `  <Page${i + 1} />`).join('\n')}\n</div>`;

    fileMap['src/App.jsx'] = `
import React from 'react';
${imports}

const App = () => {
  return (
    ${renders}
  );
};

export default App;`;
  }

  if (!fileMap['src/index.js']) {
    fileMap['src/index.js'] = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
    `;
  }

  if (!fileMap['public/index.html']) {
    fileMap['public/index.html'] = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }
}

function inferDependencies(fileMap) {
  const dependencySet = new Set();
  const importRegex = /import\s+.*?['"](.+?)['"]/g;

  for (const content of Object.values(fileMap)) {
    let match;
    while ((match = importRegex.exec(content))) {
      const module = match[1];
      if (!module.startsWith('.') && !module.startsWith('/')) {
        dependencySet.add(module.split('/')[0]);
      }
    }
  }

  const knownVersions = {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.0",
    tailwindcss: "^3.4.1",
    autoprefixer: "^10.4.14",
    postcss: "^8.4.24"
  };

  const dependencies = {};
  for (const dep of dependencySet) {
    dependencies[dep] = knownVersions[dep] || "latest";
  }

  return dependencies;
}

function createPackageJson(fileMap) {
  const deps = inferDependencies(fileMap);

  const pkg = {
    name: "generated-react-app",
    version: "1.0.0",
    private: true,
    dependencies: deps,
    scripts: {
      start: "react-scripts start",
      build: "react-scripts build",
      lint: "eslint .",
      format: "prettier --write ."
    },
    devDependencies: {
      eslint: "^8.56.0",
      prettier: "^3.2.5"
    }
  };

  if ('tailwindcss' in deps) {
    Object.assign(pkg.devDependencies, {
      tailwindcss: deps.tailwindcss,
      autoprefixer: deps.autoprefixer,
      postcss: deps.postcss
    });
  }

  return JSON.stringify(pkg, null, 2);
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
      Based on the screen mockups provided, generate valid React JSX component files.
      Return the result using // File: <filename> before each file.
      Do NOT include markdown. Only return real JSX + JS files.
      Ensure all components are exported, props handled, and multiple pages are split properly.
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
    const fileMap = parseFilesFromResponse(cleanText);

    const usesTailwind = containsTailwindClasses(fileMap);
    const pageFiles = Object.keys(fileMap).filter((k) => k.includes('/pages/') || k.includes('/components/'));

    ensureAppAndIndex(fileMap, pageFiles);

    if (usesTailwind) {
      fileMap['tailwind.config.js'] = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

      fileMap['postcss.config.js'] = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

      fileMap['src/index.css'] = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

      fileMap['src/index.js'] = fileMap['src/index.js'].replace(
        `import App from './App';`,
        `import './index.css';\nimport App from './App';`
      );
    }

    fileMap['.eslintrc.json'] = JSON.stringify({
      env: {
        browser: true,
        es2021: true
      },
      extends: ['eslint:recommended', 'plugin:react/recommended'],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      plugins: ['react'],
      rules: {}
    }, null, 2);

    fileMap['.prettierrc'] = JSON.stringify({
      semi: true,
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      trailingComma: 'none'
    }, null, 2);

    fileMap['package.json'] = createPackageJson(fileMap);

    res.status(200).json({ generatedFiles: fileMap });
  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
