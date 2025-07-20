import axios from 'axios';

export default async function handler(req, res) {
  const token = req.cookies.github_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated with GitHub' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { repoName, files } = req.body;
  if (!repoName || !files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing repoName or files' });
  }

  try {
    // 1. Create a new repo
    const repoRes = await axios.post(
      'https://api.github.com/user/repos',
      { name: repoName, private: false },
      { headers: { Authorization: `token ${token}` } }
    );
    const { full_name } = repoRes.data;

    // 2. Create files via the GitHub API (use the create/update file endpoint)
    for (const [path, content] of Object.entries(files)) {
      await axios.put(
        `https://api.github.com/repos/${full_name}/contents/${encodeURIComponent(path)}`,
        {
          message: `Add ${path}`,
          content: Buffer.from(content).toString('base64'),
        },
        { headers: { Authorization: `token ${token}` } }
      );
    }

    res.status(200).json({ url: `https://github.com/${full_name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export to GitHub', details: err.message });
  }
} 