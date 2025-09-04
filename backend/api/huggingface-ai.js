import { HUGGINGFACE_MODELS } from './huggingface-config.js';

class HuggingFaceAI {
  constructor() {
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.apiToken = "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";
    
    if (!this.apiToken) {
      console.warn('⚠️ HUGGINGFACE_API_TOKEN not set. Using fallback code generation.');
    }
  }

  async generateCode(prompt, options = {}) {
    const {
      platform = 'web',
      framework = 'React',
      styling = 'Tailwind CSS',
      architecture = 'Component Based'
    } = options;

    try {
      // Select the best model for the task
      const selectedModel = this.selectBestModel(platform, framework);
      
      if (this.apiToken) {
        // Use Hugging Face API
        return await this.generateWithHuggingFace(prompt, selectedModel, options);
      } else {
        // Fallback to basic code generation
        return await this.generateFallbackCode(prompt, options);
      }

    } catch (error) {
      console.error('Hugging Face AI generation failed:', error);
      return await this.generateFallbackCode(prompt, options);
    }
  }

  selectBestModel(platform, framework) {
    // Best model for UI code generation: WizardCoder-15B-V1.0
    // This model is specifically trained for code generation and excels at UI components
    if (platform === 'web' && framework === 'React') {
      return HUGGINGFACE_MODELS.wizardcoder15b.modelId;
    }
    
    // For other web frameworks, use CodeLlama-13b-hf (excellent general code generation)
    if (platform === 'web') {
      return HUGGINGFACE_MODELS.codellama13b.modelId;
    }
    
    // For mobile development, use DeepSeek-Coder-6.7B-Instruct (great for platform-specific code)
    if (platform === 'android' || platform === 'ios') {
      return HUGGINGFACE_MODELS.deepseekCoder67b.modelId;
    }
    
    // Default to WizardCoder for best UI generation
    return HUGGINGFACE_MODELS.wizardcoder15b.modelId;
  }

  async generateWithHuggingFace(prompt, model, options) {
    try {
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: this.buildPrompt(prompt, options),
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.1,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedCode = data[0]?.generated_text || data[0]?.text || '';
      
      return {
        success: true,
        code: generatedCode,
        model: model,
        api: 'huggingface',
        usage: {},
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Hugging Face generation failed with model ${model}:`, error);
      throw error;
    }
  }

  buildPrompt(userPrompt, options) {
    const { platform, framework, styling, architecture, customLogic, routing } = options;
    
    return `Generate ${platform} code using ${framework} and ${styling} with ${architecture} architecture.

Requirements:
- Platform: ${platform}
- Framework: ${framework}
- Styling: ${styling}
- Architecture: ${architecture}
${customLogic ? `- Custom Logic: ${customLogic}` : ''}
${routing ? `- Routing: ${routing}` : ''}

User Request: ${userPrompt}

Generate complete, runnable code that follows best practices. Include all necessary imports and dependencies. Only return the code, no explanations.`;
  }

  async generateFallbackCode(prompt, options) {
    const { platform, framework, styling } = options;
    
    let fallbackCode = '';
    
    if (platform === 'web' && framework === 'React') {
      fallbackCode = `import React from 'react';

function GeneratedComponent() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Generated Component
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-4">
            This is a fallback component generated when AI services are unavailable.
          </p>
          <div className="space-y-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors">
              Primary Button
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneratedComponent;`;
    } else if (platform === 'android') {
      fallbackCode = `// Fallback Android Component
package com.example.generated;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class GeneratedActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_generated);
        
        Button button = findViewById(R.id.button);
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                TextView textView = findViewById(R.id.textView);
                textView.setText("Button clicked!");
            }
        });
    }
}`;
    } else if (platform === 'ios') {
      fallbackCode = `import SwiftUI

struct GeneratedView: View {
    @State private var buttonText = "Click Me"
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Generated iOS Component")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Button(action: {
                buttonText = "Button Clicked!"
            }) {
                Text(buttonText)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(8)
            }
        }
        .padding()
    }
}

struct GeneratedView_Previews: PreviewProvider {
    static var previews: some View {
        GeneratedView()
    }
}`;
    } else {
      // Generic fallback
      fallbackCode = `// Fallback code for ${platform} with ${framework}
// This is a basic template generated when AI services are unavailable
// Please customize according to your specific requirements`;
    }
    
    return {
      success: true,
      code: fallbackCode,
      model: 'fallback',
      api: 'fallback',
      usage: {},
      timestamp: new Date().toISOString(),
      note: 'Fallback code generated - AI services unavailable'
    };
  }

  async healthCheck() {
    if (!this.apiToken) {
      return {
        huggingface: false,
        message: 'HUGGINGFACE_API_TOKEN not configured',
        models: Object.values(HUGGINGFACE_MODELS)
      };
    }

    try {
      // Test with a simple model
      const response = await fetch(`${this.baseUrl}/${HUGGINGFACE_MODELS.codellama7b.modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: { max_new_tokens: 10 }
        })
      });

      return {
        huggingface: response.ok,
        message: response.ok ? 'API is working' : `API error: ${response.status}`,
        models: Object.values(HUGGINGFACE_MODELS),
        apiToken: this.apiToken ? 'Configured' : 'Not configured'
      };

    } catch (error) {
      return {
        huggingface: false,
        message: `Health check failed: ${error.message}`,
        models: Object.values(HUGGINGFACE_MODELS),
        apiToken: this.apiToken ? 'Configured' : 'Not configured'
      };
    }
  }

  getModelInfo(modelName) {
    return HUGGINGFACE_MODELS[modelName] || {
      name: 'Unknown Model',
      description: 'Model information not available',
      url: null
    };
  }
}

export default HuggingFaceAI; 