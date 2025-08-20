// backend/api/live-preview.js
import { callGenerativeAI } from './utils/shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, type = 'component' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Process the code for live preview
    const previewData = await generateLivePreview(code, type);
    
    res.status(200).json(previewData);
  } catch (error) {
    console.error('Live preview error:', error);
    res.status(500).json({ 
      error: 'Failed to generate live preview', 
      details: error.message 
    });
  }
}

async function generateLivePreview(code, type) {
  try {
    // Validate and analyze the code
    const validation = await validateAndAnalyzeCode(code);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        suggestions: validation.suggestions || []
      };
    }

    // Generate the preview HTML
    const previewHTML = generateAdvancedPreviewHTML(code, validation.analysis);
    
    return {
      success: true,
      previewHTML,
      analysis: validation.analysis,
      dependencies: extractAllDependencies(code),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: `Preview generation failed: ${error.message}`,
      suggestions: ['Check your code syntax', 'Ensure all imports are correct']
    };
  }
}

async function validateAndAnalyzeCode(code) {
  try {
    const prompt = `Analyze this React code and return a JSON object with detailed information:

{
  "isValid": boolean,
  "error": string or null,
  "suggestions": string[],
  "analysis": {
    "componentName": string,
    "componentType": "functional" | "class",
    "props": [{"name": string, "type": string, "required": boolean}],
    "hooks": string[],
    "imports": string[],
    "exports": string[],
    "hasState": boolean,
    "hasEffects": boolean,
    "complexity": "low" | "medium" | "high",
    "description": string,
    "features": string[]
  }
}

Code to analyze:
${code}`;

    const result = await callGenerativeAI(prompt, [], true);
    return JSON.parse(result);
  } catch (error) {
    return {
      isValid: false,
      error: "Code validation failed",
      suggestions: ["Check syntax and imports"],
      analysis: null
    };
  }
}

function generateAdvancedPreviewHTML(code, analysis) {
  const componentName = analysis?.componentName || extractComponentName(code);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} - Live Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
    <style>
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
             background: #f8fafc;
        }
        .preview-container {
            min-height: 100vh;
            padding: 20px;
        }
        .error-boundary { 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 16px 0;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .error-title {
            color: #dc2626;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .error-message {
            color: #991b1b;
            margin-bottom: 12px;
            line-height: 1.5;
        }
        .error-stack {
            background: #7f1d1d;
            color: #fecaca;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: #6b7280;
        }
        .loading-spinner {
            border: 2px solid #e5e7eb;
            border-radius: 50%;
            border-top: 2px solid #3b82f6;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin-right: 12px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div id="root">
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading preview...</span>
            </div>
        </div>
    </div>
    
    <script type="text/babel">
        // Enhanced Error Boundary with better error handling
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { 
                    hasError: false, 
                    error: null, 
                    errorInfo: null,
                    retryCount: 0
                };
            }

            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }

            componentDidCatch(error, errorInfo) {
                console.error('React Error Boundary caught an error:', error, errorInfo);
                this.setState({
                    error,
                    errorInfo
                });
                
                // Send error info to parent window
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'PREVIEW_ERROR',
                        error: {
                            message: error.message,
                            stack: error.stack,
                            componentStack: errorInfo.componentStack
                        }
                    }, '*');
                }
            }

            handleRetry = () => {
                this.setState(prevState => ({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                    retryCount: prevState.retryCount + 1
                }));
            }

            render() {
                if (this.state.hasError) {
                    return (
                        <div className="error-boundary">
                            <div className="error-title">
                                <span>🚫</span>
                                <span>Component Error</span>
                            </div>
                            <div className="error-message">
                                <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
                            </div>
                            {this.state.error?.stack && (
                                <details>
                                    <summary style={{cursor: 'pointer', marginBottom: '8px'}}>
                                        Stack Trace
                                    </summary>
                                    <div className="error-stack">
                                        {this.state.error.stack}
                                    </div>
                                </details>
                            )}
                            <button 
                                onClick={this.handleRetry}
                                style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    marginTop: '12px'
                                }}
                            >
                                🔄 Retry ({this.state.retryCount})
                            </button>
                        </div>
                    );
                }
                return this.props.children;
            }
        }

        // Mock common React libraries for preview
        const mockLibraries = {
            'react-router-dom': {
                BrowserRouter: ({children}) => React.createElement('div', {}, children),
                Route: ({children}) => React.createElement('div', {}, children),
                Link: ({children, to, ...props}) => React.createElement('a', {href: to, ...props}, children),
                useNavigate: () => (path) => console.log('Navigate to:', path),
                useParams: () => ({}),
                useLocation: () => ({pathname: '/', search: '', hash: ''})
            }
        };

        // Mock common components that might be missing
        const mockComponents = {
            Header: () => React.createElement('header', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Header Component'),
            Footer: () => React.createElement('footer', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Footer Component'),
            Sidebar: () => React.createElement('aside', {style: {padding: '1rem', background: '#e5e7eb'}}, 'Sidebar Component'),
            Navigation: () => React.createElement('nav', {style: {padding: '1rem', background: '#d1d5db'}}, 'Navigation Component'),
            Layout: ({children}) => React.createElement('div', {style: {display: 'flex', flexDirection: 'column', minHeight: '100vh'}}, children),
            Container: ({children}) => React.createElement('div', {style: {maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}, children)
        };

        // Make mock components globally available
        Object.assign(window, mockComponents);

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (window.parent) {
                window.parent.postMessage({
                    type: 'PREVIEW_ERROR',
                    error: {
                        message: event.error?.message || event.message,
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno
                    }
                }, '*');
            }
        });

        // User's component code (with error handling)
        let processedCode = \`${code}\`;
        
        // --- TypeScript cleanup: remove type annotations & exports ---
        processedCode = processedCode
          // Remove interface/type declarations (single-line or multiline)
          .replace(/(interface|type)\s+\w+\s*[\s\S]*?\}/g, '')
          
          // Remove function return types like: function App(): JSX.Element
          .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*[^ {]+(\s*\{)/g, 'function $1($2)$3')
          
          // Remove arrow function return types like: const X = (...) : JSX.Element =>
          .replace(/=\s*\(([^)]*)\)\s*:\s*[^=]+=>/g, '=($1)=>')
          
          // Remove parameter types like: (foo: string, bar: number)
          .replace(/\(([^)]*)\)/g, (_, params) =>
            `(${params.replace(/:\s*[\w\[\]<>|]+/g, '')})`
          )
        
          // Remove remaining return types like: : JSX.Element
          .replace(/:\s*[\w\[\]<>|]+/g, '')
        
          // Remove import statements
          .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
        
          // Convert `export default` to `window.UserComponent =`
          .replace(/export\s+default\s+/g, 'window.UserComponent = ')
        
          // Remove any other `export` keywords
          .replace(/export\s+/g, '');

        
        try {
            // Transform JSX/TSX to JS using Babel
            const transpiledCode = Babel.transform(processedCode, { 
                presets: ['react'] 
            }).code;
            // Execute the transpiled code
            eval(transpiledCode);
        } catch (syntaxError) {
            console.error('Syntax error in component code:', syntaxError);
            const ErrorDisplay = () => (
                <div className="error-boundary">
                    <div className="error-title">
                        <span>❌</span>
                        <span>Syntax Error</span>
                    </div>
                    <div className="error-message">
                        <strong>Error:</strong> {syntaxError.message}
                    </div>
                </div>
            );
            window.UserComponent = ErrorDisplay;
        }

        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        
        const PreviewWrapper = () => {
            const [isReady, setIsReady] = React.useState(false);
            
            React.useEffect(() => {
                // Small delay to ensure everything is loaded
                const timer = setTimeout(() => {
                    setIsReady(true);
                    // Notify parent that preview is ready
                    if (window.parent) {
                        window.parent.postMessage({
                            type: 'PREVIEW_READY',
                            componentName: '${componentName}',
                            timestamp: new Date().toISOString()
                        }, '*');
                    }
                }, 100);
                
                return () => clearTimeout(timer);
            }, []);

            if (!isReady) {
                return (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Initializing ${componentName}...</span>
                    </div>
                );
            }

            const ComponentToRender = window.UserComponent || ${componentName};
            return <ComponentToRender />;
        };
        
        try {
            root.render(
                <ErrorBoundary key={Date.now()}>
                    <PreviewWrapper />
                </ErrorBoundary>
            );
        } catch (renderError) {
            console.error('Render error:', renderError);
            root.render(
                <div className="error-boundary">
                    <div className="error-title">
                        <span>💥</span>
                        <span>Render Error</span>
                    </div>
                    <div className="error-message">
                        <strong>Error:</strong> {renderError.message}
                    </div>
                </div>
            );
        }
    </script>
</body>
</html>`;
}

function extractComponentName(code) {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /function\s+(\w+)\s*\([^)]*\)\s*{/,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/,
    /const\s+(\w+)\s*=\s*function/,
    /export\s+default\s+(\w+)/
  ];
  
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match && match[1] !== 'React') {
      return match[1];
    }
  }
  
  return 'Component';
}

function extractAllDependencies(code) {
  const dependencies = new Set();
  
  // Extract from import statements
  const importMatches = code.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    dependencies.add(match[1]);
  }
  
  // Extract from require statements
  const requireMatches = code.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of requireMatches) {
    dependencies.add(match[1]);
  }
  
  return Array.from(dependencies);
}
