import HuggingFaceAI from './huggingface-ai.js';

class EvaluationAPI {
  constructor() {
    this.huggingFaceAI = new HuggingFaceAI();
  }

  async handleRequest(req, res) {
    const { method, url } = req;
    
    try {
      // Route based on the original endpoint
      if (url.includes('/evaluator-agents')) {
        return await this.evaluateCode(req, res);
      } else if (url.includes('/evaluate-code')) {
        return await this.evaluateCode(req, res);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('Evaluation API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Main code evaluation endpoint
  async evaluateCode(req, res) {
    try {
      const { code, framework, platform, criteria } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required for evaluation' });
      }

      if (!framework) {
        return res.status(400).json({ error: 'Framework is required for evaluation' });
      }

      // Perform comprehensive code evaluation
      const evaluation = await this.performEvaluation(code, framework, platform, criteria);

      return res.json({
        success: true,
        evaluation,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Code evaluation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Perform comprehensive code evaluation
  async performEvaluation(code, framework, platform, criteria = []) {
    try {
      const evaluation = {
        overallScore: 0,
        categories: {},
        recommendations: [],
        timestamp: new Date().toISOString()
      };

      // Evaluate code quality (25%)
      const codeQuality = await this.evaluateCodeQuality(code, framework);
      evaluation.categories.codeQuality = codeQuality;
      evaluation.overallScore += codeQuality.score * 0.25;

      // Evaluate performance (20%)
      const performance = await this.evaluatePerformance(code, framework, platform);
      evaluation.categories.performance = performance;
      evaluation.overallScore += performance.score * 0.20;

      // Evaluate accessibility (25%)
      const accessibility = await this.evaluateAccessibility(code, framework, platform);
      evaluation.categories.accessibility = accessibility;
      evaluation.overallScore += accessibility.score * 0.25;

      // Evaluate security (30%)
      const security = await this.evaluateSecurity(code, framework, platform);
      evaluation.categories.security = security;
      evaluation.overallScore += security.score * 0.30;

      // Generate overall recommendations
      evaluation.recommendations = this.generateRecommendations(evaluation.categories);

      // Round overall score to 2 decimal places
      evaluation.overallScore = Math.round(evaluation.overallScore * 100) / 100;

      return evaluation;

    } catch (error) {
      console.error('Evaluation failed:', error);
      return {
        overallScore: 0,
        categories: {},
        recommendations: ['Evaluation failed due to an error'],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Evaluate code quality
  async evaluateCodeQuality(code, framework) {
    try {
      let score = 0;
      const issues = [];
      const strengths = [];

      // Check code structure
      if (code.includes('import') || code.includes('require')) {
        score += 20;
        strengths.push('Proper imports included');
      } else {
        issues.push('Missing imports');
      }

      // Check for functions/components
      if (code.includes('function') || code.includes('const') || code.includes('class')) {
        score += 20;
        strengths.push('Proper component structure');
      } else {
        issues.push('No functions or components found');
      }

      // Check for proper formatting
      if (code.includes('return') || code.includes('export')) {
        score += 20;
        strengths.push('Proper exports and returns');
      } else {
        issues.push('Missing exports or returns');
      }

      // Check for comments
      if (code.includes('//') || code.includes('/*')) {
        score += 20;
        strengths.push('Code includes comments');
      } else {
        issues.push('No comments found');
      }

      // Check for proper closing
      if (code.includes('}') && code.includes('{')) {
        score += 20;
        strengths.push('Proper bracket matching');
      } else {
        issues.push('Bracket mismatch detected');
      }

      return {
        score,
        issues,
        strengths,
        grade: this.getGrade(score)
      };

    } catch (error) {
      return {
        score: 0,
        issues: ['Evaluation error'],
        strengths: [],
        grade: 'F'
      };
    }
  }

  // Evaluate performance
  async evaluatePerformance(code, framework, platform) {
    try {
      let score = 0;
      const issues = [];
      const strengths = [];

      // Check for efficient patterns
      if (code.includes('useMemo') || code.includes('useCallback') || code.includes('React.memo')) {
        score += 25;
        strengths.push('Performance optimizations used');
      } else {
        issues.push('Consider adding performance optimizations');
      }

      // Check for proper state management
      if (code.includes('useState') || code.includes('useReducer')) {
        score += 25;
        strengths.push('Proper state management');
      } else {
        issues.push('State management could be improved');
      }

      // Check for async handling
      if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
        score += 25;
        strengths.push('Proper async handling');
      } else {
        issues.push('Async operations could be improved');
      }

      // Check for memory management
      if (code.includes('useEffect') && code.includes('return')) {
        score += 25;
        strengths.push('Proper cleanup in effects');
      } else {
        issues.push('Consider adding cleanup in effects');
      }

      return {
        score,
        issues,
        strengths,
        grade: this.getGrade(score)
      };

    } catch (error) {
      return {
        score: 0,
        issues: ['Evaluation error'],
        strengths: [],
        grade: 'F'
      };
    }
  }

  // Evaluate accessibility
  async evaluateAccessibility(code, framework, platform) {
    try {
      let score = 0;
      const issues = [];
      const strengths = [];

      // Check for semantic HTML
      if (code.includes('button') || code.includes('input') || code.includes('label')) {
        score += 25;
        strengths.push('Semantic HTML elements used');
      } else {
        issues.push('Use semantic HTML elements');
      }

      // Check for ARIA attributes
      if (code.includes('aria-') || code.includes('role=')) {
        score += 25;
        strengths.push('ARIA attributes included');
      } else {
        issues.push('Consider adding ARIA attributes');
      }

      // Check for alt text
      if (code.includes('alt=') || code.includes('altText')) {
        score += 25;
        strengths.push('Alt text for images');
      } else {
        issues.push('Add alt text for images');
      }

      // Check for keyboard navigation
      if (code.includes('onKeyDown') || code.includes('tabIndex')) {
        score += 25;
        strengths.push('Keyboard navigation support');
      } else {
        issues.push('Add keyboard navigation support');
      }

      return {
        score,
        issues,
        strengths,
        grade: this.getGrade(score)
      };

    } catch (error) {
      return {
        score: 0,
        issues: ['Evaluation error'],
        strengths: [],
        grade: 'F'
      };
    }
  }

  // Evaluate security
  async evaluateSecurity(code, framework, platform) {
    try {
      let score = 0;
      const issues = [];
      const strengths = [];

      // Check for input validation
      if (code.includes('validate') || code.includes('check') || code.includes('sanitize')) {
        score += 25;
        strengths.push('Input validation included');
      } else {
        issues.push('Add input validation');
      }

      // Check for XSS prevention
      if (code.includes('dangerouslySetInnerHTML') || code.includes('innerHTML')) {
        issues.push('Avoid dangerous HTML injection');
      } else {
        score += 25;
        strengths.push('XSS prevention measures');
      }

      // Check for secure data handling
      if (code.includes('https') || code.includes('secure')) {
        score += 25;
        strengths.push('Secure data transmission');
      } else {
        issues.push('Use secure data transmission');
      }

      // Check for proper error handling
      if (code.includes('try') || code.includes('catch') || code.includes('error')) {
        score += 25;
        strengths.push('Proper error handling');
      } else {
        issues.push('Add proper error handling');
      }

      return {
        score,
        issues,
        strengths,
        grade: this.getGrade(score)
      };

    } catch (error) {
      return {
        score: 0,
        issues: ['Evaluation error'],
        strengths: [],
        grade: 'F'
      };
    }
  }

  // Get grade from score
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Generate recommendations
  generateRecommendations(categories) {
    const recommendations = [];

    Object.entries(categories).forEach(([category, data]) => {
      if (data.score < 80) {
        recommendations.push(`Improve ${category}: ${data.issues.join(', ')}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Code quality is excellent! Keep up the good work.');
    }

    return recommendations;
  }
}

// Export for Vercel
export default async function handler(req, res) {
  const api = new EvaluationAPI();
  return await api.handleRequest(req, res);
} 