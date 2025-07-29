// 📁 File: api/utils/shared.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

const apiKeys = [
  "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU",
  "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU",
  "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU"
].filter(Boolean);

const models = (process.env.GEMINI_MODELS || "gemini-1.5-flash,gemini-2.0-flash,gemini-2.5-flash").split(',');

const clients = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentClientIndex = 0;
let currentModelIndex = 0;

export function getApiClient() {
  const client = clients[currentClientIndex];
  const modelName = models[currentModelIndex];

  currentClientIndex = (currentClientIndex + 1) % clients.length;
  if (currentClientIndex === 0) {
    currentModelIndex = (currentModelIndex + 1) % models.length;
  }
  return client.getGenerativeModel({ model: modelName });
}

export function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

export function toPascalCase(str) {
  if (typeof str !== 'string') return `Component${Math.floor(Math.random() * 1000)}`;
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export async function callGenerativeAI(prompt, images = [], isJsonResponse = false, attempt = 1) {
  const maxAttempts = clients.length * models.length;
  if (attempt > maxAttempts) throw new Error("All API keys/models failed");

  try {
    const model = getApiClient();
    const contentParts = [{ text: prompt }, ...images];
    const generationConfig = isJsonResponse ? { responseMimeType: "application/json" } : {};

    const result = await model.generateContent({
      contents: [{ role: "user", parts: contentParts }],
      generationConfig
    });

    let text = result.response.text();
    if (!isJsonResponse) text = text.replace(/```[a-z]*|```/g, '').trim();
    return text;
  } catch (err) {
    console.error(`Attempt ${attempt} failed: ${err.message}`);
    if (err.status === 429 || err.message.includes('429')) {
      console.log(`Rate limit hit. Retrying with backoff...`);
      await new Promise(res => setTimeout(res, 2000 * attempt));
      return callGenerativeAI(prompt, images, isJsonResponse, attempt + 1);
    } else if (err.response?.status >= 500 || err.message.includes('Internal error')) {
      console.log(`Server-side error. Rotating model...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callGenerativeAI(prompt, images, isJsonResponse, attempt + 1);
    }
    throw err;
  }
}

export async function parseJsonWithCorrection(jsonString, prompt, images = []) {
  for (let i = 0; i < 3; i++) {
    try {
      const cleaned = jsonString.replace(/```[a-z]*|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON parse failed, attempt", i + 1, ":", jsonString);
      // Try to extract JSON object if possible
      const match = jsonString.match(/{[\s\S]*}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (innerErr) {
          console.error("Regex extraction parse failed:", match[0]);
        }
      }
      const correctionPrompt = `Fix the invalid JSON below. Return only a valid JSON object, no explanations or extra text:\n\n${jsonString}`;
      jsonString = await callGenerativeAI(correctionPrompt, images);
    }
  }
  throw new Error("Failed to parse corrected JSON. Last output: " + jsonString);
}

export async function callMcpServer(prompt, imageParts = [], stream = false) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU";
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
    throw new Error(errText);
  }
  const geminiData = await geminiRes.json();
  return geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
         geminiData.candidates?.[0]?.content?.parts?.[0] ||
         geminiData.candidates?.[0]?.content?.text ||
         JSON.stringify(geminiData);
}

export function buildAppRouterPrompt(pages) {
  if (!pages || pages.length === 0) return '';

  if (pages.length === 1) {
    return `You are an expert React developer. Generate App.js for a single-page app.\nImport and render '${pages[0]}' from './pages/${pages[0]}'.\nSet up BrowserRouter and Route for '/' only. Do not include navigation or links.`;
  }

  return `You are an expert React developer. Generate App.js for a multi-page React app.\nImport and route the following pages using react-router-dom:\n${pages.map(p => `- import ${p} from './pages/${p}';`).join('\n')}\nCreate a simple Nav with NavLinks. First page is home ('/'). Use clean Tailwind CSS.`;
}
