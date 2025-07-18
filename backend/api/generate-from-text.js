// 📁 File: api/generate-from-text.js

const {
  callGenerativeAI,
  parseJsonWithCorrection,
  toPascalCase,
  buildAppRouterPrompt
} = require('./utils/shared');

module.exports = async (req, res) => {
  try {
    const { projectName = 'ai-generated-app', prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'No prompt provided.' });

    let generatedFiles = {};

    const architectPrompt = `You are an expert React architect. Analyze this app idea: "${prompt}".
Return valid JSON with "pages" and "reusable_components" using PascalCase.`;
    const planJson = await callGenerativeAI(architectPrompt);
    const plan = await parseJsonWithCorrection(planJson, architectPrompt);
    plan.pages = plan.pages.map(toPascalCase);
    plan.reusable_components = plan.reusable_components.map(toPascalCase);

    // Batch reusable component generation (2–3 per call)
    const batchedComponents = [];
    for (let i = 0; i < plan.reusable_components.length; i += 3) {
      const chunk = plan.reusable_components.slice(i, i + 3);
      const componentPrompt = `Generate Tailwind React components: ${chunk.join(', ')} based on: "${prompt}".
Each component must include PropTypes validation and default export.
Return JSON { ComponentName: JSX }.`;
      const componentsJson = await callGenerativeAI(componentPrompt);
      const parsed = await parseJsonWithCorrection(componentsJson, componentPrompt);

      for (const name in parsed) {
        if (!parsed[name].includes('export default')) {
          const retryPrompt = `Add default export to this React component named ${name}:
${parsed[name]}`;
          parsed[name] = await callGenerativeAI(retryPrompt);
        }
      }
      batchedComponents.push(parsed);
    }
    for (const parsed of batchedComponents) {
      for (const name in parsed) {
        generatedFiles[`src/components/${name}.jsx`] = parsed[name];
      }
    }

    for (const page of plan.pages) {
      const imports = plan.reusable_components.map(c => `import ${c} from '../components/${c}';`).join('\n');
      const pagePrompt = `Generate JSX for page ${page} based on: "${prompt}". Use imports: ${imports}. Use Tailwind. Use default export.`;
      const pageCode = await callGenerativeAI(pagePrompt);
      generatedFiles[`src/pages/${page}.jsx`] = pageCode;
    }

    const appPrompt = buildAppRouterPrompt(plan.pages);
    const appCode = await callGenerativeAI(appPrompt);
    generatedFiles['src/App.jsx'] = appCode;

    const qaPrompt = `Evaluate how well this React app generated from "${prompt}" meets user needs. Return JSON with score and justification.`;
    const accuracyResult = await callGenerativeAI(qaPrompt, [], true);

    generatedFiles['package.json'] = JSON.stringify({
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.22.3',
        'react-scripts': '5.0.1',
        'web-vitals': '^2.1.4',
        'prop-types': '^15.8.1'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      }
    }, null, 2);

    generatedFiles['public/index.html'] = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${projectName}</title></head><body><div id='root'></div></body></html>`;

    res.status(200).json({ generatedFiles, accuracyResult });
  } catch (err) {
    console.error('Error in /api/generate-from-text:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
