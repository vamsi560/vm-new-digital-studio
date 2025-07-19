import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from 'formidable';
import fs from 'fs/promises';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

// Retry handler to prevent model overload crashes
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const message = err?.message || '';
      const isOverload = message.includes("overloaded") || message.includes("quota") || message.includes("503");

      if (isOverload && i < retries - 1) {
        console.warn(`Gemini overload. Retrying in ${delay * (i + 1)}ms...`);
        await new Promise((res) => setTimeout(res, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

// Convert uploaded file to Gemini-compatible input
async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({ maxFiles: 5 });
    const [fields, files] = await form.parse(req);

    const uploadedScreens = Array.isArray(files.screens)
      ? files.screens
      : [files.screens].filter(Boolean);

    if (!uploadedScreens.length) {
      return res.status(400).json({ error: "No screens were uploaded." });
    }

    // Quality hint to avoid multiple routers / missing exports / bad structure
    const prompt = `
You are a senior React engineer. Based on the UI screens provided, generate a **single React application** using Tailwind CSS and JSX.

⚠️ DO NOT create multiple app routers or entry points. Use a single 'App.jsx' or 'App.js'.
✅ Every component must have valid exports, required props, and no undefined variables.
✅ Reuse shared components (like Buttons, Cards) across screens.
✅ Do not generate duplicate routes or files.
✅ Ensure the structure is valid and runs in a standard Create React App or Vite setup.

Return code grouped by filename, formatted as:

\`\`\`
// src/components/MyComponent.jsx
<component code here>
\`\`\`

Begin:
`;

    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await retryWithBackoff(() =>
      model.generateContent([prompt, ...imageParts])
    );

    const text = (await result.response).text();

    // 🧠 Optional: smarter parsing for multiple files from LLM
    // For now, mock split
    const generatedFiles = {
      'src/components/Header.jsx': `// Generated Header Code\n${text.substring(0, 200)}`,
      'src/pages/HomePage.jsx': `// Generated Home Page Code\n${text.substring(200, 1200)}`,
      'src/App.jsx': `// Root App Component\n${text.substring(1200, 2200)}`,
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
      }, null, 2)

    };

    res.status(200).json({ generatedFiles });

  } catch (error) {
    console.error('💥 generate-code API error:', error);
    res.status(500).json({
      error: `Generation failed.`,
      details: error?.message || 'Unknown error'
    });
  }
}
