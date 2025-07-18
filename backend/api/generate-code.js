// 📁 File: api/generate-code.js

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  bufferToGenerativePart,
  toPascalCase,
  callGenerativeAI,
  parseJsonWithCorrection,
  buildAppRouterPrompt
} = require('./utils/shared');

module.exports = async (req, res) => {
  try {
    await new Promise((resolve, reject) => upload.array('screens')(req, res, err => (err ? reject(err) : resolve())));

    const { projectName = 'react-project' } = req.body;
    const screenFiles = req.files;
    if (!screenFiles || screenFiles.length === 0) return res.status(400).json({ error: 'No screen images provided.' });

    const imageParts = screenFiles.map(file => bufferToGenerativePart(file.buffer, file.mimetype));
    let generatedFiles = {};

    const architectPrompt = `You are an expert software architect. Analyze these UI screens holistically. Identify distinct pages and reusable components. Output a valid JSON object with keys: pages, reusable_components. Use PascalCase for names.`;
    const planJson = await callGenerativeAI(architectPrompt, imageParts);
    const plan = await parseJsonWithCorrection(planJson, architectPrompt, imageParts);
    plan.pages = plan.pages.map(toPascalCase);
    plan.reusable_components = plan.reusable_components.map(toPascalCase);

    // Batch component generation (2-3 per call)
    const batched = [];
    for (let i = 0; i < plan.reusable_components.length; i += 3) {
      const chunk = plan.reusable_components.slice(i, i + 3);
      const prompt = `Generate React JSX for the following components based on uploaded screens: ${chunk.join(', ')}.
Each component must use Tailwind CSS, include PropTypes validation, and have a default export.
Return JSON { ComponentName: JSX }.`;
      const componentsJson = await callGenerativeAI(prompt, imageParts);
      const parsed = await parseJsonWithCorrection(componentsJson, prompt, imageParts);

      // Ensure default export exists
      for (const name in parsed) {
        if (!parsed[name].includes('export default')) {
          const retryPrompt = `Add default export to this React component named ${name}:
${parsed[name]}`;
          parsed[name] = await callGenerativeAI(retryPrompt);
        }
      }
      batched.push(parsed);
    }
    for (const parsed of batched) {
      for (const name in parsed) {
        generatedFiles[`src/components/${name}.jsx`] = parsed[name];
      }
    }

    for (let i = 0; i < plan.pages.length; i++) {
      const name = plan.pages[i];
      const imports = plan.reusable_components.map(c => `import ${c} from '../components/${c}';`).join('\n');
      const pagePrompt = `Generate React JSX for page ${name}. Use imports: ${imports}. Must use Tailwind and end with default export.`;
      const pageCode = await callGenerativeAI(pagePrompt, [imageParts[i]]);
      generatedFiles[`src/pages/${name}.jsx`] = pageCode;
    }

    const appPrompt = buildAppRouterPrompt(plan.pages);
    const appCode = await callGenerativeAI(appPrompt);
    generatedFiles['src/App.js'] = appCode;

    const qaPrompt = `Compare UI image with React code. Provide accuracy score and short justification as JSON.`;
    const accuracyResult = await callGenerativeAI(qaPrompt, [imageParts[0]], true);

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
    console.error('Error in /api/generate-code:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
