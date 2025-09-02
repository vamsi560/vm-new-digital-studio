import HuggingFaceAI from './huggingface-ai.js';

class MobileGenerationAPI {
  constructor() {
    this.huggingFaceAI = new HuggingFaceAI();
  }

  async handleRequest(req, res) {
    const { method, url } = req;
    
    try {
      // Route based on the original endpoint
      if (url.includes('/generate-android')) {
        return await this.generateAndroid(req, res);
      } else if (url.includes('/generate-ios')) {
        return await this.generateIOS(req, res);
      } else if (url.includes('/generate-native-code')) {
        return await this.generateNativeCode(req, res);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('Mobile generation API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Generate Android code
  async generateAndroid(req, res) {
    try {
      const { images, architecture, customLogic, features } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const prompt = this.buildAndroidPrompt(images, architecture, customLogic, features);
      
      const result = await this.huggingFaceAI.generateCode(prompt, {
        platform: 'android',
        framework: 'Kotlin',
        styling: 'Native',
        architecture,
        customLogic
      });

      return res.json({
        success: true,
        platform: 'android',
        code: result.code,
        model: result.model,
        architecture,
        features: features || [],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Android generation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate iOS code
  async generateIOS(req, res) {
    try {
      const { images, architecture, customLogic, features } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const prompt = this.buildIOSPrompt(images, architecture, customLogic, features);
      
      const result = await this.huggingFaceAI.generateCode(prompt, {
        platform: 'ios',
        framework: 'Swift',
        styling: 'Native',
        architecture,
        customLogic
      });

      return res.json({
        success: true,
        platform: 'ios',
        code: result.code,
        model: result.model,
        architecture,
        features: features || [],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('iOS generation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate native code for any platform
  async generateNativeCode(req, res) {
    try {
      const { images, platform, architecture, customLogic, features } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      if (!platform || !['android', 'ios'].includes(platform)) {
        return res.status(400).json({ error: 'Platform must be android or ios' });
      }

      const prompt = platform === 'android' 
        ? this.buildAndroidPrompt(images, architecture, customLogic, features)
        : this.buildIOSPrompt(images, architecture, customLogic, features);
      
      const result = await this.huggingFaceAI.generateCode(prompt, {
        platform,
        framework: platform === 'android' ? 'Kotlin' : 'Swift',
        styling: 'Native',
        architecture,
        customLogic
      });

      return res.json({
        success: true,
        platform,
        code: result.code,
        model: result.model,
        architecture,
        features: features || [],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Native code generation failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Build Android prompt
  buildAndroidPrompt(images, architecture, customLogic, features) {
    let prompt = `Generate Android native code using Kotlin with ${architecture} architecture.`;
    
    if (customLogic) {
      prompt += ` Include custom logic: ${customLogic}.`;
    }
    
    if (features && features.length > 0) {
      prompt += ` Include features: ${features.join(', ')}.`;
    }
    
    prompt += ` Follow Android best practices, use modern Android APIs, and ensure the code is production-ready.`;
    
    return prompt;
  }

  // Build iOS prompt
  buildIOSPrompt(images, architecture, customLogic, features) {
    let prompt = `Generate iOS native code using Swift with ${architecture} architecture.`;
    
    if (customLogic) {
      prompt += ` Include custom logic: ${customLogic}.`;
    }
    
    if (features && features.length > 0) {
      prompt += ` Include features: ${features.join(', ')}.`;
    }
    
    prompt += ` Follow iOS best practices, use modern iOS APIs, and ensure the code is production-ready.`;
    
    return prompt;
  }

  // Get platform-specific best practices
  getBestPractices(platform) {
    if (platform === 'android') {
      return {
        architecture: ['MVVM', 'MVC', 'Clean Architecture', 'Repository Pattern'],
        ui: ['Material Design', 'ConstraintLayout', 'RecyclerView', 'ViewPager2'],
        networking: ['Retrofit', 'OkHttp', 'Coroutines', 'LiveData'],
        database: ['Room', 'SQLite', 'DataStore', 'SharedPreferences']
      };
    } else if (platform === 'ios') {
      return {
        architecture: ['MVVM', 'MVC', 'VIPER', 'Clean Architecture'],
        ui: ['SwiftUI', 'UIKit', 'Auto Layout', 'Collection View'],
        networking: ['URLSession', 'Combine', 'Alamofire', 'Codable'],
        database: ['Core Data', 'UserDefaults', 'Keychain', 'FileManager']
      };
    }
    return {};
  }

  // Validate mobile-specific requirements
  validateMobileRequirements(platform, architecture, features) {
    const errors = [];
    
    if (!platform || !['android', 'ios'].includes(platform)) {
      errors.push('Platform must be android or ios');
    }
    
    if (!architecture) {
      errors.push('Architecture is required');
    }
    
    if (features && !Array.isArray(features)) {
      errors.push('Features must be an array');
    }
    
    return errors;
  }
}

// Export for Vercel
export default async function handler(req, res) {
  const api = new MobileGenerationAPI();
  return await api.handleRequest(req, res);
} 