// backend/api/live-preview.js

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
    // Basic syntax validation
    if (!code.trim()) {
      return {
        isValid: false,
        error: 'Empty code provided',
        suggestions: ['Please provide valid React component code']
      };
    }

    // Extract component name
    const componentName = extractComponentName(code);
    
    // Enhanced analysis
    const imports = extractImports(code);
    const hooks = extractHooks(code);
    const complexity = calculateComplexity(code);
    
    const analysis = {
      componentName,
      componentType: detectComponentType(code),
      hasState: code.includes('useState') || code.includes('this.state'),
      hasEffects: code.includes('useEffect'),
      hasProps: code.includes('props') || code.includes('{') && code.includes('}'),
      linesOfCode: code.split('\n').length,
      hasImports: code.includes('import'),
      hasExports: code.includes('export'),
      imports: imports,
      hooks: hooks,
      complexity: complexity,
      description: generateComponentDescription(code, componentName, hooks, imports)
    };

    return {
      isValid: true,
      analysis
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Code analysis failed: ${error.message}`,
      suggestions: ['Check for syntax errors', 'Ensure valid JavaScript/JSX']
    };
  }
}

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

function detectComponentType(code) {
  if (code.includes('class') && code.includes('extends')) {
    return 'class';
  } else if (code.includes('function') || code.includes('=>')) {
    return 'functional';
  }
  return 'unknown';
}

function extractImports(code) {
  const imports = [];
  
  // Extract import statements with more detail
  const importRegex = /import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importNames = match[1].split(',').map(name => name.trim());
    imports.push({
      names: importNames,
      source: match[2]
    });
  }
  
  return imports;
}

function extractHooks(code) {
  const hooks = [];
  const hookRegex = /use[A-Z][a-zA-Z]*/g;
  let match;
  while ((match = hookRegex.exec(code)) !== null) {
    hooks.push(match[0]);
  }
  return [...new Set(hooks)];
}

function calculateComplexity(code) {
  const lines = code.split('\n').length;
  const hooks = extractHooks(code).length;
  const imports = extractImports(code).length;
  
  if (lines > 100 || hooks > 5 || imports > 10) return 'high';
  if (lines > 50 || hooks > 3 || imports > 5) return 'medium';
  return 'low';
}

function generateComponentDescription(code, componentName, hooks, imports) {
  const descriptions = [];
  
  if (hooks.length > 0) {
    descriptions.push(`Uses ${hooks.join(', ')} hooks`);
  }
  
  if (imports.length > 0) {
    const importSources = imports.map(imp => imp.source).join(', ');
    descriptions.push(`Imports from ${importSources}`);
  }
  
  if (code.includes('className')) {
    descriptions.push('Uses Tailwind CSS styling');
  }
  
  if (code.includes('onClick') || code.includes('onSubmit')) {
    descriptions.push('Has interactive elements');
  }
  
  return descriptions.length > 0 ? descriptions.join('. ') : 'A React component';
}

function extractAllDependencies(code) {
  const dependencies = [];
  
  // Extract import statements
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    dependencies.push(match[1]);
  }
  
  // Add common React dependencies
  if (code.includes('useState') || code.includes('useEffect') || code.includes('useRef')) {
    dependencies.push('react');
  }
  
  return [...new Set(dependencies)];
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

        // Helper function to safely create React elements
        const createElement = (type, props, ...children) => {
            if (typeof React === 'undefined') {
                console.error('React is not available for createElement');
                return null;
            }
            return React.createElement(type, props, ...children);
        };

        // Wait for React to be available before creating components
        const waitForReact = () => {
            return new Promise((resolve) => {
                if (typeof React !== 'undefined') {
                    resolve();
                } else {
                    const checkReact = () => {
                        if (typeof React !== 'undefined') {
                            resolve();
                        } else {
                            setTimeout(checkReact, 10);
                        }
                    };
                    checkReact();
                }
            });
        };

        // Mock common React libraries for preview
        const mockLibraries = {
            'react-router-dom': {
                BrowserRouter: ({children}) => createElement('div', {}, children),
                Route: ({children}) => createElement('div', {}, children),
                Link: ({children, to, ...props}) => createElement('a', {href: to, ...props}, children),
                useNavigate: () => (path) => console.log('Navigate to:', path),
                useParams: () => ({}),
                useLocation: () => ({pathname: '/', search: '', hash: ''})
            }
        };

        // Initialize components after React is loaded
        const initializeComponents = async () => {
            await waitForReact();
            
            // Mock common components that might be missing
            const mockComponents = {
                Header: () => createElement('header', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Header Component'),
                Footer: () => createElement('footer', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Footer Component'),
                Sidebar: () => createElement('aside', {style: {padding: '1rem', background: '#e5e7eb'}}, 'Sidebar Component'),
                Navigation: () => createElement('nav', {style: {padding: '1rem', background: '#d1d5db'}}, 'Navigation Component'),
                Layout: ({children}) => createElement('div', {style: {display: 'flex', flexDirection: 'column', minHeight: '100vh'}}, children),
                Container: ({children}) => createElement('div', {style: {maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}, children),
                Button: ({children, ...props}) => createElement('button', {style: {padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}, ...props}, children),
                Card: ({children, ...props}) => createElement('div', {style: {padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white'}, ...props}, children),
                Input: ({...props}) => createElement('input', {style: {padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%'}, ...props}),
                Text: ({children, ...props}) => createElement('p', {style: {margin: '0'}, ...props}, children),
                Title: ({children, ...props}) => createElement('h1', {style: {margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 'bold'}, ...props}, children),
                Subtitle: ({children, ...props}) => createElement('h2', {style: {margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600'}, ...props}, children),
                Div: ({children, ...props}) => createElement('div', props, children),
                Span: ({children, ...props}) => createElement('span', props, children),
                Image: ({src, alt, ...props}) => createElement('img', {src, alt, style: {maxWidth: '100%', height: 'auto'}, ...props}),
                List: ({children, ...props}) => createElement('ul', {style: {margin: '0', padding: '0 0 0 1.5rem'}, ...props}, children),
                ListItem: ({children, ...props}) => createElement('li', {style: {margin: '0.25rem 0'}, ...props}, children),
                            // Basic utility components only - everything else will be created dynamically
            };

            // Make mock components globally available
            Object.assign(window, mockComponents);
            
            // Also make them available as global variables
            Object.keys(mockComponents).forEach(key => {
                window[key] = mockComponents[key];
            });
            
            // Create a global components object for easier access
            window.Components = mockComponents;
            
            return mockComponents;
        };

        // Enhanced global error handler with dynamic component creation
        window.addEventListener('error', async (event) => {
            console.error('Global error:', event.error);
            
            // Check if it's a component not defined error
            if (event.error && event.error.message && event.error.message.includes('is not defined')) {
                const componentName = event.error.message.match(/(\w+) is not defined/)?.[1];
                console.log('Attempting to create mock component for:', componentName);
                
                if (componentName) {
                    // Wait for React to be available
                    await waitForReact();
                    
                    // Create a dynamic mock component for any undefined component
                    const dynamicComponent = () => createElement('div', {
                        style: {
                            padding: '2rem',
                            border: '2px dashed #3b82f6',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#1e40af',
                            textAlign: 'center',
                            margin: '1rem 0',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                        }
                    }, [
                        createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                        createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                        createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                        createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                    ]);
                    
                    // Add to mock components and make globally available
                    if (!window.mockComponents) {
                        window.mockComponents = {};
                    }
                    window.mockComponents[componentName] = dynamicComponent;
                    window[componentName] = dynamicComponent;
                    
                    console.log('Successfully created mock component:', componentName);
                    console.log('Available components:', Object.keys(window.mockComponents));
                    
                    // Prevent the error from propagating
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }
            
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

        // Initialize components and process user code
        (async () => {
            // Initialize base components
            const mockComponents = await initializeComponents();
            
            // User's component code (with error handling)
            // Process the code to handle imports properly
            let processedCode = \`${code}\`;
            
            // Extract component names from imports before removing them
            const importMatches = processedCode.match(/import\\s+.*?from\\s+['"][^'"]+['"];?\\n?/g) || [];
            const importedComponents = [];
            
            importMatches.forEach(importStatement => {
                // Extract component names from import statements
                const componentMatch = importStatement.match(/import\\s+{?([^}]+)}?\\s+from/);
                if (componentMatch) {
                    const components = componentMatch[1].split(',').map(c => c.trim());
                    importedComponents.push(...components);
                } else {
                    // Handle default imports
                    const defaultMatch = importStatement.match(/import\\s+([^\\s]+)\\s+from/);
                    if (defaultMatch) {
                        importedComponents.push(defaultMatch[1]);
                    }
                }
            });
            
            // Create mock components for all imported components
            importedComponents.forEach(componentName => {
                if (!mockComponents[componentName]) {
                    const dynamicComponent = () => createElement('div', {
                        style: {
                            padding: '2rem',
                            border: '2px dashed #3b82f6',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#1e40af',
                            textAlign: 'center',
                            margin: '1rem 0',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                        }
                    }, [
                        createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                        createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                        createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                        createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                    ]);
                    
                    mockComponents[componentName] = dynamicComponent;
                    window[componentName] = dynamicComponent;
                    console.log('Pre-created mock component for import:', componentName);
                }
            });
            
            // Remove import statements from the code since they're not needed in this context
            // React and ReactDOM are already available globally
            processedCode = processedCode.replace(/import\\s+.*?from\\s+['"][^'"]+['"];?\\n?/g, '');
            
            // Scan for component usage in JSX and create mock components proactively
            const jsxComponentMatches = processedCode.match(/<([A-Z][a-zA-Z0-9]*)\\b/g) || [];
            const usedComponents = [...new Set(jsxComponentMatches.map(match => match.slice(1)))];
            
            usedComponents.forEach(componentName => {
                if (!mockComponents[componentName] && componentName !== 'div' && componentName !== 'span' && componentName !== 'p' && componentName !== 'h1' && componentName !== 'h2' && componentName !== 'h3' && componentName !== 'button' && componentName !== 'input' && componentName !== 'img' && componentName !== 'a' && componentName !== 'ul' && componentName !== 'li') {
                    const dynamicComponent = () => createElement('div', {
                        style: {
                            padding: '2rem',
                            border: '2px dashed #3b82f6',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#1e40af',
                            textAlign: 'center',
                            margin: '1rem 0',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                        }
                    }, [
                        createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                        createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                        createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                        createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                    ]);
                    
                    mockComponents[componentName] = dynamicComponent;
                    window[componentName] = dynamicComponent;
                    console.log('Pre-created mock component for JSX usage:', componentName);
                }
            });
            
            // Remove TypeScript type annotations (function return types, parameter types, interfaces, types)
            processedCode = processedCode
              // Remove function return types: function App(): JSX.Element
              .replace(/function\\s+\\w+\\s*\\([^)]*\\)\\s*:\\s*[^\\{]+\\{/g, match =>
                match.replace(/:\\s*[^\\{]+\\{/, '{')
              )
              // Remove arrow function return types: const X = (...) : JSX.Element =>
              .replace(/=\\s*\\([^)]*\\)\\s*:\\s*[^=]+=>/g, match =>
                match.replace(/:\\s*[^=]+=>/, '=>')
              )
              // Remove parameter types: (foo: string, bar: number)
              .replace(/\\([^)]+\\)/g, params =>
                params.replace(/:\\s*\\w+/g, '')
              )
              // Remove interface/type declarations
              .replace(/(interface|type)\\s+\\w+[^{=]*[\\{=][^\\}]*\\}/g, '')
              // Remove any remaining : Type after variable names
              .replace(/:\\s*\\w+/g, '');
            
            processedCode = processedCode.replace(/export\\s+default\\s+/g, 'window.UserComponent = ');
            processedCode = processedCode.replace(/export\\s+/g, '');
            
            try {
                // Transform JSX to JS using Babel
                const transpiledCode = Babel.transform(processedCode, { presets: ['react'] }).code;
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
        })();

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
