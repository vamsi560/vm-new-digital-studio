import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DownloadAPI {
  constructor() {
    this.projectsDir = path.join(__dirname, '../projects');
    this.downloadsDir = path.join(__dirname, '../downloads');
  }

  async handleRequest(req, res) {
    const { method, url } = req;
    
    try {
      // Route based on the original endpoint
      if (url.includes('/download-zip')) {
        return await this.downloadZip(req, res);
      } else if (url.includes('/download-project')) {
        return await this.downloadProject(req, res);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('Download API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Download project as ZIP
  async downloadZip(req, res) {
    try {
      const { projectId, projectName } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const projectPath = path.join(this.projectsDir, projectId);
      
      // Check if project exists
      if (!await fs.pathExists(projectPath)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Create ZIP file
      const zipPath = await this.createProjectZip(projectPath, projectName || projectId);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${projectName || projectId}.zip"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // Clean up ZIP file after streaming
      fileStream.on('end', () => {
        fs.remove(zipPath).catch(console.error);
      });

    } catch (error) {
      console.error('ZIP download failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Download specific project
  async downloadProject(req, res) {
    try {
      const { projectId } = req.params || req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const projectPath = path.join(this.projectsDir, projectId);
      
      // Check if project exists
      if (!await fs.pathExists(projectPath)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get project metadata
      const metadataPath = path.join(projectPath, 'metadata.json');
      let metadata = {};
      
      if (await fs.pathExists(metadataPath)) {
        metadata = await fs.readJson(metadataPath);
      }

      // Create ZIP file
      const zipPath = await this.createProjectZip(projectPath, projectId);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${projectId}.zip"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // Clean up ZIP file after streaming
      fileStream.on('end', () => {
        fs.remove(zipPath).catch(console.error);
      });

    } catch (error) {
      console.error('Project download failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create project ZIP file
  async createProjectZip(projectPath, projectName) {
    try {
      // Ensure downloads directory exists
      await fs.ensureDir(this.downloadsDir);
      
      const zipPath = path.join(this.downloadsDir, `${projectName}.zip`);
      
      // Create ZIP using Node.js built-in modules
      const archiver = await import('archiver');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver.default('zip', { zlib: { level: 9 } });
      
      return new Promise((resolve, reject) => {
        output.on('close', () => resolve(zipPath));
        archive.on('error', reject);
        
        archive.pipe(output);
        archive.directory(projectPath, false);
        archive.finalize();
      });

    } catch (error) {
      // Fallback to simple file copy if archiver fails
      console.warn('Archiver failed, using fallback method:', error);
      return await this.createSimpleArchive(projectPath, projectName);
    }
  }

  // Fallback archive creation
  async createSimpleArchive(projectPath, projectName) {
    try {
      const archivePath = path.join(this.downloadsDir, `${projectName}.tar.gz`);
      
      // Use tar command if available
      const { exec } = await import('child_process');
      const util = await import('util');
      const execAsync = util.promisify(exec);
      
      try {
        await execAsync(`tar -czf "${archivePath}" -C "${path.dirname(projectPath)}" "${path.basename(projectPath)}"`);
        return archivePath;
      } catch (tarError) {
        // If tar fails, just copy the directory
        const copyPath = path.join(this.downloadsDir, projectName);
        await fs.copy(projectPath, copyPath);
        return copyPath;
      }
    } catch (error) {
      console.error('Fallback archive creation failed:', error);
      throw new Error('Failed to create project archive');
    }
  }

  // Get project file list
  async getProjectFiles(projectPath) {
    try {
      const files = [];
      
      const walkDir = async (dir, relativePath = '') => {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativeItemPath = path.join(relativePath, item);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            files.push({
              type: 'directory',
              path: relativeItemPath,
              size: 0
            });
            await walkDir(fullPath, relativeItemPath);
          } else {
            files.push({
              type: 'file',
              path: relativeItemPath,
              size: stat.size
            });
          }
        }
      };
      
      await walkDir(projectPath);
      return files;
      
    } catch (error) {
      console.error('Failed to get project files:', error);
      return [];
    }
  }

  // Get project size
  async getProjectSize(projectPath) {
    try {
      const files = await this.getProjectFiles(projectPath);
      return files.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      console.error('Failed to get project size:', error);
      return 0;
    }
  }

  // Validate project structure
  async validateProject(projectPath) {
    try {
      const requiredFiles = ['package.json', 'README.md'];
      const missingFiles = [];
      
      for (const file of requiredFiles) {
        if (!await fs.pathExists(path.join(projectPath, file))) {
          missingFiles.push(file);
        }
      }
      
      return {
        valid: missingFiles.length === 0,
        missingFiles,
        totalFiles: (await this.getProjectFiles(projectPath)).length,
        size: await this.getProjectSize(projectPath)
      };
    } catch (error) {
      return {
        valid: false,
        missingFiles: ['Unknown'],
        totalFiles: 0,
        size: 0,
        error: error.message
      };
    }
  }
}

// Export for Vercel
export default async function handler(req, res) {
  const api = new DownloadAPI();
  return await api.handleRequest(req, res);
} 