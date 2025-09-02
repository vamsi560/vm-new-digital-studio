import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const corsMiddleware = cors({
  origin: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173',
  credentials: true
});

export default async function handler(req, res) {
  // Handle CORS
  await new Promise((resolve) => corsMiddleware(req, res, resolve));

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, projectId } = req.query;

    switch (action) {
      case 'list':
        return await handleListProjects(req, res);
      
      case 'metadata':
        return await handleGetProjectMetadata(req, res, projectId);
      
      case 'download':
        return await handleDownloadProject(req, res, projectId);
      
      case 'delete':
        return await handleDeleteProject(req, res, projectId);
      
      default:
        return res.status(400).json({ error: 'Invalid action specified' });
    }

  } catch (error) {
    console.error('Projects API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

// List all projects
async function handleListProjects(req, res) {
  try {
    const projectsDir = path.join(__dirname, '../projects');
    await fs.ensureDir(projectsDir);
    
    const projects = await fs.readdir(projectsDir);
    const projectList = [];

    for (const project of projects) {
      const projectPath = path.join(projectsDir, project);
      const metadataPath = path.join(projectPath, 'metadata.json');
      
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath);
          projectList.push({
            id: project,
            ...metadata
          });
        } catch (error) {
          console.warn(`Failed to read metadata for project ${project}:`, error.message);
        }
      }
    }

    // Sort by timestamp (newest first)
    projectList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      projects: projectList,
      count: projectList.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Get project metadata
async function handleGetProjectMetadata(req, res, projectId) {
  try {
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const projectPath = path.join(__dirname, '../projects', projectId);
    const metadataPath = path.join(projectPath, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    const metadata = await fs.readJson(metadataPath);
    
    // Get additional project info
    const projectInfo = await getProjectInfo(projectPath);
    
    res.json({
      success: true,
      metadata: {
        ...metadata,
        ...projectInfo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get project metadata error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Download project as ZIP
async function handleDownloadProject(req, res, projectId) {
  try {
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
        timestamp: new Date().toISOString()
      });
    }

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
    
    await addDirectoryToZip(zip, projectPath, '');
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="project-${projectId}.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);

  } catch (error) {
    console.error('Download project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Delete project
async function handleDeleteProject(req, res, projectId) {
  try {
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const projectPath = path.join(__dirname, '../projects', projectId);
    
    if (!await fs.pathExists(projectPath)) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }

    // Delete project directory
    await fs.remove(projectPath);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      projectId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Utility Functions
async function getProjectInfo(projectPath) {
  try {
    const info = {
      fileCount: 0,
      totalSize: 0,
      lastModified: null
    };

    const files = await getAllFiles(projectPath);
    info.fileCount = files.length;

    for (const file of files) {
      const stat = await fs.stat(file);
      info.totalSize += stat.size;
      
      if (!info.lastModified || stat.mtime > info.lastModified) {
        info.lastModified = stat.mtime;
      }
    }

    return info;
  } catch (error) {
    console.warn('Failed to get project info:', error.message);
    return {
      fileCount: 0,
      totalSize: 0,
      lastModified: null
    };
  }
}

async function getAllFiles(dirPath) {
  const files = [];
  
  const items = await fs.readdir(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      const subFiles = await getAllFiles(itemPath);
      files.push(...subFiles);
    } else {
      files.push(itemPath);
    }
  }
  
  return files;
}

async function addDirectoryToZip(zip, dirPath, zipPath) {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await addDirectoryToZip(zip, filePath, path.join(zipPath, file));
    } else {
      const content = await fs.readFile(filePath);
      zip.file(path.join(zipPath, file), content);
    }
  }
} 