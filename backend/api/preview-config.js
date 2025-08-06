// backend/api/preview-config.js

export const PREVIEW_CONFIG = {
  // Security settings
  security: {
    maxCodeSize: 100000, // 100KB
    allowedDomains: ['unpkg.com', 'cdn.jsdelivr.net', 'cdn.tailwindcss.com'],
    blockedKeywords: ['eval(', 'Function(', 'innerHTML', 'outerHTML'],
    enableCSP: true,
    enableXSSProtection: true
  },

  // Performance settings
  performance: {
    maxRenderTime: 5000, // 5 seconds
    enablePerformanceMonitoring: true,
    enableBundleSizeEstimation: true,
    enableRenderOptimization: true
  },

  // Accessibility settings
  accessibility: {
    enableAccessibilityChecking: true,
    enableARIALabels: true,
    enableKeyboardSupport: true,
    enableScreenReaderSupport: true
  },

  // Debug settings
  debug: {
    enableDebugPanel: true,
    enableConsoleLogging: true,
    enableErrorReporting: true,
    enablePerformanceMetrics: true
  },

  // Collaboration settings
  collaboration: {
    enableRealTimeCollaboration: false,
    enableVersionHistory: true,
    enableCodeSharing: false,
    maxCollaborators: 5
  },

  // Analysis settings
  analysis: {
    enableCodeAnalysis: true,
    enableComplexityAnalysis: true,
    enableSecurityAnalysis: true,
    enablePerformanceAnalysis: true,
    enableAccessibilityAnalysis: true,
    enableMaintainabilityAnalysis: true,
    enableTestabilityAnalysis: true
  },

  // Preview settings
  preview: {
    enableHotReload: true,
    enableErrorBoundary: true,
    enableMockComponents: true,
    enableTypeScriptSupport: true,
    enableJSXSupport: true,
    enableTailwindCSS: true,
    enableCustomStyles: true
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    enableGracefulDegradation: true,
    enableErrorRecovery: true
  },

  // Caching
  caching: {
    enableCodeCaching: true,
    cacheExpiration: 3600000, // 1 hour
    enablePreviewCaching: true,
    maxCacheSize: 100 // MB
  }
};

export const ANALYSIS_RULES = {
  performance: {
    maxHooks: 10,
    maxStateVariables: 5,
    maxEffectDependencies: 5,
    maxRenderTime: 100 // ms
  },
  
  accessibility: {
    requiredAltText: true,
    requiredARIALabels: true,
    requiredKeyboardSupport: true,
    requiredSemanticHTML: true
  },
  
  security: {
    allowEval: false,
    allowInnerHTML: false,
    allowDangerousProps: false,
    requireSanitization: true
  },
  
  maintainability: {
    maxLinesPerComponent: 200,
    maxComplexity: 10,
    maxNestingLevel: 5,
    requireComments: false
  }
};

export const MOCK_COMPONENTS = {
  // UI Components
  Button: {
    props: ['children', 'onClick', 'disabled', 'variant'],
    defaultProps: { variant: 'primary' }
  },
  Input: {
    props: ['value', 'onChange', 'placeholder', 'type'],
    defaultProps: { type: 'text' }
  },
  Card: {
    props: ['children', 'title', 'subtitle'],
    defaultProps: {}
  },
  
  // Layout Components
  Container: {
    props: ['children', 'maxWidth', 'padding'],
    defaultProps: { maxWidth: '1200px', padding: '1rem' }
  },
  Grid: {
    props: ['children', 'columns', 'gap'],
    defaultProps: { columns: 1, gap: '1rem' }
  },
  
  // Navigation Components
  Header: {
    props: ['children', 'title', 'logo'],
    defaultProps: {}
  },
  Navigation: {
    props: ['items', 'activeItem'],
    defaultProps: { items: [] }
  },
  
  // Data Components
  Table: {
    props: ['data', 'columns'],
    defaultProps: { data: [], columns: [] }
  },
  List: {
    props: ['items', 'renderItem'],
    defaultProps: { items: [] }
  }
};

export const ERROR_MESSAGES = {
  CODE_TOO_LARGE: 'Code size exceeds maximum limit of 100KB',
  SECURITY_RISK: 'Security risk detected in code',
  SYNTAX_ERROR: 'Syntax error in component code',
  RENDER_TIMEOUT: 'Component render timeout',
  DEPENDENCY_ERROR: 'Missing or invalid dependency',
  ACCESSIBILITY_ISSUE: 'Accessibility issue detected',
  PERFORMANCE_ISSUE: 'Performance issue detected'
};

export const SUGGESTIONS = {
  performance: [
    'Use React.memo for component memoization',
    'Use useCallback for function memoization',
    'Use useMemo for expensive calculations',
    'Add key props to list items',
    'Optimize re-renders with proper dependencies'
  ],
  
  accessibility: [
    'Add alt text to all images',
    'Use semantic HTML elements',
    'Add ARIA labels to interactive elements',
    'Ensure keyboard navigation support',
    'Provide sufficient color contrast'
  ],
  
  security: [
    'Avoid using dangerouslySetInnerHTML',
    'Sanitize user input before rendering',
    'Avoid using eval() or Function()',
    'Validate all props and state',
    'Use Content Security Policy'
  ],
  
  maintainability: [
    'Keep components small and focused',
    'Use meaningful variable names',
    'Add comments for complex logic',
    'Follow consistent code style',
    'Extract reusable components'
  ]
};

export const FEATURE_FLAGS = {
  ENABLE_ENHANCED_ANALYSIS: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ACCESSIBILITY_CHECKING: true,
  ENABLE_SECURITY_SCANNING: true,
  ENABLE_CODE_SUGGESTIONS: true,
  ENABLE_REAL_TIME_COLLABORATION: false,
  ENABLE_VERSION_HISTORY: true,
  ENABLE_DEBUG_PANEL: true,
  ENABLE_ERROR_RECOVERY: true,
  ENABLE_CACHING: true
};

export function getConfigForEnvironment(environment = 'production') {
  const config = { ...PREVIEW_CONFIG };
  
  if (environment === 'development') {
    config.debug.enableDebugPanel = true;
    config.debug.enableConsoleLogging = true;
    config.performance.enablePerformanceMonitoring = true;
    config.analysis.enableCodeAnalysis = true;
  } else if (environment === 'production') {
    config.debug.enableDebugPanel = false;
    config.debug.enableConsoleLogging = false;
    config.performance.enablePerformanceMonitoring = false;
    config.analysis.enableCodeAnalysis = true;
  }
  
  return config;
}

export function validateConfig(config) {
  const errors = [];
  
  if (config.security.maxCodeSize > 500000) {
    errors.push('Max code size too high for security');
  }
  
  if (config.performance.maxRenderTime > 10000) {
    errors.push('Max render time too high for user experience');
  }
  
  if (config.collaboration.maxCollaborators > 10) {
    errors.push('Too many collaborators may impact performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 
