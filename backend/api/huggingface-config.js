// Best Hugging Face Models for UI Code Generation

export const HUGGINGFACE_MODELS = {
  // 🏆 BEST MODEL FOR UI GENERATION
  wizardcoder15b: {
    name: 'WizardCoder-15B-V1.0',
    modelId: 'WizardLM/WizardCoder-15B-V1.0',
    description: 'Best model for React/JSX and UI component generation',
    strengths: [
      'Excellent React/JSX generation',
      'Superior UI component creation',
      'Great Tailwind CSS understanding',
      'Component architecture expertise',
      'State management patterns'
    ],
    bestFor: [
      'React components',
      'UI libraries',
      'Component systems',
      'Frontend architecture',
      'Modern web development'
    ],
    size: '15B parameters',
    performance: 'High quality, medium speed',
    url: 'https://huggingface.co/WizardLM/WizardCoder-15B-V1.0'
  },

  // 🥈 SECOND BEST FOR GENERAL WEB DEVELOPMENT
  codellama13b: {
    name: 'CodeLlama-13B-hf',
    modelId: 'codellama/CodeLlama-13b-hf',
    description: 'Meta\'s excellent general-purpose code generation model',
    strengths: [
      'Multi-language support',
      'Excellent code structure',
      'Good reasoning capabilities',
      'Framework understanding',
      'Best practices knowledge'
    ],
    bestFor: [
      'General web development',
      'Multiple frameworks',
      'Backend code',
      'API generation',
      'Code architecture'
    ],
    size: '13B parameters',
    performance: 'High quality, medium speed',
    url: 'https://huggingface.co/codellama/CodeLlama-13b-hf'
  },

  // 🥉 BEST FOR MOBILE DEVELOPMENT
  deepseekCoder67b: {
    name: 'DeepSeek-Coder-6.7B-Instruct',
    modelId: 'deepseek-ai/deepseek-coder-6.7b-instruct',
    description: 'Excellent for mobile and platform-specific code generation',
    strengths: [
      'Mobile development expertise',
      'Platform-specific APIs',
      'Performance optimization',
      'Native code generation',
      'Best practices for mobile'
    ],
    bestFor: [
      'Android (Kotlin)',
      'iOS (Swift)',
      'Mobile optimization',
      'Platform APIs',
      'Mobile architecture'
    ],
    size: '6.7B parameters',
    performance: 'Good quality, fast speed',
    url: 'https://huggingface.co/deepseek-ai/deepseek-coder-6.7b-instruct'
  },

  // ⚡ FAST INFERENCE FOR REAL-TIME
  codellama7b: {
    name: 'CodeLlama-7B-hf',
    modelId: 'codellama/CodeLlama-7b-hf',
    description: 'Fast inference model for real-time code generation',
    strengths: [
      'Very fast inference',
      'Good for prototyping',
      'Real-time generation',
      'Lower resource usage',
      'Quick iterations'
    ],
    bestFor: [
      'Real-time preview',
      'Quick prototyping',
      'Simple components',
      'Live coding',
      'Fast iterations'
    ],
    size: '7B parameters',
    performance: 'Medium quality, very fast',
    url: 'https://huggingface.co/codellama/CodeLlama-7b-hf'
  }
};

// Model Selection Strategy
export const MODEL_SELECTION = {
  // Web Development
  web: {
    react: {
      primary: 'wizardcoder15b',      // Best for React
      fallback: 'codellama13b',       // Good alternative
      fast: 'codellama7b'             // Fast inference
    },
    vue: {
      primary: 'codellama13b',        // Good for Vue
      fallback: 'deepseekCoder67b',   // Alternative
      fast: 'codellama7b'             // Fast inference
    },
    angular: {
      primary: 'codellama13b',        // Good for Angular
      fallback: 'deepseekCoder67b',   // Alternative
      fast: 'codellama7b'             // Fast inference
    }
  },

  // Mobile Development
  mobile: {
    android: {
      primary: 'deepseekCoder67b',    // Best for Android
      fallback: 'codellama13b',       // Good alternative
      fast: 'codellama7b'             // Fast inference
    },
    ios: {
      primary: 'deepseekCoder67b',    // Best for iOS
      fallback: 'codellama13b',       // Good alternative
      fast: 'codellama7b'             // Fast inference
    }
  },

  // Specialized Tasks
  specialized: {
    uiComponents: 'wizardcoder15b',   // Best for UI
    responsiveDesign: 'wizardcoder15b', // Best for responsive
    stateManagement: 'codellama13b',   // Good for logic
    performance: 'deepseekCoder67b',   // Good for optimization
    accessibility: 'codellama13b',     // Good for best practices
    testing: 'codellama13b'           // Good for test code
  }
};

// Performance Profiles
export const PERFORMANCE_PROFILES = {
  realtime: {
    maxTokens: 1024,
    temperature: 0.1,
    model: 'codellama7b',
    useCase: 'Live preview, real-time generation',
    speed: 'Very Fast',
    quality: 'Medium'
  },
  balanced: {
    maxTokens: 2048,
    temperature: 0.1,
    model: 'wizardcoder15b',
    useCase: 'Standard development, good quality',
    speed: 'Medium',
    quality: 'High'
  },
  quality: {
    maxTokens: 4096,
    temperature: 0.05,
    model: 'wizardcoder15b',
    useCase: 'Production code, maximum quality',
    speed: 'Medium',
    quality: 'Very High'
  }
};

// Model Capabilities Matrix
export const MODEL_CAPABILITIES = {
  'wizardcoder15b': {
    languages: ['JavaScript', 'TypeScript', 'React', 'JSX', 'HTML', 'CSS'],
    uiGeneration: '⭐⭐⭐⭐⭐',
    codeQuality: '⭐⭐⭐⭐⭐',
    reasoning: '⭐⭐⭐⭐',
    speed: '⭐⭐⭐',
    memoryUsage: '⭐⭐⭐',
    bestUseCase: 'React components and UI generation'
  },
  'codellama13b': {
    languages: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML', 'CSS', 'Python', 'Java', 'C++'],
    uiGeneration: '⭐⭐⭐⭐',
    codeQuality: '⭐⭐⭐⭐⭐',
    reasoning: '⭐⭐⭐⭐⭐',
    speed: '⭐⭐⭐',
    memoryUsage: '⭐⭐⭐',
    bestUseCase: 'General web development and architecture'
  },
  'deepseekCoder67b': {
    languages: ['JavaScript', 'TypeScript', 'React', 'Kotlin', 'Swift', 'Python', 'Java'],
    uiGeneration: '⭐⭐⭐⭐',
    codeQuality: '⭐⭐⭐⭐',
    reasoning: '⭐⭐⭐⭐⭐',
    speed: '⭐⭐⭐⭐',
    memoryUsage: '⭐⭐⭐⭐',
    bestUseCase: 'Mobile development and platform-specific code'
  },
  'codellama7b': {
    languages: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Python'],
    uiGeneration: '⭐⭐⭐',
    codeQuality: '⭐⭐⭐',
    reasoning: '⭐⭐⭐',
    speed: '⭐⭐⭐⭐⭐',
    memoryUsage: '⭐⭐⭐⭐⭐',
    bestUseCase: 'Fast prototyping and real-time generation'
  }
};

// Recommended Model for Different Scenarios
export const RECOMMENDATIONS = {
  // For most users - best balance of quality and speed
  default: 'wizardcoder15b',
  
  // For React developers
  reactDeveloper: 'wizardcoder15b',
  
  // For mobile developers
  mobileDeveloper: 'deepseekCoder67b',
  
  // For real-time applications
  realtime: 'codellama7b',
  
  // For production code
  production: 'wizardcoder15b',
  
  // For prototyping
  prototyping: 'codellama7b'
}; 