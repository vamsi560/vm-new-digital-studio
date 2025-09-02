import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

import EnhancedCodeGenerator from './enhanced-code-generator.js';
import EvaluatorAgents from './evaluator-agents.js';
import EnhancedFigmaIntegration from './enhanced-figma-integration.js';
import PixelPerfectMCPServer from './mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedAPI {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    // Initialize components
    this.codeGenerator = new EnhancedCodeGenerator();
    this.evaluatorAgents = new EvaluatorAgents();
    this.figmaIntegration = new EnhancedFigmaIntegration();
    this.mcpServer = new PixelPerfectMCPServer();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeMCP();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // File upload middleware
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Max 10 files
      }
    });

    // Static file serving
    this.app.use('/projects', express.static(path.join(__dirname, '../projects')));
    this.app.use('/evaluations', express.static(path.join(__dirname, '../evaluations')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          mcpServer: 'running',
          codeGenerator: 'ready',
          evaluatorAgents: 'ready',
          figmaIntegration: 'ready'
        }
      });
    });

    // Enhanced code generation endpoints
    this.app.post('/api/generate-pixel-perfect-code', this.upload.array('images', 10), async (req, res) => {
      try {
        const images = req.files?.map(file => ({
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype,
          originalname: file.originalname
        })) || [];

        const options = {
          platform: req.body.platform || 'web',
          framework: req.body.framework || 'React',
          styling: req.body.styling || 'Tailwind CSS',
          architecture: req.body.architecture || 'Component Based',
          customLogic: req.body.customLogic || '',
          routing: req.body.routing || ''
        };

        const result = await this.codeGenerator.generatePixelPerfectCode(images, options);
        res.json(result);

      } catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Enhanced Figma integration
    this.app.post('/api/import-figma-enhanced', async (req, res) => {
      try {
        const { figmaUrl, ...options } = req.body;
        
        if (!figmaUrl) {
          return res.status(400).json({
            success: false,
            error: 'Figma URL is required',
            timestamp: new Date().toISOString()
          });
        }

        const result = await this.figmaIntegration.importFromFigma(figmaUrl, options);
        res.json(result);

      } catch (error) {
        console.error('Figma import error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Code evaluation endpoint
    this.app.post('/api/evaluate-code', async (req, res) => {
      try {
        const { code, framework, platform } = req.body;
        
        if (!code) {
          return res.status(400).json({
            success: false,
            error: 'Code is required for evaluation',
            timestamp: new Date().toISOString()
          });
        }

        const result = await this.evaluatorAgents.evaluateCodeQuality(code, framework, platform);
        res.json(result);

      } catch (error) {
        console.error('Code evaluation error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Component analysis generation
    this.app.post('/api/generate-component-analysis', async (req, res) => {
      try {
        const { code, framework, platform, figmaData } = req.body;
        
        if (!code) {
          return res.status(400).json({
            success: false,
            error: 'Code is required for analysis',
            timestamp: new Date().toISOString()
          });
        }

        const result = await this.codeGenerator.generateComponentAnalysis(code, framework, {
          figmaData: figmaData || null
        });
        res.json(result);

      } catch (error) {
        console.error('Component analysis error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Project download endpoint
    this.app.get('/api/download-project/:projectId', async (req, res) => {
      try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, '../projects', projectId);
        
        if (!await fs.pathExists(projectPath)) {
          return res.status(404).json({
            success: false,
            error: 'Project not found',
            timestamp: new Date().toISOString()
          });
        }

        // Create zip file
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        await this.addDirectoryToZip(zip, projectPath, '');
        
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="project-${projectId}.zip"`);
        res.send(zipBuffer);

      } catch (error) {
        console.error('Project download error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get project metadata
    this.app.get('/api/project/:projectId', async (req, res) => {
      try {
        const { projectId } = req.params;
        const projectPath = path.join(__dirname, '../projects', projectId);
        const metadataPath = path.join(projectPath, 'metadata.json');
        
        if (!await fs.pathExists(metadataPath)) {
          return res.status(404).json({
            success: false,
            error: 'Project metadata not found',
            timestamp: new Date().toISOString()
          });
        }

        const metadata = await fs.readJson(metadataPath);
        res.json({
          success: true,
          metadata: metadata,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Project metadata error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // List all projects
    this.app.get('/api/projects', async (req, res) => {
      try {
        const projectsDir = path.join(__dirname, '../projects');
        await fs.ensureDir(projectsDir);
        
        const projects = await fs.readdir(projectsDir);
        const projectList = [];

        for (const project of projects) {
          const projectPath = path.join(projectsDir, project);
          const metadataPath = path.join(projectPath, 'metadata.json');
          
          if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);
            projectList.push({
              id: project,
              ...metadata
            });
          }
        }

        res.json({
          success: true,
          projects: projectList,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Projects list error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  async initializeMCP() {
    try {
      await this.mcpServer.start();
      console.log('MCP Server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
    }
  }

  async addDirectoryToZip(zip, dirPath, zipPath) {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await this.addDirectoryToZip(zip, filePath, path.join(zipPath, file));
      } else {
        const content = await fs.readFile(filePath);
        zip.file(path.join(zipPath, file), content);
      }
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Enhanced Digital Studio API running on port ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
      console.log(`🔧 MCP Server: Running`);
      console.log(`🎨 Code Generator: Ready`);
      console.log(`🔍 Evaluator Agents: Ready`);
      console.log(`🎯 Figma Integration: Ready`);
    });
  }
}

export default EnhancedAPI; 