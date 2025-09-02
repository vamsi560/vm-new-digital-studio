import axios from 'axios';
import PixelPerfectMCPServer from './mcp-server.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedFigmaIntegration {
  constructor() {
    this.mcpServer = new PixelPerfectMCPServer();
    this.figmaToken = process.env.FIGMA_API_TOKEN || "figd_00LP2oP9Fqfd0PY0alm9L9tsjlC85pn8m5KEeXMn";
    this.baseUrl = 'https://api.figma.com/v1';
  }

  async importFromFigma(figmaUrl, options = {}) {
    try {
      const {
        platform = 'web',
        framework = 'React',
        styling = 'Tailwind CSS',
        architecture = 'Component Based',
        customLogic = '',
        routing = ''
      } = options;

      // Extract file key from URL
      const fileKey = this.extractFileKey(figmaUrl);
      if (!fileKey) {
        throw new Error('Invalid Figma URL format');
      }

      // Get file information
      const fileInfo = await this.getFigmaFile(fileKey);
      
      // Extract frames and components
      const frames = this.extractFrames(fileInfo.document);
      const components = this.extractComponents(fileInfo.document);
      
      // Get image URLs
      const imageUrls = await this.getImageUrls(fileKey, frames);
      
      // Download and process images
      const processedImages = await this.downloadAndProcessImages(imageUrls);
      
      // Generate pixel-perfect code using MCP
      const codeResult = await this.generateCodeFromFigma(processedImages, {
        platform,
        framework,
        styling,
        architecture,
        customLogic,
        routing,
        figmaData: {
          fileKey,
          frames,
          components,
          fileInfo
        }
      });

      // Generate component analysis
      const analysis = await this.generateComponentAnalysis(codeResult.code, platform, {
        figmaData: { frames, components }
      });

      // Save project
      const projectPath = await this.saveFigmaProject(codeResult, analysis, {
        platform,
        framework,
        figmaUrl,
        fileKey
      });

      return {
        success: true,
        code: codeResult.code,
        qualityScore: codeResult.qualityScore,
        analysis: analysis,
        projectPath: projectPath,
        figmaData: {
          fileKey,
          frames: frames.length,
          components: components.length,
          images: processedImages.length
        },
        platform: platform,
        framework: framework,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Figma import failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  extractFileKey(figmaUrl) {
    // Support multiple Figma URL formats
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = figmaUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async getFigmaFile(fileKey) {
    const headers = {
      'X-Figma-Token': this.figmaToken,
      'User-Agent': 'Digital-Studio-VM/1.0',
      'Accept': 'application/json'
    };

    const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, { headers });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
    }

    return response.data;
  }

  extractFrames(document) {
    const frames = [];
    
    const traverse = (node, parentPath = '') => {
      if (node.type === 'FRAME' || node.type === 'COMPONENT') {
        frames.push({
          id: node.id,
          name: node.name,
          type: node.type,
          path: parentPath,
          absoluteBoundingBox: node.absoluteBoundingBox,
          fills: node.fills,
          strokes: node.strokes,
          effects: node.effects,
          constraints: node.constraints,
          layoutMode: node.layoutMode,
          primaryAxisSizingMode: node.primaryAxisSizingMode,
          counterAxisSizingMode: node.counterAxisSizingMode,
          paddingLeft: node.paddingLeft,
          paddingRight: node.paddingRight,
          paddingTop: node.paddingTop,
          paddingBottom: node.paddingBottom,
          itemSpacing: node.itemSpacing
        });
      }

      if (node.children) {
        const newPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        node.children.forEach(child => traverse(child, newPath));
      }
    };

    traverse(document);
    return frames;
  }

  extractComponents(document) {
    const components = [];
    
    const traverse = (node, parentPath = '') => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          path: parentPath,
          description: node.description,
          documentationLinks: node.documentationLinks,
          key: node.key,
          remote: node.remote,
          absoluteBoundingBox: node.absoluteBoundingBox,
          fills: node.fills,
          strokes: node.strokes,
          effects: node.effects,
          constraints: node.constraints
        });
      }

      if (node.children) {
        const newPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        node.children.forEach(child => traverse(child, newPath));
      }
    };

    traverse(document);
    return components;
  }

  async getImageUrls(fileKey, frames) {
    const frameIds = frames.map(frame => frame.id).join(',');
    
    const headers = {
      'X-Figma-Token': this.figmaToken,
      'User-Agent': 'Digital-Studio-VM/1.0',
      'Accept': 'application/json'
    };

    const response = await axios.get(
      `${this.baseUrl}/images/${fileKey}?ids=${frameIds}&format=png&scale=2`,
      { headers }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to get image URLs: ${response.statusText}`);
    }

    return response.data.images || {};
  }

  async downloadAndProcessImages(imageUrls) {
    const processedImages = [];

    for (const [frameId, imageUrl] of Object.entries(imageUrls)) {
      try {
        // Download image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        // Process image
        const processedImage = await this.processImage(imageResponse.data, frameId);
        processedImages.push(processedImage);

      } catch (error) {
        console.warn(`Failed to download image for frame ${frameId}:`, error.message);
      }
    }

    return processedImages;
  }

  async processImage(imageBuffer, frameId) {
    // Convert to base64
    const base64Data = Buffer.from(imageBuffer, 'binary').toString('base64');
    
    // Get image metadata
    const metadata = await this.extractImageMetadata(imageBuffer);
    
    return {
      id: frameId,
      data: base64Data,
      mimeType: 'image/png',
      metadata: metadata,
      timestamp: new Date().toISOString()
    };
  }

  async extractImageMetadata(imageBuffer) {
    // Basic image metadata extraction
    // In production, use a proper image processing library
    return {
      size: imageBuffer.length,
      format: 'PNG',
      dimensions: 'Unknown' // Would need proper image processing to get dimensions
    };
  }

  async generateCodeFromFigma(images, options) {
    const {
      platform,
      framework,
      styling,
      architecture,
      customLogic,
      routing,
      figmaData
    } = options;

    // Build enhanced prompt with Figma context
    const prompt = this.buildFigmaCodePrompt(images, options);
    
    // Generate code using MCP server
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
          routing: routing,
          figmaContext: figmaData
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  buildFigmaCodePrompt(images, options) {
    const {
      platform,
      framework,
      styling,
      architecture,
      customLogic,
      routing,
      figmaData
    } = options;

    return `
Generate pixel-perfect ${framework} code from the provided Figma design screens.

Figma Context:
- File Key: ${figmaData.fileKey}
- Frames: ${figmaData.frames.length}
- Components: ${figmaData.components.length}
- Images: ${images.length}

Requirements:
- Platform: ${platform}
- Framework: ${framework}
- Styling: ${styling}
- Architecture: ${architecture}
- Custom Logic: ${customLogic || 'None'}
- Routing: ${routing || 'None'}

Instructions:
1. Analyze the Figma design screens carefully
2. Extract exact colors, fonts, spacing, and layout
3. Generate pixel-perfect implementation
4. Follow ${framework} best practices
5. Implement responsive design
6. Ensure accessibility compliance
7. Include proper error handling
8. Add comprehensive documentation

Generate complete, production-ready code that matches the Figma design exactly.
    `;
  }

  async generateComponentAnalysis(code, platform, options) {
    const { figmaData } = options;

    const result = await this.mcpServer.server.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'generate_component_analysis',
        arguments: {
          code: code,
          framework: platform,
          figmaContext: figmaData
        }
      }
    });

    return JSON.parse(result.result.content[0].text);
  }

  async saveFigmaProject(codeResult, analysis, options) {
    const {
      platform,
      framework,
      figmaUrl,
      fileKey
    } = options;

    const timestamp = Date.now();
    const projectDir = path.join(__dirname, '../projects', `figma-${platform}-${timestamp}`);
    
    await fs.ensureDir(projectDir);

    // Save code files
    const codeDir = path.join(projectDir, 'src');
    await fs.ensureDir(codeDir);

    // Parse and save code files
    if (platform === 'web') {
      await this.saveWebProject(codeResult.code, codeDir, framework);
    } else if (platform === 'android') {
      await this.saveAndroidProject(codeResult.code, codeDir);
    } else if (platform === 'ios') {
      await this.saveIOSProject(codeResult.code, codeDir);
    }

    // Save Figma metadata
    const figmaMetadata = {
      figmaUrl,
      fileKey,
      platform,
      framework,
      timestamp: new Date().toISOString()
    };
    
    const figmaMetadataPath = path.join(projectDir, 'figma-metadata.json');
    await fs.writeFile(figmaMetadataPath, JSON.stringify(figmaMetadata, null, 2));

    // Save analysis
    const analysisPath = path.join(projectDir, 'analysis.md');
    await fs.writeFile(analysisPath, analysis.analysis);

    // Save project metadata
    const metadata = {
      platform: platform,
      framework: framework,
      qualityScore: codeResult.qualityScore,
      figmaUrl: figmaUrl,
      fileKey: fileKey,
      timestamp: new Date().toISOString()
    };
    
    const metadataPath = path.join(projectDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return projectDir;
  }

  async saveWebProject(code, codeDir, framework) {
    // Extract and save components
    const components = this.extractWebComponents(code, framework);
    
    for (const [filename, content] of Object.entries(components)) {
      const filePath = path.join(codeDir, filename);
      await fs.writeFile(filePath, content);
    }

    // Create framework-specific configuration files
    await this.createWebConfigFiles(codeDir, framework);
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

  extractWebComponents(code, framework) {
    const components = {};
    
    // Extract components based on framework
    if (framework.toLowerCase() === 'react') {
      const reactMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g);
      if (reactMatches) {
        reactMatches.forEach((match, index) => {
          const componentName = match.match(/function\s+(\w+)/)?.[1] || `Component${index}`;
          components[`${componentName}.jsx`] = match;
        });
      }
    } else if (framework.toLowerCase() === 'vue') {
      const vueMatches = code.match(/<template>[\s\S]*?<\/template>/g);
      if (vueMatches) {
        vueMatches.forEach((match, index) => {
          components[`Component${index}.vue`] = match;
        });
      }
    }

    return components;
  }

  extractAndroidFiles(code) {
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

  async createWebConfigFiles(codeDir, framework) {
    if (framework.toLowerCase() === 'react') {
      const packageJson = {
        name: "figma-react-app",
        version: "1.0.0",
        description: "Generated React app from Figma design",
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
        }
      };
      
      await fs.writeFile(path.join(codeDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    }
  }
}

export default EnhancedFigmaIntegration; 