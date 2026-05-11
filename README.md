# AgentAegis Marketing Site

Marketing and demo site for **AgentAegis** — a pay-per-use cybersecurity MCP server that gives AI agents access to professional security tools via the Model Context Protocol.

**Live site:** [agentaegis.org](https://agentaegis.org)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — value proposition, tool showcase, pricing |
| `/demo/*` | Interactive demos: code audit, incident triage, network pentest, policy generator, security audit, SOC 2 readiness |
| `/faq` | FAQ (fetched live from the MCP server — single source of truth) |
| `/pay` | Payment portal for tool credits |
| `/pay/success` | Post-purchase confirmation |

## Tech Stack

- **Frontend:** Static HTML / CSS / JS served from `public/`
- **Backend:** Vercel serverless functions (`api/`) for beta signup and payment flows
- **Email:** Resend for transactional emails
- **Hosting:** Vercel with custom domain

## Local Preview

```bash
cd agentaegis-site
npm run dev
# opens at http://localhost:3000
```

## Deployment Options

### Vercel (recommended)

```bash
npm install -g vercel
vercel
# When asked for build command, leave blank.
# When asked for output directory, type: public
```

Then add the custom domain in Vercel dashboard > Settings > Domains > add `agentaegis.org`.

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

After deployment, visit `https://agentaegis.org/abuseipdb-verification.html` to confirm it serves correctly, then click "Verify Domain Now" in AbuseIPDB.

## License

MIT
