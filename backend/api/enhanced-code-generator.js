import PixelPerfectMCPServer from './mcp-server.js';
import HuggingFaceAI from './huggingface-ai.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedCodeGenerator {
  constructor() {
    this.mcpServer = new PixelPerfectMCPServer();
    this.huggingFaceAI = new HuggingFaceAI();
    this.initializeMCP();
  }

  async initializeMCP() {
    try {
      await this.mcpServer.start();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
    }
  }

  async generatePixelPerfectCode(images, options) {
    const {
      platform = 'web',
      framework = 'React',
      styling = 'Tailwind CSS',
      architecture = 'Component Based',
      customLogic = '',
      routing = ''
    } = options;

    try {
      // Validate inputs
      this.validateInputs(images, options);

      // Preprocess images for better analysis
      const processedImages = await this.preprocessImages(images);

      // Generate code based on platform
      let result;
      switch (platform.toLowerCase()) {
        case 'web':
          result = await this.generateWebCode(processedImages, {
            framework,
            styling,
            architecture,
            customLogic,
            routing
          });
          break;
        case 'android':
          result = await this.generateAndroidCode(processedImages, {
            architecture,
            customLogic
          });
          break;
        case 'ios':
          result = await this.generateIOSCode(processedImages, {
            architecture,
            customLogic
          });
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Generate component analysis
      const analysis = await this.generateComponentAnalysis(result.code, platform);

      // Save results
      const projectPath = await this.saveProject(result, analysis, platform);

      return {
        success: true,
        code: result.code,
        qualityScore: result.qualityScore,
        analysis: analysis,
        projectPath: projectPath,
        platform: platform,
        framework: framework,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Code generation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  validateInputs(images, options) {
    if (!images || images.length === 0) {
      throw new Error('No images provided for code generation');
    }

    if (!options.platform) {
      throw new Error('Platform must be specified (web, android, ios)');
    }

    // Validate image format and size
    images.forEach((image, index) => {
      if (!image.data || !image.mimeType) {
        throw new Error(`Invalid image data at index ${index}`);
      }
    });
  }

  async preprocessImages(images) {
    const processedImages = [];

    for (const image of images) {
      try {
        // Decode base64 image
        const buffer = Buffer.from(image.data, 'base64');
        
        // Basic image validation
        if (buffer.length === 0) {
          throw new Error('Empty image data');
        }

        processedImages.push({
          ...image,
          buffer: buffer,
          size: buffer.length
        });
      } catch (error) {
        console.warn(`Failed to process image: ${error.message}`);
      }
    }

    return processedImages;
  }

  async generateWebCode(images, options) {
    const { framework, styling, architecture, customLogic, routing } = options;

    const result = await this.mcpServer.server.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'generate_web_code',
        arguments: {
          images: images,
          framework: framework,
          styling: styling,
          architecture: architecture,
          customLogic: customLogic,
          routing: routing
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  async generateAndroidCode(images, options) {
    const { architecture, customLogic } = options;

    const result = await this.mcpServer.server.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'generate_android_code',
        arguments: {
          images: images,
          architecture: architecture,
          customLogic: customLogic
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  async generateIOSCode(images, options) {
    const { architecture, customLogic } = options;

    const result = await this.mcpServer.server.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'generate_ios_code',
        arguments: {
          images: images,
          architecture: architecture,
          customLogic: customLogic
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  async generateComponentAnalysis(code, platform) {
    const result = await this.mcpServer.server.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'generate_component_analysis',
        arguments: {
          code: code,
          framework: platform
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  async saveProject(result, analysis, platform) {
    const timestamp = Date.now();
    const projectDir = path.join(__dirname, '../projects', `${platform}-${timestamp}`);
    
    await fs.ensureDir(projectDir);

    // Save code files
    const codeDir = path.join(projectDir, 'src');
    await fs.ensureDir(codeDir);

    // Parse and save code files based on platform
    if (platform === 'web') {
      await this.saveWebProject(result.code, codeDir);
    } else if (platform === 'android') {
      await this.saveAndroidProject(result.code, codeDir);
    } else if (platform === 'ios') {
      await this.saveIOSProject(result.code, codeDir);
    }

    // Save analysis
    const analysisPath = path.join(projectDir, 'analysis.md');
    await fs.writeFile(analysisPath, analysis.analysis);

    // Save metadata
    const metadata = {
      platform: platform,
      qualityScore: result.qualityScore,
      timestamp: new Date().toISOString(),
      analysisPath: analysis.filePath
    };
    
    const metadataPath = path.join(projectDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return projectDir;
  }

  async saveWebProject(code, codeDir) {
    // Extract and save React/Vue/Angular components
    const components = this.extractWebComponents(code);
    
    for (const [filename, content] of Object.entries(components)) {
      const filePath = path.join(codeDir, filename);
      await fs.writeFile(filePath, content);
    }

    // Create package.json
    const packageJson = this.generateWebPackageJson();
    await fs.writeFile(path.join(codeDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  async saveAndroidProject(code, codeDir) {
    // Extract and save Android files
    const androidFiles = this.extractAndroidFiles(code);
    
    for (const [filepath, content] of Object.entries(androidFiles)) {
      const fullPath = path.join(codeDir, filepath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }
  }

  async saveIOSProject(code, codeDir) {
    // Extract and save iOS files
    const iosFiles = this.extractIOSFiles(code);
    
    for (const [filepath, content] of Object.entries(iosFiles)) {
      const fullPath = path.join(codeDir, filepath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }
  }

  extractWebComponents(code) {
    // Simple extraction - in production, use proper parsing
    const components = {};
    
    // Extract JSX/TSX files
    const jsxMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g);
    if (jsxMatches) {
      jsxMatches.forEach((match, index) => {
        const componentName = match.match(/function\s+(\w+)/)?.[1] || `Component${index}`;
        components[`${componentName}.jsx`] = match;
      });
    }

    return components;
  }

  extractAndroidFiles(code) {
    // Extract Android-specific files
    const files = {};
    
    // Extract Kotlin/Java files
    const kotlinMatches = code.match(/class\s+(\w+)[^{]*{[^}]*}/g);
    if (kotlinMatches) {
      kotlinMatches.forEach((match, index) => {
        const className = match.match(/class\s+(\w+)/)?.[1] || `Class${index}`;
        files[`app/src/main/java/com/example/app/${className}.kt`] = match;
      });
    }

    return files;
  }

  extractIOSFiles(code) {
    // Extract iOS-specific files
    const files = {};
    
    // Extract Swift files
    const swiftMatches = code.match(/class\s+(\w+)[^{]*{[^}]*}/g);
    if (swiftMatches) {
      swiftMatches.forEach((match, index) => {
        const className = match.match(/class\s+(\w+)/)?.[1] || `Class${index}`;
        files[`${className}.swift`] = match;
      });
    }

    return files;
  }

  generateWebPackageJson() {
    return {
      name: "pixel-perfect-web-app",
      version: "1.0.0",
      description: "Generated pixel-perfect web application",
      main: "index.js",
      scripts: {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1"
      },
      browserslist: {
        production: [">0.2%", "not dead", "not op_mini all"],
        development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
      }
    };
  }
}

export default EnhancedCodeGenerator; 