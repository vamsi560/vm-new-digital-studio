// 📁 File: api/generate-native-code.js

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  bufferToGenerativePart,
  toPascalCase,
  callGenerativeAI,
  parseJsonWithCorrection
} = require('./utils/shared');

module.exports = async (req, res) => {
  try {
    await new Promise((resolve, reject) => upload.array('screens')(req, res, err => (err ? reject(err) : resolve())));

    const { projectName = 'MyMobileApp', platform } = req.body;
    const screenFiles = req.files;
    if (!screenFiles?.length) return res.status(400).json({ error: 'No screen images provided.' });
    if (!['android', 'ios'].includes(platform)) return res.status(400).json({ error: 'A valid platform (android/ios) must be specified.' });

    const imageParts = screenFiles.map(file => bufferToGenerativePart(file.buffer, file.mimetype));
    let generatedFiles = {};

    const lang = platform === 'android' ? 'Kotlin with Jetpack Compose' : 'Swift with SwiftUI';
    const fileExt = platform === 'android' ? 'kt' : 'swift';
    const mainFileName = platform === 'android' ? 'MainActivity.kt' : 'ContentView.swift';

    const architectPrompt = `Analyze UI screens and identify screens and reusable components for a ${lang} mobile app. Output valid JSON with "screens" and "reusable_components".`;
    const planJson = await callGenerativeAI(architectPrompt, imageParts);
    const plan = await parseJsonWithCorrection(planJson, architectPrompt, imageParts);
    plan.screens = plan.screens.map(toPascalCase);
    plan.reusable_components = plan.reusable_components.map(toPascalCase);

    if (plan.reusable_components.length) {
      const componentPrompt = `Generate ${lang} code for components: ${plan.reusable_components.join(', ')}. Output JSON { name: code }.`;
      const componentsJson = await callGenerativeAI(componentPrompt, imageParts);
      const components = await parseJsonWithCorrection(componentsJson, componentPrompt, imageParts);
      for (const name in components) {
        generatedFiles[`components/${name}.${fileExt}`] = components[name];
      }
    }

    for (let i = 0; i < plan.screens.length; i++) {
      const name = plan.screens[i];
      const screenPrompt = `Generate ${lang} screen component named ${name}. Use reusable components as needed.`;
      const screenCode = await callGenerativeAI(screenPrompt, [imageParts[i]]);
      generatedFiles[`screens/${name}.${fileExt}`] = screenCode;
    }

    const finisherPrompt = `Generate the main entry point file (${mainFileName}) for a ${lang} app with these screens: ${plan.screens.join(', ')}.`;
    const mainCode = await callGenerativeAI(finisherPrompt);
    generatedFiles[mainFileName] = mainCode;

    const qaPrompt = `Review generated ${lang} code vs UI image. Return JSON with "score" and "justification".`;
    const accuracyResult = await callGenerativeAI(qaPrompt, [imageParts[0]], true);

    res.status(200).json({ generatedFiles, accuracyResult });
  } catch (err) {
    console.error('Error in /api/generate-native-code:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
