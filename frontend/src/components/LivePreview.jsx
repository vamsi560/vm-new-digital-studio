import React, { useState, useEffect } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';
import './LivePreview.css';

const LivePreview = ({ code }) => {
    const [error, setError] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [parsedCode, setParsedCode] = useState('');

    useEffect(() => {
        if (!code) {
            setPreviewContent(null);
            setError(null);
            setParsedCode('');
            return;
        }

        try {
            // Parse the generated code to extract the component structure
            const parseComponent = () => {
                // Look for React component patterns
                const componentPatterns = [
                    /const\s+(\w+)\s*=\s*\(\)\s*=>\s*{([\s\S]*?)}/,
                    /function\s+(\w+)\s*\(\)\s*{([\s\S]*?)}/,
                    /const\s+(\w+)\s*=\s*function\s*\(\)\s*{([\s\S]*?)}/,
                    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)}/,
                    /function\s+(\w+)\s*\([^)]*\)\s*{([\s\S]*?)}/
                ];

                let componentName = 'GeneratedComponent';
                let componentBody = '';

                for (const pattern of componentPatterns) {
                    const match = code.match(pattern);
                    if (match) {
                        componentName = match[1];
                        componentBody = match[2];
                        break;
                    }
                }

                // Extract JSX content from the component body
                let jsxContent = '';
                let jsxMatch = null;
                
                // Try different JSX return patterns
                const jsxPatterns = [
                    /return\s*\(([\s\S]*?)\);/,
                    /return\s*([\s\S]*?);/,
                    /return\s*([\s\S]*?)$/,
                    /=>\s*\(([\s\S]*?)\)/,
                    /=>\s*([\s\S]*?)$/
                ];
                
                for (const pattern of jsxPatterns) {
                    jsxMatch = componentBody.match(pattern);
                    if (jsxMatch) {
                        jsxContent = jsxMatch[1];
                        break;
                    }
                }
                
                if (!jsxContent) {
                    // If no JSX found, try to extract any HTML-like content
                    const htmlMatch = componentBody.match(/<[^>]*>[\s\S]*<\/[^>]*>/);
                    if (htmlMatch) {
                        jsxContent = htmlMatch[0];
                    } else {
                        // Create a fallback component
                        jsxContent = '<div className="fallback-component"><h1>Generated Component</h1><p>Component content will appear here</p></div>';
                    }
                }
                
                // Create a safe HTML representation for fallback
                const createSafeHTML = (jsx) => {
                    // Convert JSX-like syntax to safe HTML
                    let html = jsx
                        .replace(/className=/g, 'class=')
                        .replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Basic JSX to HTML conversion
                    html = html
                        .replace(/<(\w+)([^>]*)>/g, '<$1$2>')
                        .replace(/<\/(\w+)>/g, '</$1>')
                        .replace(/\/>/g, '>');

                    return html;
                };

                const safeHTML = createSafeHTML(jsxContent);
                
                // Create clean React code for LiveProvider
                const cleanReactCode = createCleanReactCode(componentName, componentBody, jsxContent);
                
                return {
                    componentName,
                    html: safeHTML,
                    originalJSX: jsxContent,
                    cleanReactCode: cleanReactCode
                };
            };

            const parsed = parseComponent();
            setPreviewContent(parsed);
            setParsedCode(parsed.cleanReactCode);
            setError(null);

        } catch (err) {
            console.error('Error parsing component for preview:', err);
            setError(err.message);
            setPreviewContent(null);
            setParsedCode('');
        }
    }, [code]);

    // Create clean React code for LiveProvider
    const createCleanReactCode = (componentName, componentBody, jsxContent) => {
        // Extract imports if they exist
        const importMatch = code.match(/import\s+.*?from\s+['"][^'"]+['"];?/g);
        const imports = importMatch ? importMatch.join('\n') : '';
        
        // Create a clean component definition
        let cleanCode = '';
        
        if (imports) {
            cleanCode += imports + '\n\n';
        }
        
        // Add React import if not present
        if (!cleanCode.includes('import React')) {
            cleanCode += "import React from 'react';\n\n";
        }
        
        // Create the component
        cleanCode += `const ${componentName} = () => {\n`;
        cleanCode += `  return (\n`;
        cleanCode += `    ${jsxContent}\n`;
        cleanCode += `  );\n`;
        cleanCode += `};\n\n`;
        cleanCode += `export default ${componentName};`;
        
        return cleanCode;
    };

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p className="text-red-500 font-medium">Preview Error</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
        );
    }

    if (!previewContent) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading preview...</p>
            </div>
        );
    }

    // Try to use React Live for better preview
    if (parsedCode && parsedCode.includes('return')) {
        try {
            return (
                <div className="live-preview-container">
                    {/* Component Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">
                            {previewContent.componentName}
                        </h3>
                        <p className="text-xs text-gray-500">Generated React Component (Live Preview)</p>
                    </div>

                    {/* React Live Preview */}
                    <div className="preview-frame">
                        <LiveProvider code={parsedCode} noInline={true} scope={{ React }}>
                            <div className="preview-content">
                                <ReactLivePreview />
                            </div>
                            <LiveError className="text-red-400 text-xs p-2 bg-red-50 rounded mt-2" />
                        </LiveProvider>
                    </div>
                </div>
            );
        } catch (liveError) {
            console.warn('React Live failed, falling back to HTML preview:', liveError);
            // Fall through to HTML preview
        }
    }

    // Fallback to HTML preview
    return (
        <div className="live-preview-container">
            {/* Component Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {previewContent.componentName}
                </h3>
                <p className="text-xs text-gray-500">Generated React Component (HTML Preview)</p>
            </div>

            {/* HTML Preview */}
            <div className="preview-frame">
                <div 
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: previewContent.html }}
                />
            </div>

            {/* Fallback if HTML rendering fails */}
            {!previewContent.html && (
                <div className="preview-fallback">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-3">Component Preview</h2>
                        <p className="text-sm mb-4">This is a preview of your generated React component.</p>
                        <div className="bg-white/20 rounded p-3">
                            <p className="text-xs font-mono">{previewContent.componentName}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                <p><strong>Debug:</strong> Component: {previewContent.componentName}</p>
                <p><strong>Code Length:</strong> {code ? code.length : 0} characters</p>
                <p><strong>Preview Type:</strong> HTML Fallback</p>
            </div>
        </div>
    );
};

export default LivePreview; 