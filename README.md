JOUZEE TRENDZ — Website
=========================

## Muundo wa Project
- index.html, products.html, contact.html — kurasa za wateja
- admin.html + admin.js — admin panel (login + CRUD ya bidhaa)
- terms.html, privacy.html, returns.html — kurasa za kisheria
- data/products.json — "database" ya bidhaa (huhifadhiwa GitHub)
- api/login.js, api/products.js, api/_auth.js — serverless functions (Vercel)
- images/ — logo na picha za bidhaa

## Jinsi Admin Panel Inavyofanya Kazi
Hakuna database ya nje. Admin akiongeza/kufuta bidhaa, mfumo huandika moja
kwa moja kwenye data/products.json ndani ya GitHub repo hii kupitia GitHub
API, kisha Vercel husasisha tovuti kiotomatiki (sekunde 30-60).

## MPANGILIO WA AWALI (SETUP) — fanya mara moja tu

### 1. Tengeneza GitHub Personal Access Token
1. Nenda https://github.com/settings/tokens?type=beta
2. Bofya "Generate new token" (Fine-grained)
3. Repository access: chagua repo hii tu (jouzee-trendz-website)
4. Permissions: "Contents" -> Read and write
5. Generate, kisha NAKILI token (huonekani mara moja tu!)

### 2. Deploy kwenye Vercel
1. Nenda vercel.com -> New Project -> chagua GitHub repo "jouzee-trendz-website"
2. Kabla ya Deploy, fungua "Environment Variables" na ongeza hizi:
   - ADMIN_PASSWORD = (chagua password ya Jouzee)
   - ADMIN_SECRET = (neno lolote refu la siri, mf: jouzee-secret-2026-xyz)
   - GITHUB_TOKEN = (token uliyotengeneza hatua ya 1)
   - GITHUB_OWNER = JituJema
   - GITHUB_REPO = jouzee-trendz-website
   - GITHUB_BRANCH = main
3. Deploy.

### 3. Tumia Admin Panel
Nenda: https://[domain-yako].vercel.app/admin.html
Weka ADMIN_PASSWORD uliyoweka Vercel, ongeza/hariri/futa bidhaa.
