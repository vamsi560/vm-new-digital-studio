import { callGenerativeAI } from './utils/shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, filename, files } = req.body;
  let reviewPrompt = '';
  let reviewTarget = '';

  if (code && filename) {
    reviewPrompt = `You are an expert code reviewer. Review the following file (${filename}) for code quality, best practices, maintainability, and accessibility. Suggest improvements and point out any issues.\n\nCode:\n${code}`;
    reviewTarget = code;
  } else if (files && typeof files === 'object') {
    const fileList = Object.entries(files).map(([path, content]) => `// --- ${path} ---\n${content}`).join('\n\n');
    reviewPrompt = `You are an expert code reviewer. Review the following project for code quality, best practices, maintainability, and accessibility. Suggest improvements and point out any issues.\n\nProject files:\n${fileList}`;
    reviewTarget = fileList;
  } else {
    return res.status(400).json({ error: 'Missing code or files' });
  }

  try {
    const review = await callGenerativeAI(reviewPrompt);
    res.status(200).json({ review });
  } catch (err) {
    res.status(500).json({ error: 'AI review failed', details: err.message });
  }
} 