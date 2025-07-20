export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI);
  const scope = 'repo';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  res.writeHead(302, { Location: githubAuthUrl });
  res.end();
} 