// 📁 File: backend/api/generate-native-code.js

import multer from 'multer';
import {
    bufferToGenerativePart,
    callGenerativeAI,
    parseJsonWithCorrection,
    toPascalCase
} from './utils/shared.js';

// Set up multer for memory storage to handle file uploads
const upload = multer({
    storage: multer.memoryStorage()
});

const handler = async (req, res) => {
    try {
        // Use a Promise to wait for the multer middleware to process the upload
        await new Promise((resolve, reject) => {
            upload.array('screens')(req, res, err => (err ? reject(err) : resolve()));
        });

        const {
            projectName = 'MyMobileApp', platform
        } = req.body;
        const screenFiles = req.files;

        // Validate inputs
        if (!screenFiles || screenFiles.length === 0) {
            return res.status(400).json({
                error: 'No screen images provided.'
            });
        }
        if (!['android', 'ios'].includes(platform)) {
            return res.status(400).json({
                error: 'A valid platform (android/ios) must be specified.'
            });
        }

        // Convert uploaded files to the format the AI model expects
        const imageParts = screenFiles.map(file => bufferToGenerativePart(file.buffer, file.mimetype));
        let generatedFiles = {};

        if (platform === 'android') {
            const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/gi, '').toLowerCase();
            const packageName = `com.example.${safeProjectName}`;

            const detailedAndroidPrompt = `
You are an expert Android developer specializing in Jetpack Compose. Your task is to generate a complete and runnable Android application based on the provided UI screen images.

Your output MUST be a single, valid JSON object containing a "files" key. The value of "files" should be an object where each key is the full file path and the value is the corresponding code content as a string.

Please adhere to the following standard Android project structure and conventions:

1.  **Package Name**: \`${packageName}\`
2.  **File Paths**: All Kotlin files should be placed within the correct package directory structure (e.g., \`app/src/main/java/com/example/${safeProjectName}/\`).
3.  **MainActivity.kt**: This is the main entry point for the app. It should set up the main theme and navigation.
4.  **UI Structure**:
    * Place screen composables in a \`ui/screens\` subpackage.
    * Place reusable UI components in a \`ui/components\` subpackage.
5.  **Theme**: Generate standard theme files (\`Color.kt\`, \`Theme.kt\`, \`Type.kt\`) inside the \`ui/theme\` subpackage.
6.  **AndroidManifest.xml**: Create a complete \`AndroidManifest.xml\` file in \`app/src/main/\`.
7.  **build.gradle.kts**: Create a functional \`app/build.gradle.kts\` file, including necessary Jetpack Compose dependencies (\`androidx.core:core-ktx\`, \`androidx.lifecycle:lifecycle-runtime-ktx\`, \`androidx.activity:activity-compose\`, \`androidx.compose.ui:ui\`, etc.).

**Instructions**:
- Analyze the provided screens to identify distinct screens and any reusable components (buttons, cards, input fields, etc.).
- Generate the code for each screen and component in its own file.
- Ensure all Kotlin files include the correct \`package ${packageName}...\` declaration at the top.
- The code should be clean, well-commented, and ready to compile.
`;

            const responseJson = await callGenerativeAI(detailedAndroidPrompt, imageParts, true);
            const result = await parseJsonWithCorrection(responseJson, detailedAndroidPrompt, imageParts);

            if (!result.files || typeof result.files !== 'object') {
                throw new Error("AI response did not contain a valid 'files' object.");
            }
            generatedFiles = result.files;

            // Ensure all file contents are strings
            for (const path in generatedFiles) {
                generatedFiles[path] = String(generatedFiles[path]);
            }

        } else if (platform === 'ios') {
            // --- Existing iOS Logic ---
            const lang = 'Swift with SwiftUI';
            const fileExt = 'swift';
            const mainFileName = 'ContentView.swift';

            const architectPrompt = `Analyze the attached UI screens and identify all distinct screens and reusable UI components for a ${lang} mobile app. Output your analysis as a valid JSON object with two keys: "screens" and "reusable_components", which should be arrays of strings.`;
            const planJson = await callGenerativeAI(architectPrompt, imageParts, true);
            const plan = await parseJsonWithCorrection(planJson, architectPrompt, imageParts);

            plan.screens = plan.screens.map(toPascalCase);
            plan.reusable_components = plan.reusable_components.map(toPascalCase);

            if (plan.reusable_components && plan.reusable_components.length > 0) {
                const componentPrompt = `Generate ${lang} code for the following UI components: ${plan.reusable_components.join(', ')}. Respond with a single JSON object where keys are the component names and values are the code strings.`;
                const componentsJson = await callGenerativeAI(componentPrompt, imageParts, true);
                const components = await parseJsonWithCorrection(componentsJson, componentPrompt, imageParts);
                for (const name in components) {
                    generatedFiles[`components/${name}.${fileExt}`] = String(components[name]);
                }
            }

            for (let i = 0; i < plan.screens.length; i++) {
                const name = plan.screens[i];
                const screenPrompt = `Generate the ${lang} code for a screen component named '${name}'. If necessary, use the reusable components: ${plan.reusable_components.join(', ')}.`;
                const screenCode = await callGenerativeAI(screenPrompt, [imageParts[i]]);
                generatedFiles[`screens/${name}.${fileExt}`] = String(screenCode);
            }

            const finisherPrompt = `Generate the main entry point file (\`${mainFileName}\`) for a ${lang} application. This file should handle navigation between the following screens: ${plan.screens.join(', ')}. The first screen in the list should be the home view.`;
            const mainCode = await callGenerativeAI(finisherPrompt);
            generatedFiles[mainFileName] = String(mainCode);
        }

        const qaPrompt = `Review the generated code against the provided UI images. Return a single JSON object with a "score" (0-100) and a brief "justification" for your score.`;
        const accuracyResultJson = await callGenerativeAI(qaPrompt, imageParts, true);
        const accuracyResult = await parseJsonWithCorrection(accuracyResultJson, qaPrompt, imageParts);

        res.status(200).json({
            generatedFiles,
            accuracyResult
        });

    } catch (err) {
        console.error('Error in /api/generate-native-code:', err);
        res.status(500).json({
            error: 'An internal server error occurred during code generation.',
            details: err.message
        });
    }
};

export default handler;
