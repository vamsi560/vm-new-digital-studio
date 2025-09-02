import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EvaluatorAgents {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.gemini = new GoogleGenerativeAI("AIzaSyBcR6rMwP9v8e2cN56gdnkWMhJtOWyP_uU");
    
    this.evaluationCriteria = {
      codeQuality: {
        readability: { weight: 0.15, description: 'Code readability and structure' },
        maintainability: { weight: 0.15, description: 'Code maintainability and organization' },
        documentation: { weight: 0.10, description: 'Code documentation and comments' },
        naming: { weight: 0.10, description: 'Variable and function naming conventions' }
      },
      performance: {
        efficiency: { weight: 0.15, description: 'Code efficiency and optimization' },
        memory: { weight: 0.10, description: 'Memory usage and management' },
        speed: { weight: 0.10, description: 'Execution speed and responsiveness' }
      },
      accessibility: {
        wcag: { weight: 0.20, description: 'WCAG compliance and accessibility features' },
        usability: { weight: 0.15, description: 'User experience and usability' },
        responsive: { weight: 0.10, description: 'Responsive design implementation' }
      },
      security: {
        vulnerabilities: { weight: 0.25, description: 'Security vulnerabilities and best practices' },
        dataProtection: { weight: 0.15, description: 'Data protection and privacy' },
        inputValidation: { weight: 0.10, description: 'Input validation and sanitization' }
      }
    };
  }

  async evaluateCodeQuality(code, framework, platform) {
    try {
      const evaluations = await Promise.all([
        this.evaluateWithOpenAI(code, framework, platform),
        this.evaluateWithGemini(code, framework, platform),
        this.evaluateWithStaticAnalysis(code, framework, platform),
        this.evaluateWithBestPractices(code, framework, platform)
      ]);

      // Combine evaluations
      const combinedEvaluation = this.combineEvaluations(evaluations);
      
      // Generate detailed report
      const report = await this.generateEvaluationReport(combinedEvaluation, code, framework, platform);
      
      // Save evaluation results
      await this.saveEvaluationResults(combinedEvaluation, report, framework, platform);

      return {
        success: true,
        evaluation: combinedEvaluation,
        report: report,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Code evaluation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async evaluateWithOpenAI(code, framework, platform) {
    const prompt = this.buildEvaluationPrompt(code, framework, platform, 'openai');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer specializing in pixel-perfect implementations. Provide detailed, objective evaluations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    return this.parseEvaluationResponse(response.choices[0].message.content);
  }

  async evaluateWithGemini(code, framework, platform) {
    const prompt = this.buildEvaluationPrompt(code, framework, platform, 'gemini');
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    return this.parseEvaluationResponse(result.response.text());
  }

  async evaluateWithStaticAnalysis(code, framework, platform) {
    const analysis = {
      codeQuality: { score: 0, issues: [] },
      performance: { score: 0, issues: [] },
      accessibility: { score: 0, issues: [] },
      security: { score: 0, issues: [] }
    };

    // Static analysis rules
    const rules = this.getStaticAnalysisRules(framework, platform);
    
    for (const [category, categoryRules] of Object.entries(rules)) {
      let categoryScore = 0;
      const issues = [];

      for (const rule of categoryRules) {
        const result = this.applyStaticRule(code, rule);
        if (result.passed) {
          categoryScore += rule.weight;
        } else {
          issues.push(result.issue);
        }
      }

      analysis[category] = {
        score: Math.min(10, categoryScore * 10),
        issues: issues
      };
    }

    return analysis;
  }

  async evaluateWithBestPractices(code, framework, platform) {
    const bestPractices = this.getBestPractices(framework, platform);
    const evaluation = {
      codeQuality: { score: 0, issues: [] },
      performance: { score: 0, issues: [] },
      accessibility: { score: 0, issues: [] },
      security: { score: 0, issues: [] }
    };

    for (const [category, practices] of Object.entries(bestPractices)) {
      let categoryScore = 0;
      const issues = [];

      for (const practice of practices) {
        const result = this.checkBestPractice(code, practice);
        if (result.followed) {
          categoryScore += practice.weight;
        } else {
          issues.push(result.reason);
        }
      }

      evaluation[category] = {
        score: Math.min(10, categoryScore * 10),
        issues: issues
      };
    }

    return evaluation;
  }

  buildEvaluationPrompt(code, framework, platform, model) {
    return `
Evaluate the following ${framework} code for ${platform} platform:

${code}

Provide a comprehensive evaluation covering:

1. Code Quality (1-10):
   - Readability and structure
   - Maintainability
   - Documentation
   - Naming conventions

2. Performance (1-10):
   - Efficiency
   - Memory usage
   - Execution speed

3. Accessibility (1-10):
   - WCAG compliance
   - Usability
   - Responsive design

4. Security (1-10):
   - Vulnerabilities
   - Data protection
   - Input validation

For each category, provide:
- Score (1-10)
- Specific issues found
- Recommendations for improvement

Return the evaluation as JSON format with the following structure:
{
  "codeQuality": { "score": number, "issues": [string], "recommendations": [string] },
  "performance": { "score": number, "issues": [string], "recommendations": [string] },
  "accessibility": { "score": number, "issues": [string], "recommendations": [string] },
  "security": { "score": number, "issues": [string], "recommendations": [string] },
  "overallScore": number
}
    `;
  }

  parseEvaluationResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return this.parseTextResponse(response);
    } catch (error) {
      console.warn('Failed to parse evaluation response:', error);
      return this.parseTextResponse(response);
    }
  }

  parseTextResponse(response) {
    const evaluation = {
      codeQuality: { score: 5, issues: [], recommendations: [] },
      performance: { score: 5, issues: [], recommendations: [] },
      accessibility: { score: 5, issues: [], recommendations: [] },
      security: { score: 5, issues: [], recommendations: [] },
      overallScore: 5
    };

    // Extract scores using regex
    const scoreRegex = /(\w+)\s*[:\-]\s*(\d+)/gi;
    let match;
    
    while ((match = scoreRegex.exec(response)) !== null) {
      const [, category, score] = match;
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '');
      
      if (evaluation[normalizedCategory]) {
        evaluation[normalizedCategory].score = Math.min(10, Math.max(1, parseInt(score)));
      }
    }

    // Calculate overall score
    const scores = Object.values(evaluation).filter(v => typeof v === 'object' && v.score);
    evaluation.overallScore = scores.reduce((sum, v) => sum + v.score, 0) / scores.length;

    return evaluation;
  }

  combineEvaluations(evaluations) {
    const combined = {
      codeQuality: { score: 0, issues: [], recommendations: [] },
      performance: { score: 0, issues: [], recommendations: [] },
      accessibility: { score: 0, issues: [], recommendations: [] },
      security: { score: 0, issues: [], recommendations: [] },
      overallScore: 0
    };

    // Weight the evaluations (OpenAI gets higher weight)
    const weights = [0.4, 0.3, 0.2, 0.1];

    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      const weight = weights[i] || 0.1;

      for (const [category, data] of Object.entries(evaluation)) {
        if (category === 'overallScore') continue;
        
        if (combined[category]) {
          combined[category].score += (data.score || 0) * weight;
          combined[category].issues.push(...(data.issues || []));
          combined[category].recommendations.push(...(data.recommendations || []));
        }
      }
    }

    // Calculate overall score
    const scores = Object.values(combined).filter(v => typeof v === 'object' && v.score);
    combined.overallScore = scores.reduce((sum, v) => sum + v.score, 0) / scores.length;

    return combined;
  }

  getStaticAnalysisRules(framework, platform) {
    const baseRules = {
      codeQuality: [
        { pattern: /\/\*[\s\S]*?\*\//, weight: 0.2, description: 'Code documentation' },
        { pattern: /function\s+\w+/, weight: 0.3, description: 'Function definitions' },
        { pattern: /const\s+\w+\s*=/, weight: 0.2, description: 'Const declarations' },
        { pattern: /let\s+\w+\s*=/, weight: 0.1, description: 'Let declarations' }
      ],
      performance: [
        { pattern: /useMemo|useCallback/, weight: 0.4, description: 'Performance optimizations' },
        { pattern: /React\.memo/, weight: 0.3, description: 'Component memoization' },
        { pattern: /lazy\(/, weight: 0.3, description: 'Code splitting' }
      ],
      accessibility: [
        { pattern: /aria-/, weight: 0.4, description: 'ARIA attributes' },
        { pattern: /alt=/, weight: 0.3, description: 'Image alt text' },
        { pattern: /role=/, weight: 0.3, description: 'Semantic roles' }
      ],
      security: [
        { pattern: /dangerouslySetInnerHTML/, weight: -0.5, description: 'XSS vulnerability' },
        { pattern: /eval\(/, weight: -0.5, description: 'Code injection risk' },
        { pattern: /innerHTML/, weight: -0.3, description: 'Potential XSS' }
      ]
    };

    // Add framework-specific rules
    if (framework.toLowerCase() === 'react') {
      baseRules.codeQuality.push(
        { pattern: /useState|useEffect/, weight: 0.2, description: 'React hooks usage' }
      );
    }

    return baseRules;
  }

  getBestPractices(framework, platform) {
    return {
      codeQuality: [
        { pattern: /\/\/\s*TODO/, weight: -0.1, description: 'TODO comments' },
        { pattern: /console\.log/, weight: -0.1, description: 'Console logs in production' },
        { pattern: /\/\*\*[\s\S]*?\*\//, weight: 0.2, description: 'JSDoc comments' }
      ],
      performance: [
        { pattern: /useMemo/, weight: 0.3, description: 'Memoization usage' },
        { pattern: /useCallback/, weight: 0.3, description: 'Callback memoization' },
        { pattern: /React\.memo/, weight: 0.4, description: 'Component memoization' }
      ],
      accessibility: [
        { pattern: /aria-label/, weight: 0.3, description: 'ARIA labels' },
        { pattern: /tabIndex/, weight: 0.2, description: 'Keyboard navigation' },
        { pattern: /onKeyDown|onKeyUp/, weight: 0.2, description: 'Keyboard event handlers' }
      ],
      security: [
        { pattern: /sanitize|escape/, weight: 0.4, description: 'Input sanitization' },
        { pattern: /https:\/\//, weight: 0.2, description: 'Secure URLs' },
        { pattern: /Content-Security-Policy/, weight: 0.3, description: 'CSP headers' }
      ]
    };
  }

  applyStaticRule(code, rule) {
    const matches = code.match(rule.pattern);
    return {
      passed: rule.weight > 0 ? !!matches : !matches,
      issue: rule.weight < 0 ? rule.description : null
    };
  }

  checkBestPractice(code, practice) {
    const matches = code.match(practice.pattern);
    return {
      followed: practice.weight > 0 ? !!matches : !matches,
      reason: practice.weight < 0 ? practice.description : null
    };
  }

  async generateEvaluationReport(evaluation, code, framework, platform) {
    const prompt = `
Generate a comprehensive evaluation report for the following ${framework} code:

Code:
${code}

Evaluation Results:
${JSON.stringify(evaluation, null, 2)}

Create a detailed markdown report including:
1. Executive Summary
2. Detailed Analysis by Category
3. Critical Issues
4. Recommendations
5. Action Items
6. Quality Score Breakdown

Make the report professional and actionable.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical writer specializing in code quality reports.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  async saveEvaluationResults(evaluation, report, framework, platform) {
    const timestamp = Date.now();
    const evaluationDir = path.join(__dirname, '../evaluations');
    await fs.ensureDir(evaluationDir);

    const filename = `evaluation-${framework}-${platform}-${timestamp}`;
    
    // Save evaluation data
    const evaluationPath = path.join(evaluationDir, `${filename}.json`);
    await fs.writeFile(evaluationPath, JSON.stringify(evaluation, null, 2));

    // Save report
    const reportPath = path.join(evaluationDir, `${filename}.md`);
    await fs.writeFile(reportPath, report);

    return { evaluationPath, reportPath };
  }
}

export default EvaluatorAgents; 