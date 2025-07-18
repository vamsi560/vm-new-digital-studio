// 📁 api/generate-android.js

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

      const generatedFiles = {};
      for (let screen of screens) {
        const base64 = fs.readFileSync(screen.filepath, 'base64');
        const result = await model.generateContent([
          {
            inlineData: {
              data: base64,
              mimeType: screen.mimetype,
            },
          },
          {
            text: `Generate clean Jetpack Compose Kotlin code for this Android screen with proper reusable components. Include build.gradle, AndroidManifest.xml and full structure.`
          },
        ]);

        const text = await result.response.text();
        generatedFiles[`android-ui/screens/${screen.originalFilename}.kt`] = text;
      }

      // Add placeholder build and manifest files
      generatedFiles['android-ui/build.gradle'] = `apply plugin: 'com.android.application'\n...`;
      generatedFiles['android-ui/AndroidManifest.xml'] = `<manifest ...></manifest>`;

      return res.status(200).json({ generatedFiles });
    } catch (e) {
      console.error('Generation error:', e);
      res.status(500).json({ error: 'Failed to generate Android code.' });
    }
  });
};
