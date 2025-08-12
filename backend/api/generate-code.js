// backend/api/generate-code.js (Enhanced Version)
import formidable from 'formidable';
import fs from 'fs/promises';
import { callMcpServer, parseJsonWithCorrection } from './utils/shared.js';

// Helper: Convert uploaded file to GenerativePart
async function fileToGenerativePart(file) {
  const fileData = await fs.readFile(file.filepath);
  return {
    inlineData: {
      data: Buffer.from(fileData).toString('base64'),
      mimeType: file.mimetype,
    },
  };
}

// Helper: Generate preview HTML for React component
function generateComponentPreview(componentCode, componentName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .error-boundary { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }

            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }

            render() {
                if (this.state.hasError) {
                    return (
                        <div className="error-boundary">
                            <h3>❌ Component Error</h3>
                            <p><strong>Error:</strong> {this.state.error?.message}</p>
                        </div>
                    );
                }
                return this.props.children;
            }
        }

        ${componentCode}

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <ErrorBoundary>
                <${componentName} />
            </ErrorBoundary>
        );
    </script>
</body>
</html>`;
}

// Helper: Extract component name from React code
function extractComponentName(code) {
  const matches = [
    /export\s+default\s+function\s+(\w+)/,
    /function\s+(\w+)/,
    /const\s+(\w+)\s*=/,
    /export\s+default\s+(\w+)/
  ];
  
  for (const regex of matches) {
    const match = code.match(regex);
    if (match) return match[1];
  }
  
  return 'App';
}

// Helper: Generate preview data for React files
function generatePreviewData(files) {
  const previews = {};
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.jsx') || (path.endsWith('.js') && path.includes('src/'))) {
      const componentName = extractComponentName(content);
      previews[path] = {
        componentName,
        previewHtml: generateComponentPreview(content, componentName),
        isPreviewable: true
      };
    }
  });
  
  return previews;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const uploadedScreens = files.screens || [];
    
    if (uploadedScreens.length === 0) {
      return res.status(400).json({ error: 'No screens were uploaded.' });
    }

    // Enhanced prompt for better React generation with preview support
    const prompt = `You are an expert React developer. Given the following screen mockups, generate a complete, production-ready React app using Tailwind CSS and TypeScript.

Requirements:
- Use a scalable file/folder structure
- Extract and reuse components where possible
- Add PropTypes, JSDoc comments, and TypeScript types to all components
- Ensure all imports are correct
- All code should be valid and ready to run
- Create components that are easily previewable in isolation
- Use modern React patterns (hooks, functional components)
- Make components responsive and strictly accessible (WCAG 2.1 AA)
- Prefer TypeScript (.tsx/.ts) files where possible

IMPORTANT: The package.json MUST include ALL necessary dependencies:
- react, react-dom, react-scripts (core React)
- react-router-dom (for navigation if multiple screens)
- react-syntax-highlighter, react-live (for code display)
- js-cookie, axios (for API calls and cookies)
- All necessary dev dependencies including TypeScript types

Generate the following structure:
- package.json with ALL required dependencies (this is critical!)
- public/index.html
- src/index.tsx (entry point)
- src/index.css (Tailwind imports)
- src/App.tsx (main app component)
- src/components/ (reusable components)
- src/pages/ (page components if multiple screens)
- tailwind.config.js
- postcss.config.js
- README.md

Respond with a single JSON object: { manifest, files: { path: content, ... } }`;

    // Convert all uploaded files to the format the AI model expects
    const imageParts = await Promise.all(uploadedScreens.map(fileToGenerativePart));

    let aiResponse;
    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
      try {
        aiResponse = await callMcpServer(prompt, imageParts, true);
        break;
      } catch (err) {
        if (err && err.message && err.message.includes('503')) {
          retries++;
          if (retries === maxRetries) throw err;
          await new Promise(r => setTimeout(r, 1000 * retries)); // Exponential backoff
        } else {
          throw err;
        }
      }
    }
    
    // Clean AI response before parsing (robust)
    let cleanedResponse = aiResponse
      .replace(/```[a-z]*|```/gi, '')
      .replace(/^[^\{]*?(\{[\s\S]*\})[^\}]*$/m, '$1') // Try to extract JSON object
      .trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (err) {
      console.error('Raw AI response:', aiResponse); // Log for debugging
      console.error('Cleaned response:', cleanedResponse);
      parsed = await parseJsonWithCorrection(cleanedResponse, prompt, imageParts);
    }
    
    let { files: generatedFiles, manifest } = parsed;
    if (!generatedFiles || typeof generatedFiles !== 'object') generatedFiles = {};

    // Validate and ensure package.json has required dependencies
    const validatePackageJson = (packageJsonContent) => {
      try {
        const pkg = JSON.parse(packageJsonContent);
        const requiredDeps = ['react', 'react-dom'];
        const missingDeps = requiredDeps.filter(dep => !pkg.dependencies || !pkg.dependencies[dep]);
        
        if (missingDeps.length > 0) {
          console.warn(`Generated package.json missing required dependencies: ${missingDeps.join(', ')}`);
          return false;
        }
        return true;
      } catch (error) {
        console.error('Invalid package.json format:', error);
        return false;
      }
    };

    // Ensure minimum required files exist
    if (!generatedFiles['package.json'] || !validatePackageJson(generatedFiles['package.json'])) {
      // If package.json exists but is missing dependencies, enhance it
      if (generatedFiles['package.json'] && validatePackageJson(generatedFiles['package.json']) === false) {
        try {
          const existingPkg = JSON.parse(generatedFiles['package.json']);
          const enhancedPkg = {
            ...existingPkg,
            dependencies: {
              ...existingPkg.dependencies,
              react: existingPkg.dependencies?.react || '^18.2.0',
              'react-dom': existingPkg.dependencies?.['react-dom'] || '^18.2.0',
              'react-scripts': existingPkg.dependencies?.['react-scripts'] || '5.0.1',
              'react-router-dom': existingPkg.dependencies?.['react-router-dom'] || '^6.8.0',
              'react-syntax-highlighter': existingPkg.dependencies?.['react-syntax-highlighter'] || '^15.5.0',
              'react-live': existingPkg.dependencies?.['react-live'] || '^4.0.3',
              'js-cookie': existingPkg.dependencies?.['js-cookie'] || '^3.0.5',
              'axios': existingPkg.dependencies?.axios || '^1.6.0'
            },
            devDependencies: {
              ...existingPkg.devDependencies,
              tailwindcss: existingPkg.devDependencies?.tailwindcss || '^3.4.1',
              postcss: existingPkg.devDependencies?.postcss || '^8.4.38',
              autoprefixer: existingPkg.devDependencies?.autoprefixer || '^10.4.19',
              '@types/react': existingPkg.devDependencies?.['@types/react'] || '^18.2.0',
              '@types/react-dom': existingPkg.devDependencies?.['@types/react-dom'] || '^18.2.0',
              '@types/react-syntax-highlighter': existingPkg.devDependencies?.['@types/react-syntax-highlighter'] || '^15.5.0',
              'typescript': existingPkg.devDependencies?.typescript || '^5.0.0',
              '@types/node': existingPkg.devDependencies?.['@types/node'] || '^20.0.0'
            }
          };
          
          // Ensure scripts exist
          if (!enhancedPkg.scripts) {
            enhancedPkg.scripts = {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            };
          }
          
          // Ensure browserslist exists
          if (!enhancedPkg.browserslist) {
            enhancedPkg.browserslist = {
              production: [
                ">0.2%",
                "not dead",
                "not op_mini all"
              ],
              development: [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
              ]
            };
          }
          
          generatedFiles['package.json'] = JSON.stringify(enhancedPkg, null, 2);
          console.log('Enhanced existing package.json with missing dependencies');
        } catch (error) {
          console.error('Failed to enhance existing package.json:', error);
          // Fall back to creating a new one
          generatedFiles['package.json'] = JSON.stringify({
            name: 'generated-react-app',
            version: '0.1.0',
            private: true,
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
              'react-scripts': '5.0.1',
              'react-router-dom': '^6.8.0',
              'react-syntax-highlighter': '^15.5.0',
              'react-live': '^4.0.3',
              'js-cookie': '^3.0.5',
              'axios': '^1.6.0'
            },
            devDependencies: {
              tailwindcss: '^3.4.1',
              postcss: '^8.4.38',
              autoprefixer: '^10.4.19',
              '@types/react': '^18.2.0',
              '@types/react-dom': '^18.2.0',
              '@types/react-syntax-highlighter': '^15.5.0',
              'typescript': '^5.0.0',
              '@types/node': '^20.0.0'
            },
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            },
            browserslist: {
              production: [
                ">0.2%",
                "not dead",
                "not op_mini all"
              ],
              development: [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
              ]
            }
          }, null, 2);
        }
      } else {
        // Create new package.json if none exists
        generatedFiles['package.json'] = JSON.stringify({
          name: 'generated-react-app',
          version: '0.1.0',
          private: true,
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-scripts': '5.0.1',
            'react-router-dom': '^6.8.0',
            'react-syntax-highlighter': '^15.5.0',
            'react-live': '^4.0.3',
            'js-cookie': '^3.0.5',
            'axios': '^1.6.0'
          },
          devDependencies: {
            tailwindcss: '^3.4.1',
            postcss: '^8.4.38',
            autoprefixer: '^10.4.19',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@types/react-syntax-highlighter': '^15.5.0',
            'typescript': '^5.0.0',
            '@types/node': '^20.0.0'
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject'
          },
          browserslist: {
            production: [
              ">0.2%",
              "not dead",
              "not op_mini all"
            ],
            development: [
              "last 1 chrome version",
              "last 1 firefox version",
              "last 1 safari version"
            ]
          }
        }, null, 2);
      }
    }

    // Post-process generated files to ensure proper React imports
    const ensureReactImports = (content, filePath) => {
      if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        // Ensure React is imported if JSX is used
        if (content.includes('JSX') || content.includes('<') && content.includes('>')) {
          if (!content.includes('import React') && !content.includes('from \'react\'')) {
            content = 'import React from \'react\';\n\n' + content;
          }
        }
      }
      return content;
    };

    // Apply post-processing to all generated files
    Object.keys(generatedFiles).forEach(filePath => {
      if (typeof generatedFiles[filePath] === 'string') {
        generatedFiles[filePath] = ensureReactImports(generatedFiles[filePath], filePath);
      }
    });

    // Validate that critical files have proper content
    const criticalFiles = ['src/index.js', 'src/index.tsx', 'src/App.js', 'src/App.tsx', 'src/App.jsx'];
    const hasValidEntryPoint = criticalFiles.some(file => {
      const content = generatedFiles[file];
      return content && (
        content.includes('ReactDOM.createRoot') || 
        content.includes('ReactDOM.render') ||
        content.includes('App')
      );
    });

    if (!hasValidEntryPoint) {
      console.warn('Generated files missing valid React entry point, creating fallback...');
      if (!generatedFiles['src/index.js']) {
        generatedFiles['src/index.js'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
      }
    }

    // Final validation of package.json
    try {
      const finalPackageJson = JSON.parse(generatedFiles['package.json']);
      console.log('Final package.json dependencies:', Object.keys(finalPackageJson.dependencies || {}));
      console.log('Final package.json devDependencies:', Object.keys(finalPackageJson.devDependencies || {}));
    } catch (error) {
      console.error('Final package.json validation failed:', error);
    }

    // Ensure other required files
    if (!generatedFiles['public/index.html']) {
      generatedFiles['public/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated React App</title>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`;
    }

    if (!generatedFiles['src/index.js']) {
      generatedFiles['src/index.js'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    }

    if (!generatedFiles['src/index.css']) {
      generatedFiles['src/index.css'] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
    }

    if (!generatedFiles['tailwind.config.js']) {
      generatedFiles['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'pure-green': '#00A896',
        'pure-dark': '#222'
      }
    },
  },
  plugins: [],
}`;
    }

    if (!generatedFiles['postcss.config.js']) {
      generatedFiles['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    }

    // --- DYNAMIC APP.JSX/TSX GENERATION ---
    function generateAppJsx(screenNames, screenFolder = 'components', ext = 'jsx') {
      if (screenNames.length === 1) {
        // Single screen/component
        return 'import React from \'react\';\n' +
               'import ' + screenNames[0] + ' from \'./' + screenFolder + '/' + screenNames[0] + '\';\n\n' +
               'export default function App() {\n' +
               '  return <' + screenNames[0] + ' />;\n' +
               '}';
      } else if (screenNames.length > 1) {
        // Multiple screens/components: use React Router
        const imports = screenNames.map(name => 'import ' + name + ' from \'./' + screenFolder + '/' + name + '\';').join('\n');
        const navLinks = screenNames.map(name => {
          const label = name.replace(/Screen$/, '').replace(/([A-Z])/g, ' $1').trim();
          return '<Link key="' + name + '" to="/' + name + '"><button style={{marginRight: 8}}>' + label + '</button></Link>';
        }).join(' ');
        const routes = screenNames.map(name => '<Route path="/' + name + '" element={<' + name + ' />} />').join(' ');
        
        return 'import React from \'react\';\n' +
               'import { BrowserRouter, Routes, Route, Link } from \'react-router-dom\';\n' +
               imports + '\n\n' +
               'export default function App() {\n' +
               '  return (\n' +
               '    <BrowserRouter>\n' +
               '      <nav style={{ padding: 16, marginBottom: 24 }}>\n' +
               '        ' + navLinks + '\n' +
               '      </nav>\n' +
               '      <Routes>\n' +
               '        ' + routes + '\n' +
               '        <Route path="*" element={<' + screenNames[0] + ' />} />\n' +
               '      </Routes>\n' +
               '    </BrowserRouter>\n' +
               '  );\n' +
               '}';
      } else {
        // Fallback: no screens
        return 'import React from \'react\';\n' +
               'export default function App() {\n' +
               '  return <div>No screens found.</div>;\n' +
               '}';
      }
    }

    // Try screens folder first, then fallback to components
    let screenFiles = Object.keys(generatedFiles)
      .filter(path => path.startsWith('src/screens/') && path.match(/\.(jsx|tsx)$/));
    let screenFolder = 'screens';

    if (screenFiles.length === 0) {
      screenFiles = Object.keys(generatedFiles)
        .filter(path => path.startsWith('src/components/') && path.match(/\.(jsx|tsx)$/));
      screenFolder = 'components';
    }

    const screenNames = screenFiles.map(path => path.match(/([^/]+)\.(jsx|tsx)$/)[1]);

    // Generate App.jsx/tsx
    if (!generatedFiles['src/App.jsx'] && !generatedFiles['src/App.tsx']) {
      // Use .tsx if any screen/component is .tsx, else .jsx
      const ext = screenFiles.some(f => f.endsWith('.tsx')) ? 'tsx' : 'jsx';
      generatedFiles['src/App.' + ext] = generateAppJsx(screenNames, screenFolder, ext);
    }

    // --- Ensure react-router-dom in package.json if needed ---
    if (screenNames.length > 1) {
      let pkg = generatedFiles['package.json'];
      if (pkg) {
        let pkgObj = typeof pkg === 'string' ? JSON.parse(pkg) : pkg;
        pkgObj.dependencies = pkgObj.dependencies || {};
        if (!pkgObj.dependencies['react-router-dom']) {
          pkgObj.dependencies['react-router-dom'] = '^6.22.3';
        }
        generatedFiles['package.json'] = JSON.stringify(pkgObj, null, 2);
      }
    }

    // Send response with manifest and files
    res.status(200).json({ manifest, files: generatedFiles });

    // --- End of handler ---
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
