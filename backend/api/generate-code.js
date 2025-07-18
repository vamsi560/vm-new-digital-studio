import { GoogleGenerativeAI } from "@google/generative-ai";
import formidable from 'formidable';
import fs from 'fs/promises';

// Initialize the Google AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

// Helper function to convert a file to a GenerativePart
async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

// Main handler for the serverless function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const uploadedScreens = files.screens || [];
    if (uploadedScreens.length === 0) {
      return res.status(400).json({ error: "No screens were uploaded." });
    }

    // Prepare the prompt for the AI model
    const prompt = `
      You are an expert web developer specializing in React and Tailwind CSS.
      Based on the following screen mockups, generate a complete React application.
      Create reusable components and structure the code logically.
      The user has provided ${uploadedScreens.length} screens in order.
      Analyze them and generate the corresponding JSX and CSS code.
    `;

    // Convert all uploaded files to the format the AI model expects
    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // In a real implementation, you would parse 'text' to extract file paths and code
    // For this example, we'll return a mock file structure.
    const generatedFiles = {
      'src/components/Header.jsx': `// Generated Header Code\n${text.substring(0, 200)}`,
      'src/pages/HomePage.jsx': `// Generated Home Page Code\n${text.substring(200)}`,
      'package.json': '{ "name": "new-react-app", "dependencies": { "react": "latest" } }'
    };

    // Send the generated file content back to the frontend
    res.status(200).json({ generatedFiles });

  } catch (error) {
    console.error('Error in generate-code API:', error);
    res.status(500).json({ error: `Failed to generate code: ${error.message}` });
  }
}
