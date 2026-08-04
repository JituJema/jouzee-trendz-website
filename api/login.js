// api/login.js — Admin login (Vercel serverless function)
// Verifies password against ADMIN_PASSWORD env var, returns a signed session token.
const crypto = require('crypto');

function sign(payload, secret){
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { password } = req.body || {};
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Password si sahihi / Incorrect password' });
    }
    const token = sign({ exp: Date.now() + 8 * 60 * 60 * 1000 }, process.env.ADMIN_SECRET);
    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
