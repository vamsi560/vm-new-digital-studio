// 📁 api/generate-android.js

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseJsonWithCorrection } from './utils/shared.js';

const genAI = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWy");

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form data' });

    try {
      const screens = Array.isArray(files.screens) ? files.screens : [files.screens];
      const projectName = fields.projectName || 'android-ui';

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Enhanced prompt for manifest, analysis, and QA
      const prompt = `You are an expert Android developer. Given the following screen mockups, perform the following:

1. Analyze the screens and list all unique screens/pages detected, with a brief description for each.
2. List all reusable UI components you would extract, with a short description for each.
3. Describe the navigation structure between screens.
4. Generate a complete, production-ready Jetpack Compose Android app:
   - Use a scalable file/folder structure.
   - Extract and reuse components where possible.
   - Add KDoc comments to all components.
   - Ensure all imports are correct.
   - Output a manifest JSON listing all files and their purposes.
   - Generate build.gradle and AndroidManifest.xml.
   - All code should be valid and ready to run.
5. Evaluate how well the generated Android app matches the uploaded screens. Give a score (0-10) and a short justification.

Respond with a single JSON object:
{
  analysis: {
    screens: [ { name, description } ],
    components: [ { name, description } ],
    navigation: string,
    summary: string
  },
  manifest: { ... },
  files: { path: content, ... },
  qa: { score: number, justification: string }
}`;

      // Convert all uploaded files to the format the AI model expects
      const imageParts = await Promise.all(screens.map(screen => ({
        inlineData: {
          data: fs.readFileSync(screen.filepath, 'base64'),
          mimeType: screen.mimetype,
        },
      })));
      const result = await model.generateContent([
        { text: prompt },
        ...imageParts
      ]);
      let parsed;
      try {
        parsed = JSON.parse(result.response.text());
      } catch {
        parsed = await parseJsonWithCorrection(result.response.text(), prompt, imageParts);
      }
      let { files: generatedFiles, manifest, analysis, qa } = parsed;
      if (!generatedFiles || typeof generatedFiles !== 'object') generatedFiles = {};

      // Ensure build.gradle and AndroidManifest.xml exist
      if (!generatedFiles['android-ui/build.gradle']) {
        generatedFiles['android-ui/build.gradle'] = `apply plugin: 'com.android.application'\n...`;
      }
      if (!generatedFiles['android-ui/AndroidManifest.xml']) {
        generatedFiles['android-ui/AndroidManifest.xml'] = `<manifest ...></manifest>`;
      }

      return res.status(200).json({ generatedFiles, manifest, analysis, qa });
    } catch (e) {
      console.error('Generation error:', e);
      res.status(500).json({ error: 'Failed to generate Android code.' });
    }
  });
};
