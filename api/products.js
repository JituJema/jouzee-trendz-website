// api/products.js — Admin product CRUD via GitHub Contents API
// Requires env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (default 'main'), ADMIN_SECRET
const { verifyToken } = require('./_auth');

const GH_API = 'https://api.github.com';
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const HEADERS = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
});

async function ghGetFile(path){
  const url = `${GH_API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: HEADERS() });
  if (!r.ok) throw new Error(`GitHub GET ${path} failed: ${r.status}`);
  const j = await r.json();
  return { content: Buffer.from(j.content, 'base64').toString('utf8'), sha: j.sha };
}

async function ghPutFile(path, contentStr, sha, message, isBase64){
  const url = `${GH_API}/repos/${OWNER}/${REPO}/contents/${path}`;
  const body = {
    message,
    content: isBase64 ? contentStr : Buffer.from(contentStr).toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, { method: 'PUT', headers: HEADERS(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub PUT ${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Umeisha muda / Session expired, login tena' });
  }

  try {
    const { action, product, imageBase64, imageExt, productId } = req.body || {};

    // 1. Load current products.json
    const { content, sha } = await ghGetFile('data/products.json');
    let products = JSON.parse(content);

    // 2. If a new image was uploaded, commit it first and get its path
    let imagePath = product?.image;
    if (imageBase64) {
      const fileName = `${product.id}-${Date.now()}.${imageExt || 'jpg'}`;
      imagePath = `images/products/${fileName}`;
      await ghPutFile(imagePath, imageBase64, null, `Upload image for ${product.id}`, true);
    }

    // 3. Apply action
    if (action === 'delete') {
      products = products.filter(p => p.id !== productId);
    } else if (action === 'save') {
      const updated = { ...product, image: imagePath || product.image || '' };
      const idx = products.findIndex(p => p.id === updated.id);
      if (idx >= 0) products[idx] = updated; else products.push(updated);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // 4. Commit updated products.json
    await ghPutFile(
      'data/products.json',
      JSON.stringify(products, null, 2),
      sha,
      `Update products via admin panel (${action})`,
      false
    );

    return res.status(200).json({ ok: true, products });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
