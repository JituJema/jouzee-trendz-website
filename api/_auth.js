// api/_auth.js — shared token verification helper
const crypto = require('crypto');

function verifyToken(token, secret){
  if (!token) return false;
  const [data, sig] = token.split('.');
  if (!data || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expected) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return payload.exp > Date.now();
  } catch (e) { return false; }
}

module.exports = { verifyToken };
