import axios from 'axios';

export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      { headers: { Accept: 'application/json' } }
    );
    const { access_token } = tokenRes.data;
    // Store token in a cookie (or session)
    res.setHeader('Set-Cookie', `github_token=${access_token}; Path=/; HttpOnly; SameSite=Lax`);
    // Redirect to frontend
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'GitHub OAuth failed', details: err.message }));
  }
} 