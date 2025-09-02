import HuggingFaceAI from './api/huggingface-ai.js';
import { HUGGINGFACE_MODELS, MODEL_SELECTION, RECOMMENDATIONS } from './api/huggingface-config.js';

// Test the focused Hugging Face AI integration
async function testHuggingFaceAI() {
  console.log('🚀 Testing Hugging Face AI Integration...\n');

  const ai = new HuggingFaceAI();

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const health = await ai.healthCheck();
    console.log('✅ Health Check Result:', JSON.stringify(health, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test 2: Model Selection
  console.log('\n2️⃣ Testing Model Selection...');
  console.log('🏆 Best Model for React:', MODEL_SELECTION.web.react.primary);
  console.log('🥈 Fallback Model:', MODEL_SELECTION.web.react.fallback);
  console.log('⚡ Fast Model:', MODEL_SELECTION.web.react.fast);
  
  console.log('\n📱 Best Model for Mobile:', MODEL_SELECTION.mobile.android.primary);
  console.log('🌐 Best Model for General Web:', MODEL_SELECTION.web.vue.primary);

  // Test 3: Code Generation
  console.log('\n3️⃣ Testing Code Generation...');
  try {
    const prompt = "Generate a modern React button component with Tailwind CSS";
    const result = await ai.generateCode(prompt, {
      platform: 'web',
      framework: 'React',
      styling: 'Tailwind CSS',
      architecture: 'Component Based'
    });

    if (result.success) {
      console.log('✅ Code Generation Successful!');
      console.log('📝 Generated Code:');
      console.log(result.code);
      console.log(`\n🤖 Model Used: ${result.model}`);
      console.log(`🌐 API Used: ${result.api}`);
    } else {
      console.log('❌ Code Generation Failed:', result.error);
      if (result.fallback) {
        console.log('📝 Using fallback code generation');
      }
    }
  } catch (error) {
    console.log('❌ Code Generation Error:', error.message);
  }

  // Test 4: Model Capabilities
  console.log('\n4️⃣ Model Capabilities:');
  Object.entries(HUGGINGFACE_MODELS).forEach(([key, model]) => {
    console.log(`\n${model.name}:`);
    console.log(`  Description: ${model.description}`);
    console.log(`  Best For: ${model.bestFor.join(', ')}`);
    console.log(`  Performance: ${model.performance}`);
    console.log(`  URL: ${model.url}`);
  });

  // Test 5: Recommendations
  console.log('\n5️⃣ Model Recommendations:');
  console.log('🎯 Default (Best Balance):', RECOMMENDATIONS.default);
  console.log('⚛️ React Developer:', RECOMMENDATIONS.reactDeveloper);
  console.log('📱 Mobile Developer:', RECOMMENDATIONS.mobileDeveloper);
  console.log('⚡ Real-time:', RECOMMENDATIONS.realtime);
  console.log('🏭 Production:', RECOMMENDATIONS.production);
  console.log('🔬 Prototyping:', RECOMMENDATIONS.prototyping);

  // Test 6: Setup Instructions
  console.log('\n6️⃣ Setup Instructions:');
  console.log('🔧 To use Hugging Face AI:');
  console.log('  1. Get API token from https://huggingface.co/settings/tokens');
  console.log('  2. Add to Vercel environment variables: HUGGINGFACE_API_TOKEN');
  console.log('  3. Deploy to Vercel');
  console.log('  4. The system will automatically select the best model for each task');

  console.log('\n🎉 Hugging Face AI Integration Test Complete!');
  console.log('\n📚 Next steps:');
  console.log('  1. Get your Hugging Face API token');
  console.log('  2. Add it to Vercel environment variables');
  console.log('  3. Deploy and test the integration');
  console.log('  4. Enjoy free AI code generation with the best models!');
}

// Run the test
testHuggingFaceAI().catch(console.error); 