// Handles WHOOP's OAuth redirect, exchanges code for tokens,
// then serves a tiny HTML page that writes them to localStorage
// and forwards the user to health.html — no tokens ever in the URL.
module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(302, '/health.html?whoop_error=access_denied');
  }

  try {
    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
        redirect_uri:  process.env.WHOOP_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => '');
      console.error('WHOOP token exchange failed', tokenRes.status, body);
      return res.redirect(302, '/health.html?whoop_error=token_failed');
    }

    const tokens = await tokenRes.json();

    // Embed tokens in a <script type="application/json"> block so there
    // is no risk of HTML injection from the token values themselves.
    const tokensJson = JSON.stringify(tokens);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Connecting WHOOP…</title>
<style>
  body { margin:0; background:#050506; color:#B8B6B0;
         font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;
         display:flex; align-items:center; justify-content:center;
         height:100vh; font-size:14px; }
</style>
</head>
<body>
<p>Connecting your WHOOP account…</p>
<script id="tok" type="application/json">${tokensJson}</script>
<script>
try {
  var t = JSON.parse(document.getElementById('tok').textContent);
  localStorage.setItem('whoop_tokens_v1', JSON.stringify(t));
} catch(e) {}
window.location.replace('/health.html');
</script>
</body>
</html>`);
  } catch (e) {
    console.error('whoop-callback error', e);
    res.redirect(302, '/health.html?whoop_error=server_error');
  }
};
