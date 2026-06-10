// Exchanges a WHOOP refresh token for a new access token.
// Called by the client when /api/whoop-data returns 401.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body || {};
  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' });
  }

  try {
    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token,
        client_id:     process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => '');
      console.error('WHOOP refresh failed', tokenRes.status, body);
      return res.status(401).json({ error: 'Refresh failed' });
    }

    const tokens = await tokenRes.json();
    res.setHeader('Cache-Control', 'no-store');
    res.json(tokens);
  } catch (e) {
    console.error('whoop-refresh error', e);
    res.status(500).json({ error: 'Server error' });
  }
};
