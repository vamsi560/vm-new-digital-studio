import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PixelPerfectMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pixel-perfect-code-generator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.gemini = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");

    this.setupTools();
  }

  setupTools() {
    // Tool for generating React/Web code
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generate_web_code':
          return await this.generateWebCode(args);
        case 'generate_android_code':
          return await this.generateAndroidCode(args);
        case 'generate_ios_code':
          return await this.generateIOSCode(args);
        case 'evaluate_code_quality':
          return await this.evaluateCodeQuality(args);
        case 'generate_component_analysis':
          return await this.generateComponentAnalysis(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async generateWebCode({ images, framework, styling, architecture, customLogic }) {
    try {
      const prompt = this.buildWebCodePrompt(images, framework, styling, architecture, customLogic);
      
      // Use multiple AI models for better results
      const [openaiResult, geminiResult] = await Promise.all([
        this.generateWithOpenAI(prompt, images),
        this.generateWithGemini(prompt, images)
      ]);

      // Combine and refine results
      const combinedCode = await this.combineAndRefineCode(openaiResult, geminiResult, framework);
      
      // Evaluate code quality
      const qualityScore = await this.evaluateCodeQuality({ code: combinedCode, framework });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: combinedCode,
              qualityScore,
              framework,
              styling,
              architecture,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Web code generation failed: ${error.message}`);
    }
  }

  async generateAndroidCode({ images, architecture, customLogic }) {
    try {
      const prompt = this.buildAndroidCodePrompt(images, architecture, customLogic);
      const code = await this.generateWithOpenAI(prompt, images);
      
      const qualityScore = await this.evaluateCodeQuality({ code, framework: 'android' });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code,
              qualityScore,
              framework: 'android',
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Android code generation failed: ${error.message}`);
    }
  }

  async generateIOSCode({ images, architecture, customLogic }) {
    try {
      const prompt = this.buildIOSCodePrompt(images, architecture, customLogic);
      const code = await this.generateWithOpenAI(prompt, images);
      
      const qualityScore = await this.evaluateCodeQuality({ code, framework: 'ios' });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code,
              qualityScore,
              framework: 'ios',
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`iOS code generation failed: ${error.message}`);
    }
  }

  async evaluateCodeQuality({ code, framework }) {
    try {
      const evaluationPrompt = this.buildEvaluationPrompt(code, framework);
      const evaluation = await this.generateWithOpenAI(evaluationPrompt);
      
      // Parse evaluation results
      const qualityMetrics = this.parseQualityMetrics(evaluation);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(qualityMetrics)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Code quality evaluation failed: ${error.message}`);
    }
  }

  async generateComponentAnalysis({ code, framework }) {
    try {
      const analysisPrompt = this.buildComponentAnalysisPrompt(code, framework);
      const analysis = await this.generateWithOpenAI(analysisPrompt);
      
      // Save analysis to markdown file
      const analysisPath = path.join(__dirname, '../analysis', `component-analysis-${Date.now()}.md`);
      await fs.ensureDir(path.dirname(analysisPath));
      await fs.writeFile(analysisPath, analysis);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              analysis,
              filePath: analysisPath,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Component analysis generation failed: ${error.message}`);
    }
  }

  buildWebCodePrompt(images, framework, styling, architecture, customLogic) {
    return `
Generate pixel-perfect ${framework} code for the provided UI screens.

Requirements:
- Framework: ${framework}
- Styling: ${styling}
- Architecture: ${architecture}
- Custom Logic: ${customLogic || 'None'}

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

  buildAndroidCodePrompt(images, architecture, customLogic) {
    return `
Generate pixel-perfect Android (Kotlin/Java) code for the provided UI screens.

Requirements:
- Architecture: ${architecture}
- Custom Logic: ${customLogic || 'None'}

Instructions:
1. Use modern Android development practices
2. Implement Material Design principles
3. Include proper error handling
4. Add comprehensive comments
5. Ensure accessibility compliance
6. Generate complete, production-ready code

Generate complete Android project structure with all necessary files.
    `;
  }

  buildIOSCodePrompt(images, architecture, customLogic) {
    return `
Generate pixel-perfect iOS (Swift) code for the provided UI screens.

Requirements:
- Architecture: ${architecture}
- Custom Logic: ${customLogic || 'None'}

Instructions:
1. Use modern iOS development practices
2. Implement Human Interface Guidelines
3. Include proper error handling
4. Add comprehensive comments
5. Ensure accessibility compliance
6. Generate complete, production-ready code

Generate complete iOS project structure with all necessary files.
    `;
  }

  buildEvaluationPrompt(code, framework) {
    return `
Evaluate the quality of the following ${framework} code:

${code}

Provide a detailed evaluation covering:
1. Code Quality (1-10)
2. Performance (1-10)
3. Accessibility (1-10)
4. Best Practices (1-10)
5. Security (1-10)
6. Maintainability (1-10)
7. Overall Score (1-10)
8. Specific Issues Found
9. Recommendations for Improvement

Return the evaluation as JSON format.
    `;
  }

  buildComponentAnalysisPrompt(code, framework) {
    return `
Analyze the following ${framework} code and generate a comprehensive component analysis:

${code}

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
  }

  async generateWithOpenAI(prompt, images = []) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert software developer specializing in pixel-perfect code generation. Generate production-ready, well-documented code.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...images.map(img => ({
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${img.data}` }
          }))
        ]
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 4000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  async generateWithGemini(prompt, images = []) {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || 'image/png'
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    return result.response.text();
  }

  async combineAndRefineCode(openaiCode, geminiCode, framework) {
    const refinementPrompt = `
Combine and refine the following two code generations for ${framework}:

OpenAI Generation:
${openaiCode}

Gemini Generation:
${geminiCode}

Create the best possible combined version that:
1. Takes the best parts from both
2. Eliminates any inconsistencies
3. Ensures pixel-perfect implementation
4. Follows ${framework} best practices
5. Is production-ready

Return only the refined code without explanations.
    `;

    return await this.generateWithOpenAI(refinementPrompt);
  }

  parseQualityMetrics(evaluation) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(evaluation);
      return parsed;
    } catch {
      // If not JSON, extract metrics using regex
      const metrics = {};
      const scoreRegex = /(\w+)\s*\(?\s*(\d+)\s*\/\s*10\)?/gi;
      let match;
      
      while ((match = scoreRegex.exec(evaluation)) !== null) {
        const [, metric, score] = match;
        metrics[metric.toLowerCase().replace(/\s+/g, '_')] = parseInt(score);
      }
      
      return metrics;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Server started successfully');
  }
}

export default PixelPerfectMCPServer; 