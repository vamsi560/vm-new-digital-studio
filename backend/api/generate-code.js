import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI model
const gemini = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  }
});

// CORS configuration
const corsMiddleware = cors({
  origin: true, // Allow all origins for testing
  credentials: true
});

export default async function handler(req, res) {
  console.log('API Request received:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    body: req.body
  });
  
  // Handle CORS
  await new Promise((resolve) => corsMiddleware(req, res, resolve));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Check if this is a form data request (from frontend) or JSON request
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data request from frontend
      return await handleCodeGeneration(req, res);
    } else {
      // Handle JSON request with action parameter
      const { action, ...data } = req.body || {};

      switch (action) {
        case 'generate_pixel_perfect_code':
          return await handleCodeGeneration(req, res);
        
        case 'import_figma':
          return await handleFigmaImport(req, res);
        
        case 'evaluate_code':
          return await handleCodeEvaluation(req, res);
        
        case 'generate_analysis':
          return await handleComponentAnalysis(req, res);
        
        default:
          return res.status(400).json({ error: 'Invalid action specified' });
      }
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

// Handle file uploads for code generation
async function handleCodeGeneration(req, res) {
  try {
    // Parse multipart form data
    console.log('Parsing form data...');
    const formData = await new Promise((resolve, reject) => {
      upload.array('images', 10)(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          reject(err);
        } else {
          console.log('Form data parsed successfully');
          console.log('Files received:', req.files?.length || 0);
          console.log('Body data:', req.body);
          resolve(req);
        }
      });
    });

    // Handle case where no files are uploaded
    if (!formData.files || formData.files.length === 0) {
      console.log('No files uploaded, generating sample code...');
      const sampleCode = `// Sample React Component
import React from 'react';

const SampleComponent = () => {
  return (
    <div className="sample-component">
      <h1>Sample React Component</h1>
      <p>This is a sample component generated without uploaded images.</p>
    </div>
  );
};

export default SampleComponent;`;

      res.json({
        success: true,
        mainCode: sampleCode,
        qualityScore: { overall: 8, codeQuality: 8, performance: 8, accessibility: 8, security: 8 },
        analysis: { analysis: 'Sample component analysis' },
        projectId: `project-${Date.now()}`,
        metadata: {
          id: `project-${Date.now()}`,
          platform: 'web',
          framework: 'React',
          qualityScore: { overall: 8 },
          timestamp: new Date().toISOString(),
          analysis: 'Sample component analysis'
        },
        platform: 'web',
        framework: 'React',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const images = formData.files?.map(file => ({
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
      originalname: file.originalname
    })) || [];

    const options = {
      platform: formData.body.platform || 'web',
      framework: formData.body.framework || 'React',
      styling: formData.body.styling || 'Tailwind CSS',
      architecture: formData.body.architecture || 'Component Based',
      customLogic: formData.body.customLogic || '',
      routing: formData.body.routing || ''
    };

    // Generate code using Gemini AI
    const generatedCode = await generateWithGemini(images, options);
    
    // Refine the generated code
    const refinedCode = await refineCode(generatedCode, options.framework);
    
    // Evaluate code quality
    const qualityScore = await evaluateCodeQuality(combinedCode, options.framework, options.platform);
    
    // Generate component analysis
    const analysis = await generateComponentAnalysis(combinedCode, options.framework, options.platform);

    // Save project metadata (in production, save to database)
    const projectId = `project-${Date.now()}`;
    const projectMetadata = {
      id: projectId,
      platform: options.platform,
      framework: options.framework,
      qualityScore,
      timestamp: new Date().toISOString(),
      analysis: analysis.analysis
    };

    res.json({
      success: true,
      code: refinedCode,
      qualityScore,
      analysis: analysis.analysis,
      projectId,
      metadata: projectMetadata,
      platform: options.platform,
      framework: options.framework,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle Figma import
async function handleFigmaImport(req, res) {
  try {
    const { figmaUrl, platform, framework, styling, architecture, customLogic, routing } = req.body;

    if (!figmaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Figma URL is required',
        timestamp: new Date().toISOString()
      });
    }

    // Extract file key from Figma URL
    const fileKey = extractFigmaFileKey(figmaUrl);
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Figma URL format',
        timestamp: new Date().toISOString()
      });
    }

    // Get Figma file data
    const figmaData = await getFigmaFileData(fileKey);
    
    // Extract frames and generate images
    const frames = extractFigmaFrames(figmaData.document);
    const imageUrls = await getFigmaImageUrls(fileKey, frames);
    const processedImages = await downloadFigmaImages(imageUrls);

    // Generate code from Figma images
    const options = { platform, framework, styling, architecture, customLogic, routing };
    const generatedCode = await generateWithGemini(processedImages, options);
    
    const refinedCode = await refineCode(generatedCode, framework);
    const qualityScore = await evaluateCodeQuality(refinedCode, framework, platform);
    const analysis = await generateComponentAnalysis(refinedCode, framework, platform);

    const projectId = `figma-${platform}-${Date.now()}`;
    const projectMetadata = {
      id: projectId,
      platform,
      framework,
      qualityScore,
      figmaUrl,
      fileKey,
      frames: frames.length,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      code: combinedCode,
      qualityScore,
      analysis: analysis.analysis,
      projectId,
      metadata: projectMetadata,
      figmaData: {
        fileKey,
        frames: frames.length,
        images: processedImages.length
      },
      platform,
      framework,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Figma import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle code evaluation
async function handleCodeEvaluation(req, res) {
  try {
    const { code, framework, platform } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required for evaluation',
        timestamp: new Date().toISOString()
      });
    }

    const evaluation = await evaluateCodeQuality(code, framework, platform);
    
    res.json({
      success: true,
      evaluation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Code evaluation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle component analysis
async function handleComponentAnalysis(req, res) {
  try {
    const { code, framework, platform, figmaData } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required for analysis',
        timestamp: new Date().toISOString()
      });
    }

    const analysis = await generateComponentAnalysis(code, framework, platform, figmaData);
    
    res.json({
      success: true,
      analysis: analysis.analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Component analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// AI Model Functions
async function generateWithGemini(images, options) {
  const prompt = buildCodePrompt(images, options);
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.data,
      mimeType: img.mimeType || 'image/png'
    }
  }));

  const result = await model.generateContent([prompt, ...imageParts]);
  return result.response.text();
}

async function generateWithGemini(images, options) {
  const prompt = buildCodePrompt(images, options);
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.data,
      mimeType: img.mimeType || 'image/png'
    }
  }));

  const result = await model.generateContent([prompt, ...imageParts]);
  return result.response.text();
}

async function refineCode(generatedCode, framework) {
  const refinementPrompt = `
Refine the following ${framework} code to ensure pixel-perfect implementation:

${generatedCode}

Improve the code to:
1. Ensure pixel-perfect implementation
2. Follow ${framework} best practices
3. Add proper error handling
4. Include comprehensive documentation
5. Optimize for performance
6. Ensure accessibility compliance
7. Make it production-ready

Return only the refined code without explanations.
  `;

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(refinementPrompt);
  return result.response.text();
}

async function evaluateCodeQuality(code, framework, platform) {
  const evaluationPrompt = `
Evaluate the quality of the following ${framework} code for ${platform}:

${code}

Provide a detailed evaluation covering:
1. Code Quality (1-10): Readability, maintainability, documentation, naming
2. Performance (1-10): Efficiency, memory usage, execution speed
3. Accessibility (1-10): WCAG compliance, usability, responsive design
4. Security (1-10): Vulnerabilities, data protection, input validation

Return the evaluation as JSON format with scores and recommendations.
  `;

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(evaluationPrompt);
  return parseEvaluationResponse(result.response.text());
}

async function generateComponentAnalysis(code, framework, platform, figmaData = null) {
  const analysisPrompt = `
Analyze the following ${framework} code for ${platform} and generate a comprehensive component analysis:

${code}

${figmaData ? `Figma Context: ${JSON.stringify(figmaData)}` : ''}

Include in the analysis:
1. Component Structure
2. Props/State Management
3. Lifecycle Methods
4. Dependencies
5. Performance Considerations
6. Accessibility Features
7. Testing Recommendations
8. Documentation Requirements

Generate a detailed markdown report.
  `;

  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(analysisPrompt);
  return { analysis: result.response.text() };
}

// Figma Integration Functions
function extractFigmaFileKey(figmaUrl) {
  const patterns = [
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
    /figma\.com\/proto\/([a-zA-Z0-9]+)/
  ];

  for (const pattern of patterns) {
    const match = figmaUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getFigmaFileData(fileKey) {
  const token = "figd_00LP2oP9Fqfd0PY0alm9L9tsjlC85pn8m5KEeXMn";
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': token,
      'User-Agent': 'Digital-Studio-VM/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
  }

  return response.json();
}

function extractFigmaFrames(document) {
  const frames = [];
  
  const traverse = (node) => {
    if (node.type === 'FRAME' || node.type === 'COMPONENT') {
      frames.push({
        id: node.id,
        name: node.name,
        type: node.type
      });
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };

  traverse(document);
  return frames;
}

async function getFigmaImageUrls(fileKey, frames) {
  const token = "figd_00LP2oP9Fqfd0PY0alm9L9tsjlC85pn8m5KEeXMn";
  const frameIds = frames.map(frame => frame.id).join(',');
  
  const response = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${frameIds}&format=png&scale=2`,
    {
      headers: {
        'X-Figma-Token': token,
        'User-Agent': 'Digital-Studio-VM/1.0'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get image URLs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.images || {};
}

async function downloadFigmaImages(imageUrls) {
  const processedImages = [];

  for (const [frameId, imageUrl] of Object.entries(imageUrls)) {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      
      processedImages.push({
        id: frameId,
        data: base64Data,
        mimeType: 'image/png'
      });
    } catch (error) {
      console.warn(`Failed to download image for frame ${frameId}:`, error.message);
    }
  }

  return processedImages;
}

// Utility Functions
function buildCodePrompt(images, options) {
  const { platform, framework, styling, architecture, customLogic, routing } = options;
  
  return `
Generate pixel-perfect ${framework} code for the provided UI screens.

Requirements:
- Platform: ${platform}
- Framework: ${framework}
- Styling: ${styling}
- Architecture: ${architecture}
- Custom Logic: ${customLogic || 'None'}
- Routing: ${routing || 'None'}

Instructions:
1. Analyze the provided images carefully
2. Generate responsive, accessible code
3. Follow best practices for ${framework}
4. Include proper error handling
5. Add comprehensive comments
6. Ensure pixel-perfect implementation
7. Include all necessary dependencies

Generate complete, production-ready code that can be immediately used.
  `;
}

function parseEvaluationResponse(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback parsing
    const evaluation = {
      codeQuality: { score: 5, issues: [], recommendations: [] },
      performance: { score: 5, issues: [], recommendations: [] },
      accessibility: { score: 5, issues: [], recommendations: [] },
      security: { score: 5, issues: [], recommendations: [] },
      overallScore: 5
    };

    const scoreRegex = /(\w+)\s*[:\-]\s*(\d+)/gi;
    let match;
    
    while ((match = scoreRegex.exec(response)) !== null) {
      const [, category, score] = match;
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '');
      
      if (evaluation[normalizedCategory]) {
        evaluation[normalizedCategory].score = Math.min(10, Math.max(1, parseInt(score)));
      }
    }

    const scores = Object.values(evaluation).filter(v => typeof v === 'object' && v.score);
    evaluation.overallScore = scores.reduce((sum, v) => sum + v.score, 0) / scores.length;

    return evaluation;
  } catch (error) {
    console.warn('Failed to parse evaluation response:', error);
    return {
      codeQuality: { score: 5, issues: [], recommendations: [] },
      performance: { score: 5, issues: [], recommendations: [] },
      accessibility: { score: 5, issues: [], recommendations: [] },
      security: { score: 5, issues: [], recommendations: [] },
      overallScore: 5
    };
  }
}
