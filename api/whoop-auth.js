// Redirects the browser to WHOOP's OAuth consent screen.
module.exports = function handler(req, res) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.WHOOP_CLIENT_ID,
    redirect_uri:  process.env.WHOOP_REDIRECT_URI,
    scope: 'offline read:recovery read:sleep read:cycles read:workout read:profile read:body_measurement',
  });
  res.redirect(302, `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`);
};
