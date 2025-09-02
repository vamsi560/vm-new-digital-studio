import HuggingFaceAI from '../backend/api/huggingface-ai.js';

class UnifiedAPI {
  constructor() {
    this.huggingFaceAI = new HuggingFaceAI();
  }

  async handleRequest(req, res) {
    const { method, url } = req;
    
    try {
      // Route based on the original endpoint
      if (url.includes('/enhanced-api')) {
        return await this.enhancedAPI(req, res);
      } else if (url.includes('/unified-api')) {
        return await this.handleUnifiedAPI(req, res);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('Unified API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle the main unified API endpoint that frontend calls
  async handleUnifiedAPI(req, res) {
    try {
      const { action, ...data } = req.body || {};
      
      if (action === 'generate_pixel_perfect_code') {
        return await this.generatePixelPerfectCode(req, res);
      } else if (action === 'enhanced_api') {
        return await this.enhancedAPI(req, res);
      } else {
        return res.status(400).json({ error: 'Invalid action specified' });
      }
    } catch (error) {
      console.error('Unified API action failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate pixel perfect code (main functionality)
  async generatePixelPerfectCode(req, res) {
    try {
      // Handle form data for file uploads
      let images = [];
      let options = {};
      
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Parse form data manually for Vercel
        const formData = await this.parseFormData(req);
        images = formData.images || [];
        options = {
          platform: formData.platform || 'web',
          framework: formData.framework || 'React',
          styling: formData.styling || 'Tailwind CSS',
          architecture: formData.architecture || 'Component Based',
          customLogic: formData.customLogic || '',
          routing: formData.routing || '',
          includeAnalysis: formData.includeAnalysis === 'true',
          colorExtraction: formData.colorExtraction === 'true',
          pixelPerfect: formData.pixelPerfect === 'true'
        };
      } else {
        // Handle JSON data
        const { images: imgData, ...opts } = req.body;
        images = imgData || [];
        options = opts;
      }

      if (!images || images.length === 0) {
        // Generate sample code if no images
        const sampleCode = this.generateSampleCode(options.framework);
        return res.json({
          success: true,
          mainCode: sampleCode,
          analysis: {
            structure: 'Sample component generated',
            complexity: 'Low',
            reusability: 'High',
            recommendations: 'Upload images for custom generation'
          },
          projectId: `project-${Date.now()}`,
          platform: options.platform,
          framework: options.framework,
          timestamp: new Date().toISOString()
        });
      }

      // Generate code using Hugging Face AI
      const prompt = this.buildCodePrompt(images, options);
      const result = await this.huggingFaceAI.generateCode(prompt, options);

      const projectId = `project-${Date.now()}`;
      
      return res.json({
        success: true,
        mainCode: result.code,
        analysis: result.analysis || {
          structure: 'Generated component structure',
          complexity: 'Medium',
          reusability: 'High',
          recommendations: 'Generated using Hugging Face AI'
        },
        projectId,
        platform: options.platform,
        framework: options.framework,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Pixel perfect code generation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Enhanced API endpoint
  async enhancedAPI(req, res) {
    try {
      const { images, platform, framework, styling, architecture, customLogic, routing } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const prompt = `Generate ${platform} code using ${framework} and ${styling} with ${architecture} architecture.`;
      
      const result = await this.huggingFaceAI.generateCode(prompt, {
        platform,
        framework,
        styling,
        architecture,
        customLogic,
        routing
      });

      return res.json({
        success: true,
        code: result.code,
        model: result.model,
        api: 'Hugging Face AI',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Enhanced API failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Parse form data manually for Vercel
  async parseFormData(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const formData = {};
          const parts = body.split('&');
          parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value !== undefined) {
              if (key === 'images') {
                if (!formData.images) formData.images = [];
                formData.images.push(decodeURIComponent(value));
              } else {
                formData[key] = decodeURIComponent(value);
              }
            }
          });
          resolve(formData);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Generate sample code
  generateSampleCode(framework = 'React') {
    if (framework === 'React') {
      return `import React from 'react';

const SampleComponent = () => {
  return (
    <div className="sample-component">
      <h1>Sample React Component</h1>
      <p>This is a sample component. Upload images to generate custom code.</p>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Sample Button
      </button>
    </div>
  );
};

export default SampleComponent;`;
    }
    
    return `// Sample ${framework} component code`;
  }

  // Build code generation prompt
  buildCodePrompt(images, options) {
    const { platform, framework, styling, architecture, customLogic, routing } = options;
    
    return `Generate pixel-perfect ${framework} code for the provided UI screens.

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
6. Make it production-ready
7. Use ${styling} for styling
8. Follow ${architecture} architecture

Return only the complete component code without explanations.`;
  }
}

// Export for Vercel
export default async function handler(req, res) {
  const api = new UnifiedAPI();
  return await api.handleRequest(req, res);
} 