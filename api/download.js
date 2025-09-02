import JSZip from 'jszip';

class DownloadAPI {
  constructor() {
    this.zip = new JSZip();
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

  // Download ZIP with complete project structure
  async downloadZip(req, res) {
    try {
      const { projectData, projectName, framework, platform } = req.body;

      if (!projectData || !projectName) {
        return res.status(400).json({ error: 'Project data and name are required' });
      }

      console.log('Creating project ZIP:', { projectName, framework, platform });

      // Create complete project structure
      await this.createProjectStructure(projectData, projectName, framework, platform);

      // Generate ZIP file
      const zipBuffer = await this.zip.generateAsync({ type: 'nodebuffer' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);

      res.send(zipBuffer);

    } catch (error) {
      console.error('ZIP download failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Download project files
  async downloadProject(req, res) {
    try {
      const { projectData, projectName } = req.body;

      if (!projectData || !projectName) {
        return res.status(400).json({ error: 'Project data and name are required' });
      }

      console.log('Downloading project:', { projectName });

      // Create project ZIP
      await this.createProjectStructure(projectData, projectName, 'React', 'web');
      const zipBuffer = await this.zip.generateAsync({ type: 'nodebuffer' });

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);

      res.send(zipBuffer);

    } catch (error) {
      console.error('Project download failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create complete project structure
  async createProjectStructure(projectData, projectName, framework, platform) {
    const cleanName = projectName.toLowerCase().replace(/\s+/g, '-');
    
    // Add package.json
    const packageJson = this.createPackageJson(cleanName, framework);
    this.zip.file("package.json", JSON.stringify(packageJson, null, 2));

    // Add README.md
    const readme = this.createReadme(projectName, framework, platform);
    this.zip.file("README.md", readme);

    // Add index.html
    const indexHtml = this.createIndexHtml(projectName);
    this.zip.file("index.html", indexHtml);

    // Add main.jsx
    const mainJsx = this.createMainJsx();
    this.zip.file("src/main.jsx", mainJsx);

    // Add index.css
    const indexCss = this.createIndexCss();
    this.zip.file("src/index.css", indexCss);

    // Add App.jsx (main component)
    if (projectData.mainCode) {
      this.zip.file("src/App.jsx", projectData.mainCode);
    } else {
      // Fallback App.jsx
      const fallbackApp = this.createFallbackApp();
      this.zip.file("src/App.jsx", fallbackApp);
    }

    // Add Vite config
    const viteConfig = this.createViteConfig();
    this.zip.file("vite.config.js", viteConfig);

    // Add Tailwind config if using Tailwind
    if (framework === 'React' && projectData.styling === 'Tailwind CSS') {
      const tailwindConfig = this.createTailwindConfig();
      this.zip.file("tailwind.config.js", tailwindConfig);
      
      const postcssConfig = this.createPostcssConfig();
      this.zip.file("postcss.config.js", postcssConfig);
    }

    // Add .gitignore
    const gitignore = this.createGitignore();
    this.zip.file(".gitignore", gitignore);

    // Add additional components if available
    if (projectData.additionalComponents) {
      Object.entries(projectData.additionalComponents).forEach(([filename, code]) => {
        this.zip.file(`src/components/${filename}`, code);
      });
    }
  }

  // Create package.json
  createPackageJson(projectName, framework) {
    const baseDeps = {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    };

    const devDeps = {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "vite": "^4.0.0",
      "@vitejs/plugin-react": "^4.0.0"
    };

    // Add Tailwind if using Tailwind CSS
    if (framework === 'React') {
      baseDeps["tailwindcss"] = "^3.3.0";
      devDeps["autoprefixer"] = "^10.4.0";
      devDeps["postcss"] = "^8.4.0";
    }

    return {
      name: projectName,
      version: "1.0.0",
      private: true,
      dependencies: baseDeps,
      devDependencies: devDeps,
      scripts: {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
      }
    };
  }

  // Create README.md
  createReadme(projectName, framework, platform) {
    return `# ${projectName}

This project was generated using Digital Studio VM.

## Features
- ${framework} framework
- ${platform} platform
- Modern development setup
- Responsive design

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

## Project Structure
- \`src/\` - Source code
- \`public/\` - Static assets
- \`package.json\` - Dependencies and scripts

Generated on: ${new Date().toISOString()}
`;
  }

  // Create index.html
  createIndexHtml(projectName) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
  }

  // Create main.jsx
  createMainJsx() {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
  }

  // Create index.css
  createIndexCss() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}`;
  }

  // Create fallback App.jsx
  createFallbackApp() {
    return `import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to ${projectName}</h1>
        <p className="text-xl">Your React app is ready!</p>
        <p className="text-sm mt-2 opacity-75">Generated with Digital Studio VM</p>
      </div>
    </div>
  );
};

export default App;`;
  }

  // Create Vite config
  createViteConfig() {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
  }

  // Create Tailwind config
  createTailwindConfig() {
    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  }

  // Create PostCSS config
  createPostcssConfig() {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  }

  // Create .gitignore
  createGitignore() {
    return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;
  }
}

// Export for Vercel
export default async function handler(req, res) {
  const api = new DownloadAPI();
  return await api.handleRequest(req, res);
} 