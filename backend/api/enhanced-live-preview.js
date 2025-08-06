// backend/api/enhanced-live-preview.js

export default async function handler(req, res) {
  // Enhanced security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      code, 
      type = 'component', 
      options = {},
      sessionId,
      version = 1,
      collaboration = false
    } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Enhanced validation
    const validation = await validateEnhancedCode(code, options);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error,
        suggestions: validation.suggestions,
        analysis: validation.partialAnalysis
      });
    }

    // Generate enhanced preview with advanced features
    const previewData = await generateEnhancedPreview(code, type, options, {
      sessionId,
      version,
      collaboration
    });
    
    res.status(200).json(previewData);
  } catch (error) {
    console.error('Enhanced live preview error:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced preview', 
      details: error.message 
    });
  }
}

async function validateEnhancedCode(code, options) {
  const errors = [];
  const suggestions = [];
  const warnings = [];

  // Code size validation
  if (code.length > 100000) {
    errors.push('Code too large (max 100KB)');
  }

  // Security checks
  if (code.includes('eval(') || code.includes('Function(')) {
    errors.push('Security risk: eval() or Function() usage detected');
  }

  if (code.includes('innerHTML') || code.includes('outerHTML')) {
    warnings.push('Potential XSS risk with innerHTML/outerHTML');
  }

  // Performance checks
  const renderCount = (code.match(/useState/g) || []).length + (code.match(/useEffect/g) || []).length;
  if (renderCount > 10) {
    warnings.push('High number of state/effect hooks may impact performance');
  }

  // Accessibility checks
  if (code.includes('<img') && !code.includes('alt=')) {
    warnings.push('Missing alt attributes on images');
  }

  if (code.includes('onClick') && !code.includes('onKeyDown') && !code.includes('role=')) {
    warnings.push('Interactive elements should have keyboard support');
  }

  // Best practices
  if (code.includes('componentWillMount') || code.includes('componentWillReceiveProps')) {
    warnings.push('Deprecated lifecycle methods detected');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join('; '),
    suggestions: [...suggestions, ...warnings],
    partialAnalysis: {
      renderCount,
      hasSecurityIssues: errors.some(e => e.includes('Security')),
      hasAccessibilityIssues: warnings.some(w => w.includes('alt') || w.includes('keyboard')),
      hasPerformanceIssues: warnings.some(w => w.includes('performance'))
    }
  };
}

async function generateEnhancedPreview(code, type, options, metadata) {
  try {
    // Enhanced analysis
    const analysis = await performEnhancedAnalysis(code, options);
    
    // Generate preview HTML with advanced features
    const previewHTML = generateAdvancedPreviewHTML(code, analysis, {
      ...options,
      enableCollaboration: metadata.collaboration,
      sessionId: metadata.sessionId,
      version: metadata.version
    });
    
    // Generate additional metadata
    const additionalData = {
      codeMetrics: calculateCodeMetrics(code),
      suggestions: generateCodeSuggestions(code, analysis),
      optimizationTips: generateOptimizationTips(code, analysis),
      accessibilityReport: generateAccessibilityReport(code),
      performanceReport: generatePerformanceReport(code),
      securityReport: generateSecurityReport(code)
    };

    return {
      success: true,
      previewHTML,
      analysis,
      metadata: {
        ...metadata,
        generatedAt: new Date().toISOString(),
        codeHash: generateCodeHash(code),
        estimatedBundleSize: calculateEstimatedBundleSize(code, analysis.imports)
      },
      additionalData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: `Enhanced preview generation failed: ${error.message}`,
      suggestions: ['Check your code syntax', 'Ensure all imports are correct']
    };
  }
}

async function performEnhancedAnalysis(code, options) {
  const componentName = extractComponentName(code);
  const imports = extractImports(code);
  const hooks = extractHooks(code);
  const complexity = calculateComplexity(code);
  
  // Enhanced metrics
  const performance = calculatePerformanceMetrics(code);
  const accessibility = analyzeAccessibility(code);
  const security = analyzeSecurity(code);
  const maintainability = calculateMaintainabilityScore(code);
  const testability = calculateTestabilityScore(code);
  
  return {
    componentName,
    componentType: detectComponentType(code),
    hasState: code.includes('useState') || code.includes('this.state'),
    hasEffects: code.includes('useEffect'),
    hasProps: code.includes('props') || code.includes('{') && code.includes('}'),
    linesOfCode: code.split('\n').length,
    hasImports: code.includes('import'),
    hasExports: code.includes('export'),
    imports,
    hooks,
    complexity,
    performance,
    accessibility,
    security,
    maintainability,
    testability,
    description: generateComponentDescription(code, componentName, hooks, imports)
  };
}

function calculateCodeMetrics(code) {
  const lines = code.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*'));
  
  return {
    totalLines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    commentLines: commentLines.length,
    codeLines: nonEmptyLines.length - commentLines.length,
    commentRatio: commentLines.length / nonEmptyLines.length,
    averageLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length
  };
}

function generateCodeSuggestions(code, analysis) {
  const suggestions = [];
  
  // Performance suggestions
  if (analysis.performance.potentialBottlenecks.length > 0) {
    suggestions.push({
      category: 'performance',
      priority: 'high',
      message: 'Performance optimizations recommended',
      details: analysis.performance.potentialBottlenecks
    });
  }
  
  // Accessibility suggestions
  if (analysis.accessibility.issues.length > 0) {
    suggestions.push({
      category: 'accessibility',
      priority: 'medium',
      message: 'Accessibility improvements needed',
      details: analysis.accessibility.issues
    });
  }
  
  // Security suggestions
  if (analysis.security.issues.length > 0) {
    suggestions.push({
      category: 'security',
      priority: 'high',
      message: 'Security concerns detected',
      details: analysis.security.issues
    });
  }
  
  return suggestions;
}

function generateOptimizationTips(code, analysis) {
  const tips = [];
  
  if (!analysis.performance.hasMemoization && code.includes('useState')) {
    tips.push('Consider using React.memo for component memoization');
  }
  
  if (code.includes('useEffect') && !code.includes('useCallback')) {
    tips.push('Consider using useCallback to prevent unnecessary re-renders');
  }
  
  if (code.includes('map') && !code.includes('key=')) {
    tips.push('Add key props to list items for better performance');
  }
  
  return tips;
}

function generateAccessibilityReport(code) {
  const report = {
    score: 100,
    issues: [],
    recommendations: []
  };
  
  if (code.includes('<img') && !code.includes('alt=')) {
    report.score -= 20;
    report.issues.push('Missing alt attributes on images');
    report.recommendations.push('Add descriptive alt text to all images');
  }
  
  if (code.includes('onClick') && !code.includes('onKeyDown')) {
    report.score -= 15;
    report.issues.push('Missing keyboard support for interactive elements');
    report.recommendations.push('Add onKeyDown handlers for keyboard accessibility');
  }
  
  return report;
}

function generatePerformanceReport(code) {
  const report = {
    score: 100,
    issues: [],
    recommendations: []
  };
  
  const renderCount = (code.match(/useState/g) || []).length;
  if (renderCount > 5) {
    report.score -= 20;
    report.issues.push('High number of state updates may cause performance issues');
    report.recommendations.push('Consider using useReducer for complex state management');
  }
  
  if (code.includes('useEffect') && code.includes('[]')) {
    report.score -= 10;
    report.issues.push('Empty dependency arrays may miss required dependencies');
    report.recommendations.push('Review useEffect dependencies carefully');
  }
  
  return report;
}

function generateSecurityReport(code) {
  const report = {
    riskLevel: 'low',
    issues: [],
    recommendations: []
  };
  
  if (code.includes('dangerouslySetInnerHTML')) {
    report.riskLevel = 'high';
    report.issues.push('Using dangerouslySetInnerHTML - XSS risk');
    report.recommendations.push('Sanitize HTML content before rendering');
  }
  
  if (code.includes('eval(')) {
    report.riskLevel = 'critical';
    report.issues.push('Using eval() - major security risk');
    report.recommendations.push('Avoid eval() - use alternative approaches');
  }
  
  return report;
}

function calculateMaintainabilityScore(code) {
  let score = 100;
  
  // Reduce score for complex code
  const lines = code.split('\n').length;
  if (lines > 100) score -= 20;
  if (lines > 200) score -= 30;
  
  // Reduce score for complex logic
  const conditionalCount = (code.match(/if|else|switch/g) || []).length;
  if (conditionalCount > 10) score -= 15;
  
  return Math.max(0, score);
}

function calculateTestabilityScore(code) {
  let score = 100;
  
  // Reduce score for side effects
  if (code.includes('useEffect')) score -= 10;
  if (code.includes('addEventListener')) score -= 15;
  
  // Reduce score for complex state
  const stateCount = (code.match(/useState/g) || []).length;
  if (stateCount > 5) score -= 20;
  
  return Math.max(0, score);
}

function generateCodeHash(code) {
  // Simple hash function for code identification
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function calculateEstimatedBundleSize(code, imports) {
  let size = code.length * 0.1; // Base size
  
  imports.forEach(imp => {
    if (imp.source.includes('react')) size += 50;
    else if (imp.source.includes('@')) size += 30;
    else size += 20;
  });
  
  return Math.round(size);
}

// Import existing functions from live-preview.js
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

// Import these functions from the original live-preview.js
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

  if (code.includes('<img') && !code.includes('alt=')) {
    issues.push('Missing alt attribute on images');
    suggestions.push('Add alt attributes to all images for screen readers');
  }

  if (code.includes('onClick') && !code.includes('aria-label') && !code.includes('aria-labelledby')) {
    suggestions.push('Consider adding ARIA labels for interactive elements');
  }

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

  if (code.includes('dangerouslySetInnerHTML')) {
    issues.push('Using dangerouslySetInnerHTML - potential XSS risk');
    suggestions.push('Sanitize HTML content before using dangerouslySetInnerHTML');
  }

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

function estimateRenderCount(code) {
  let count = 1;
  if (code.includes('useState')) count += 2;
  if (code.includes('useEffect')) count += 1;
  if (code.includes('useContext')) count += 1;
  return count;
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

function calculateAccessibilityScore(code) {
  let score = 100;
  
  if (code.includes('<img') && !code.includes('alt=')) score -= 20;
  if (code.includes('onClick') && !code.includes('aria-label')) score -= 15;
  if (code.includes('<div') && code.includes('onClick')) score -= 10;
  
  return Math.max(0, score);
}

function generateAdvancedPreviewHTML(code, analysis, options) {
  // This would be the same as in the original live-preview.js
  // For brevity, we'll use a simplified version
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysis.componentName} - Enhanced Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root">
        <div style="padding: 20px;">
            <h2>Enhanced Preview for ${analysis.componentName}</h2>
            <p>Component analysis and enhanced features coming soon...</p>
        </div>
    </div>
</body>
</html>`;
} 
