// backend/api/live-preview.js

export default async function handler(req, res) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, type = 'component', options = {} } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Validate code size (prevent abuse)
    if (code.length > 50000) {
      return res.status(413).json({ 
        error: 'Code too large', 
        details: 'Maximum 50KB allowed for preview' 
      });
    }

    // Process the code for live preview with enhanced options
    const previewData = await generateLivePreview(code, type, options);
    
    res.status(200).json(previewData);
  } catch (error) {
    console.error('Live preview error:', error);
    res.status(500).json({ 
      error: 'Failed to generate live preview', 
      details: error.message 
    });
  }
}

async function generateLivePreview(code, type, options = {}) {
  try {
    // Enhanced validation with more detailed analysis
    const validation = await validateAndAnalyzeCode(code, options);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        suggestions: validation.suggestions || [],
        analysis: validation.partialAnalysis || {}
      };
    }

    // Generate the preview HTML with enhanced features
    const previewHTML = generateAdvancedPreviewHTML(code, validation.analysis, options);
    
    return {
      success: true,
      previewHTML,
      analysis: validation.analysis,
      dependencies: extractAllDependencies(code),
      performance: calculatePerformanceMetrics(code),
      accessibility: analyzeAccessibility(code),
      timestamp: new Date().toISOString(),
      previewUrl: generatePreviewUrl(code, validation.analysis.componentName)
    };
  } catch (error) {
    return {
      success: false,
      error: `Preview generation failed: ${error.message}`,
      suggestions: ['Check your code syntax', 'Ensure all imports are correct']
    };
  }
}

async function validateAndAnalyzeCode(code, options = {}) {
  try {
    // Basic syntax validation
    if (!code.trim()) {
      return {
        isValid: false,
        error: 'Empty code provided',
        suggestions: ['Please provide valid React component code']
      };
    }

    // Enhanced syntax validation
    const syntaxValidation = validateSyntax(code);
    if (!syntaxValidation.isValid) {
      return {
        isValid: false,
        error: syntaxValidation.error,
        suggestions: syntaxValidation.suggestions,
        partialAnalysis: syntaxValidation.partialAnalysis
      };
    }

    // Extract component name
    const componentName = extractComponentName(code);
    
    // Enhanced analysis with more metrics
    const imports = extractImports(code);
    const hooks = extractHooks(code);
    const complexity = calculateComplexity(code);
    const performance = calculatePerformanceMetrics(code);
    const accessibility = analyzeAccessibility(code);
    const security = analyzeSecurity(code);
    
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
      performance: performance,
      accessibility: accessibility,
      security: security,
      description: generateComponentDescription(code, componentName, hooks, imports),
      estimatedBundleSize: estimateBundleSize(code, imports),
      renderOptimization: analyzeRenderOptimization(code)
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

function validateSyntax(code) {
  const errors = [];
  const suggestions = [];
  const partialAnalysis = {};

  // Check for common React syntax issues
  if (code.includes('ReactDOM.render') && !code.includes('createRoot')) {
    suggestions.push('Consider using React 18 createRoot instead of ReactDOM.render');
  }

  // Check for missing dependencies in useEffect
  const useEffectMatches = code.match(/useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*\},\s*\[\s*\]\s*\)/g);
  if (useEffectMatches) {
    suggestions.push('Empty dependency array detected - consider if dependencies are needed');
  }

  // Check for potential memory leaks
  if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
    suggestions.push('Consider cleaning up event listeners to prevent memory leaks');
  }

  // Check for accessibility issues
  if (code.includes('<div') && code.includes('onClick') && !code.includes('role=') && !code.includes('tabIndex=')) {
    suggestions.push('Consider adding role and tabIndex for better accessibility');
  }

  // Check for performance issues
  if (code.includes('useState') && code.includes('setState') && code.includes('prevState')) {
    suggestions.push('Consider using functional updates for state to avoid stale closures');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : null,
    suggestions,
    partialAnalysis
  };
}

function calculatePerformanceMetrics(code) {
  const metrics = {
    hasMemoization: code.includes('React.memo') || code.includes('useMemo') || code.includes('useCallback'),
    hasOptimization: code.includes('React.memo') || code.includes('useMemo') || code.includes('useCallback') || code.includes('shouldComponentUpdate'),
    hasLazyLoading: code.includes('React.lazy') || code.includes('Suspense'),
    hasCodeSplitting: code.includes('import(') || code.includes('React.lazy'),
    estimatedRenders: estimateRenderCount(code),
    potentialBottlenecks: detectPerformanceBottlenecks(code)
  };

  return metrics;
}

function analyzeAccessibility(code) {
  const issues = [];
  const suggestions = [];

  // Check for missing alt attributes
  if (code.includes('<img') && !code.includes('alt=')) {
    issues.push('Missing alt attribute on images');
    suggestions.push('Add alt attributes to all images for screen readers');
  }

  // Check for missing ARIA labels
  if (code.includes('onClick') && !code.includes('aria-label') && !code.includes('aria-labelledby')) {
    suggestions.push('Consider adding ARIA labels for interactive elements');
  }

  // Check for semantic HTML
  if (code.includes('<div') && code.includes('onClick') && !code.includes('<button')) {
    suggestions.push('Consider using semantic HTML elements (button, link) instead of div with onClick');
  }

  return {
    issues,
    suggestions,
    score: calculateAccessibilityScore(code)
  };
}

function analyzeSecurity(code) {
  const issues = [];
  const suggestions = [];

  // Check for XSS vulnerabilities
  if (code.includes('dangerouslySetInnerHTML')) {
    issues.push('Using dangerouslySetInnerHTML - potential XSS risk');
    suggestions.push('Sanitize HTML content before using dangerouslySetInnerHTML');
  }

  // Check for eval usage
  if (code.includes('eval(')) {
    issues.push('Using eval() - security risk');
    suggestions.push('Avoid using eval() - consider alternative approaches');
  }

  return {
    issues,
    suggestions,
    riskLevel: issues.length > 0 ? 'medium' : 'low'
  };
}

function estimateBundleSize(code, imports) {
  let baseSize = code.length * 0.1; // Rough estimate
  imports.forEach(imp => {
    if (imp.source.includes('react')) baseSize += 50;
    else if (imp.source.includes('@')) baseSize += 30;
    else baseSize += 20;
  });
  return Math.round(baseSize);
}

function analyzeRenderOptimization(code) {
  const optimizations = [];
  
  if (code.includes('React.memo')) optimizations.push('Component memoization');
  if (code.includes('useMemo')) optimizations.push('Value memoization');
  if (code.includes('useCallback')) optimizations.push('Function memoization');
  if (code.includes('shouldComponentUpdate')) optimizations.push('Custom render optimization');
  
  return optimizations;
}

function detectPerformanceBottlenecks(code) {
  const bottlenecks = [];
  
  if (code.includes('setState') && code.includes('prevState')) {
    bottlenecks.push('Potential stale closure in state updates');
  }
  
  if (code.includes('useEffect') && code.includes('[]')) {
    bottlenecks.push('Empty dependency array might miss dependencies');
  }
  
  if (code.includes('map') && code.includes('key=')) {
    bottlenecks.push('Missing key prop in list rendering');
  }
  
  return bottlenecks;
}

function estimateRenderCount(code) {
  let count = 1; // Base render
  if (code.includes('useState')) count += 2;
  if (code.includes('useEffect')) count += 1;
  if (code.includes('useContext')) count += 1;
  return count;
}

function calculateAccessibilityScore(code) {
  let score = 100;
  
  if (code.includes('<img') && !code.includes('alt=')) score -= 20;
  if (code.includes('onClick') && !code.includes('aria-label')) score -= 15;
  if (code.includes('<div') && code.includes('onClick')) score -= 10;
  
  return Math.max(0, score);
}

function generatePreviewUrl(code, componentName) {
  // Generate a unique URL for the preview
  const timestamp = Date.now();
  const hash = btoa(code.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '');
  return `/preview/${componentName}-${timestamp}-${hash}`;
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

function generateAdvancedPreviewHTML(code, analysis, options = {}) {
  const componentName = analysis?.componentName || extractComponentName(code);
  const enableDebug = options.debug || false;
  const enablePerformance = options.performance || false;
  const enableAccessibility = options.accessibility || false;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} - Live Preview</title>
    <script src="https://unpkg.com/react@19/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@19/umd/react-dom.development.js"></script>
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
        
        /* Debug Panel Styles */
        .debug-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 300px;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        .debug-panel h4 {
            margin: 0 0 8px 0;
            color: #60a5fa;
        }
        .debug-panel .metric {
            margin: 4px 0;
            display: flex;
            justify-content: space-between;
        }
        .debug-panel .metric .value {
            color: #34d399;
        }
        
        /* Performance Monitor */
        .performance-monitor {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            z-index: 1000;
        }
        
        /* Accessibility Checker */
        .accessibility-checker {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            z-index: 1000;
            cursor: pointer;
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
        
        /* Component Info Panel */
        .component-info {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .component-info h3 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 16px;
        }
        .component-info .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
        }
        .component-info .info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
        }
        .component-info .info-label {
            color: #6b7280;
            font-weight: 500;
        }
        .component-info .info-value {
            color: #374151;
            font-weight: 600;
        }
    </style>
</head>
<body>
    ${enableDebug ? `
    <div class="debug-panel">
        <h4>🔧 Debug Info</h4>
        <div class="metric">
            <span>Component:</span>
            <span class="value">${componentName}</span>
        </div>
        <div class="metric">
            <span>Type:</span>
            <span class="value">${analysis?.componentType || 'unknown'}</span>
        </div>
        <div class="metric">
            <span>Lines:</span>
            <span class="value">${analysis?.linesOfCode || 0}</span>
        </div>
        <div class="metric">
            <span>Hooks:</span>
            <span class="value">${analysis?.hooks?.length || 0}</span>
        </div>
        <div class="metric">
            <span>Imports:</span>
            <span class="value">${analysis?.imports?.length || 0}</span>
        </div>
        <div class="metric">
            <span>Complexity:</span>
            <span class="value">${analysis?.complexity || 'unknown'}</span>
        </div>
    </div>
    ` : ''}
    
    ${enablePerformance ? `
    <div class="performance-monitor" id="performanceMonitor">
        ⚡ Performance: <span id="renderTime">-</span>ms
    </div>
    ` : ''}
    
    ${enableAccessibility ? `
    <div class="accessibility-checker" onclick="toggleAccessibilityReport()">
        ♿ A11Y: <span id="accessibilityScore">${analysis?.accessibility?.score || 100}</span>
    </div>
    ` : ''}
    
    <div class="preview-container">
        ${analysis ? `
        <div class="component-info">
            <h3>📊 Component Analysis</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${componentName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${analysis.componentType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Lines of Code:</span>
                    <span class="info-value">${analysis.linesOfCode}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Complexity:</span>
                    <span class="info-value">${analysis.complexity}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Hooks Used:</span>
                    <span class="info-value">${analysis.hooks?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Dependencies:</span>
                    <span class="info-value">${analysis.imports?.length || 0}</span>
                </div>
                ${analysis.performance ? `
                <div class="info-item">
                    <span class="info-label">Optimizations:</span>
                    <span class="info-value">${analysis.performance.hasOptimization ? 'Yes' : 'No'}</span>
                </div>
                ` : ''}
                ${analysis.accessibility ? `
                <div class="info-item">
                    <span class="info-label">A11Y Score:</span>
                    <span class="info-value">${analysis.accessibility.score}/100</span>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <div id="root">
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading preview...</span>
            </div>
        </div>
    </div>
    
    <script type="text/babel">
        // Ensure all dependencies are loaded before running
        const checkDependencies = () => {
            if (typeof React === 'undefined') {
                console.error('React is not loaded');
                return false;
            }
            if (typeof ReactDOM === 'undefined') {
                console.error('ReactDOM is not loaded');
                return false;
            }
            if (typeof Babel === 'undefined') {
                console.error('Babel is not loaded');
                return false;
            }
            return true;
        };

        // Performance monitoring
        let renderStartTime = 0;
        let renderEndTime = 0;
        
        const startRenderTimer = () => {
            renderStartTime = performance.now();
        };
        
        const endRenderTimer = () => {
            renderEndTime = performance.now();
            const renderTime = Math.round(renderEndTime - renderStartTime);
            
            if (window.parent) {
                window.parent.postMessage({
                    type: 'PERFORMANCE_METRICS',
                    renderTime: renderTime,
                    timestamp: new Date().toISOString()
                }, '*');
            }
            
            const performanceMonitor = document.getElementById('performanceMonitor');
            if (performanceMonitor) {
                document.getElementById('renderTime').textContent = renderTime;
            }
        };
        
        // Accessibility checker
        const toggleAccessibilityReport = () => {
            const issues = ${JSON.stringify(analysis?.accessibility?.issues || [])};
            const suggestions = ${JSON.stringify(analysis?.accessibility?.suggestions || [])};
            
            if (issues.length > 0 || suggestions.length > 0) {
                const report = \`Accessibility Report:\\n\\nIssues:\\n\${issues.map(issue => '• ' + issue).join('\\n')}\\n\\nSuggestions:\\n\${suggestions.map(suggestion => '• ' + suggestion).join('\\n')}\`;
                alert(report);
            } else {
                alert('No accessibility issues detected! 🎉');
            }
        };

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
            if (typeof React === 'undefined' || typeof React.createElement === 'undefined') {
                console.error('React is not available for createElement');
                // Return null instead of an object to prevent React child errors
                return null;
            }
            try {
                return React.createElement(type, props, ...children);
            } catch (error) {
                console.error('Error in createElement:', error);
                return React.createElement('div', { style: { color: 'red', padding: '1rem' } }, 'Error creating element');
            }
        };

        // Wait for React to be available before creating components
        const waitForReact = () => {
            return new Promise((resolve) => {
                if (typeof React !== 'undefined' && typeof React.createElement !== 'undefined') {
                    resolve();
                } else {
                    const checkReact = () => {
                        if (typeof React !== 'undefined' && typeof React.createElement !== 'undefined') {
                            resolve();
                        } else {
                            setTimeout(checkReact, 50);
                        }
                    };
                    checkReact();
                }
            });
        };

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

        // Initialize components after React is loaded
        const initializeComponents = async () => {
            await waitForReact();
            
            // Mock common components that might be missing
            const mockComponents = {
                Header: () => React.createElement('header', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Header Component'),
                Footer: () => React.createElement('footer', {style: {padding: '1rem', background: '#f3f4f6'}}, 'Footer Component'),
                Sidebar: () => React.createElement('aside', {style: {padding: '1rem', background: '#e5e7eb'}}, 'Sidebar Component'),
                Navigation: () => React.createElement('nav', {style: {padding: '1rem', background: '#d1d5db'}}, 'Navigation Component'),
                Layout: ({children}) => React.createElement('div', {style: {display: 'flex', flexDirection: 'column', minHeight: '100vh'}}, children),
                Container: ({children}) => React.createElement('div', {style: {maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}, children),
                Button: ({children, ...props}) => React.createElement('button', {style: {padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}, ...props}, children),
                Card: ({children, ...props}) => React.createElement('div', {style: {padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white'}, ...props}, children),
                Input: ({...props}) => React.createElement('input', {style: {padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%'}, ...props}),
                Text: ({children, ...props}) => React.createElement('p', {style: {margin: '0'}, ...props}, children),
                Title: ({children, ...props}) => React.createElement('h1', {style: {margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 'bold'}, ...props}, children),
                Subtitle: ({children, ...props}) => React.createElement('h2', {style: {margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600'}, ...props}, children),
                Div: ({children, ...props}) => React.createElement('div', props, children),
                Span: ({children, ...props}) => React.createElement('span', props, children),
                Image: ({src, alt, ...props}) => React.createElement('img', {src, alt, style: {maxWidth: '100%', height: 'auto'}, ...props}),
                List: ({children, ...props}) => React.createElement('ul', {style: {margin: '0', padding: '0 0 0 1.5rem'}, ...props}, children),
                ListItem: ({children, ...props}) => React.createElement('li', {style: {margin: '0.25rem 0'}, ...props}, children),
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
                    const dynamicComponent = () => {
                        if (typeof React === 'undefined') {
                            return null;
                        }
                        return React.createElement('div', {
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
                            React.createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                            React.createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                            React.createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                            React.createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                        ]);
                    };
                    
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
            // Wait for all dependencies to be available
            while (!checkDependencies()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Wait for React to be available first
            await waitForReact();
            
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
                    const dynamicComponent = () => {
                        if (typeof React === 'undefined') {
                            return null;
                        }
                        return React.createElement('div', {
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
                            React.createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                            React.createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                            React.createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                            React.createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                        ]);
                    };
                    
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
                    const dynamicComponent = () => {
                        if (typeof React === 'undefined') {
                            return null;
                        }
                        return React.createElement('div', {
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
                            React.createElement('div', {key: 'icon', style: {fontSize: '2rem', marginBottom: '1rem'}}, '🔧'),
                            React.createElement('h3', {key: 'title', style: {margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem', fontWeight: 'bold'}}, componentName + ' Component'),
                            React.createElement('p', {key: 'desc', style: {margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.8}}, 'Auto-generated mock component for live preview'),
                            React.createElement('div', {key: 'info', style: {fontSize: '0.75rem', opacity: 0.6, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px'}}, 'This component will be properly implemented in the generated code')
                        ]);
                    };
                    
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
              .replace(/:\\s*\\w+/g, '')
              // Fix invalid TypeScript syntax like "const App.FC ="
              .replace(/const\\s+(\\w+)\\.\\w+\\s*=/g, 'const $1 =')
              // Fix "const App: React.FC ="
              .replace(/const\\s+(\\w+)\\s*:\\s*\\w+\\.\\w+\\s*=/g, 'const $1 =');
            
            processedCode = processedCode.replace(/export\\s+default\\s+/g, 'window.UserComponent = ');
            processedCode = processedCode.replace(/export\\s+/g, '');
            
            try {
                // Transform JSX to JS using Babel
                if (typeof Babel === 'undefined') {
                    throw new Error('Babel is not available for JSX transformation');
                }
                const transpiledCode = Babel.transform(processedCode, { presets: ['react'] }).code;
                // Execute the transpiled code
                eval(transpiledCode);
            } catch (syntaxError) {
                console.error('Syntax error in component code:', syntaxError);
                const ErrorDisplay = () => {
                    if (typeof React === 'undefined') {
                        return null;
                    }
                    return React.createElement('div', {className: 'error-boundary'},
                        React.createElement('div', {className: 'error-title'},
                            React.createElement('span', {}, '❌'),
                            React.createElement('span', {}, 'Syntax Error')
                        ),
                        React.createElement('div', {className: 'error-message'},
                            React.createElement('strong', {}, 'Error:'),
                            React.createElement('span', {}, syntaxError.message)
                        )
                    );
                };
                window.UserComponent = ErrorDisplay;
            }
        })();

        // Render the component after React is available
        const renderComponent = async () => {
            await waitForReact();
            
            // Ensure ReactDOM is also available
            if (typeof ReactDOM === 'undefined') {
                console.error('ReactDOM is not available');
                return;
            }
            
            const root = ReactDOM.createRoot(document.getElementById('root'));
            
            // Simple wrapper using createElement to avoid React availability issues
            const PreviewWrapper = () => {
                const ComponentToRender = window.UserComponent || ${componentName};
                if (!ComponentToRender) {
                    return React.createElement('div', { style: { color: 'red', padding: '1rem' } }, 'Component not found');
                }
                return React.createElement(ComponentToRender);
            };
            
            // Start performance monitoring
            startRenderTimer();
            
            // Notify parent that preview is ready after a small delay
            setTimeout(() => {
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'PREVIEW_READY',
                        componentName: '${componentName}',
                        timestamp: new Date().toISOString()
                    }, '*');
                }
                
                // End performance monitoring
                endRenderTimer();
            }, 100);
            
            try {
                root.render(
                    React.createElement(ErrorBoundary, {key: Date.now()},
                        React.createElement(PreviewWrapper)
                    )
                );
            } catch (renderError) {
                console.error('Render error:', renderError);
                endRenderTimer();
                root.render(
                    React.createElement('div', {className: 'error-boundary'},
                        React.createElement('div', {className: 'error-title'},
                            React.createElement('span', {}, '💥'),
                            React.createElement('span', {}, 'Render Error')
                        ),
                        React.createElement('div', {className: 'error-message'},
                            React.createElement('strong', {}, 'Error:'),
                            React.createElement('span', {}, renderError.message)
                        )
                    )
                );
            }
        };
        
        // Start rendering after components are initialized
        // Add a small delay to ensure all scripts are loaded
        setTimeout(async () => {
            try {
                await renderComponent();
            } catch (error) {
                console.error('Failed to render component:', error);
                // Show a fallback error message
                const root = document.getElementById('root');
                if (root) {
                    root.innerHTML = \`
                        <div style="padding: 2rem; text-align: center; color: #dc2626;">
                            <h3>⚠️ Preview Error</h3>
                            <p>Failed to load React preview. Please check your component code.</p>
                            <p style="font-size: 0.875rem; color: #6b7280;">Error: \${error.message}</p>
                        </div>
                    \`;
                }
            }
        }, 100);
    </script>
</body>
</html>`;
} 
