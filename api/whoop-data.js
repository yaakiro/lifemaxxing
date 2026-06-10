// Fetches the latest recovery, sleep, and cycle (strain) records
// from WHOOP on behalf of the browser. The browser passes its
// access token in the Authorization header; this function acts as
// a thin proxy so the WHOOP API is never called directly from the
// client (avoids CORS issues).
module.exports = async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);

  const headers = { Authorization: `Bearer ${token}` };
  const base    = 'https://api.prod.whoop.com/developer/v1';

  try {
    const [recRes, sleepRes, cycleRes] = await Promise.all([
      fetch(`${base}/recovery?limit=1`,        { headers }),
      fetch(`${base}/activity/sleep?limit=1`,  { headers }),
      fetch(`${base}/cycle?limit=1`,           { headers }),
    ]);

    // Propagate 401 so the client knows to refresh
    if (recRes.status === 401 || sleepRes.status === 401 || cycleRes.status === 401) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const [recData, sleepData, cycleData] = await Promise.all([
      recRes.ok   ? recRes.json()   : null,
      sleepRes.ok ? sleepRes.json() : null,
      cycleRes.ok ? cycleRes.json() : null,
    ]);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      recovery: recData?.records?.[0]   ?? null,
      sleep:    sleepData?.records?.[0] ?? null,
      cycle:    cycleData?.records?.[0] ?? null,
    });
  } catch (e) {
    console.error('whoop-data error', e);
    res.status(500).json({ error: 'Server error' });
  }
};
