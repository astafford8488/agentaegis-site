# AgentAegis Landing Page

Static landing page for [agentaegis.org](https://agentaegis.org).

## Local preview

```bash
cd agentaegis-site
npm run dev
# opens at http://localhost:3000
```

## Deployment options

### Vercel (recommended — easiest custom domain)

```bash
npm install -g vercel
vercel
# Follow prompts. When asked for build command, leave blank.
# When asked for output directory, type: public
```

Then add the custom domain in Vercel dashboard → Settings → Domains → add `agentaegis.org`.

### Cloudflare Pages

```bash
npm install -g wrangler
wrangler pages deploy public --project-name agentaegis
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=public
```

## AbuseIPDB Verification

Two methods (both included):
1. **File method:** `public/abuseipdb-verification.html` contains the token
2. **Meta tag method:** `<meta name="abuseipdb-verification" content="OkRiMxG5" />` in `index.html`

After deployment, visit https://agentaegis.org/abuseipdb-verification.html to confirm it serves correctly, then click "Verify Domain Now" in AbuseIPDB.
