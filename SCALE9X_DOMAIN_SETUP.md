# Pointing scale9x.com at the live deployment

The Scale9X platform is live on **Railway** (service deployed from GitHub repo
`Vintech-10/ila-growth-intelligence`, current URL
`https://ila-growth-intelligence-production-1c7d.up.railway.app`).

Goal: serve it from **scale9x.com** so clients/investors never see the railway.app URL.

> Prerequisite: you must own **scale9x.com** at a registrar (GoDaddy, Namecheap,
> Cloudflare, Niagahoster, etc.). If it isn't registered yet, buy it first.

---

## Step 1 — Add the custom domain in Railway

1. Railway dashboard → open the **project** → click the **web service**.
2. **Settings → Networking → Custom Domain → `+ Add Domain`.**
3. Enter **`www.scale9x.com`** (recommended as the primary — see note on apex below).
4. Railway shows a **CNAME target** like `abcd1234.up.railway.app`. **Copy it.**
5. Repeat **Add Domain** for the apex **`scale9x.com`** too (Railway will give a target/
   instructions for it as well).

Railway auto-provisions a free Let's Encrypt **SSL certificate** once DNS resolves —
nothing to configure for HTTPS.

---

## Step 2 — Create the DNS records at your registrar

In the DNS settings for scale9x.com, add:

| Type  | Name (Host) | Value (Target)                  | Notes                          |
|-------|-------------|---------------------------------|--------------------------------|
| CNAME | `www`       | *(the Railway target from Step 1)* | The primary record            |
| CNAME / ALIAS / ANAME | `@` (root) | *(the Railway target)* | Apex — see note below          |

### The apex (root) domain caveat
A plain `CNAME` is **not allowed on the apex** (`scale9x.com` with no `www`) by most
DNS providers. Pick whichever applies to your registrar:

- **Cloudflare / Netlify DNS / DNSimple / Route 53** — support **CNAME flattening /
  ALIAS / ANAME** at the root. Add the root record as `ALIAS`/`ANAME` (or a proxied
  CNAME on Cloudflare) pointing to the Railway target. **Easiest — recommended.**
- **Registrar without ALIAS support (e.g. basic GoDaddy/Namecheap DNS)** — point only
  `www` to Railway, then use the registrar's **"domain forwarding / redirect"** to send
  `scale9x.com → https://www.scale9x.com` (301).

> Tip: moving scale9x.com's nameservers to **Cloudflare (free)** makes this trivial and
> also gives you a CDN + redirect rules. If unsure, do this.

---

## Step 3 — Pick a canonical host and redirect the other

Decide your primary (recommend **www.scale9x.com**) and 301-redirect the other so links
and SEO consolidate:

- `scale9x.com` → `https://www.scale9x.com`  (via Cloudflare Redirect Rule or registrar
  forwarding), **or** the reverse if you prefer the bare apex.

---

## Step 4 — Verify

- DNS propagation: minutes to ~48h (usually < 1h). Check with
  `nslookup www.scale9x.com` — it should resolve to the Railway target.
- Visit `https://www.scale9x.com` → Scale9X homepage, valid padlock (SSL).
- Visit `https://scale9x.com` → redirects to the canonical host.
- Test both portals: `https://www.scale9x.com/client/` and `/analyst/`.

---

## Already handled in the app

- The homepage "Talk to Scale9X" CTA already links to `https://scale9x.com`.
- No code/env changes are required for the domain — Railway routes the custom domain to
  the same service. `ANTHROPIC_API_KEY` and `XL_DATA_DIR=/data` stay as-is.

## Optional (cosmetic, not required for the domain)

- **Rename the GitHub repo** `ila-growth-intelligence` → e.g. `scale9x-platform`
  (GitHub → repo Settings → Rename). Railway keeps deploying via the existing link, but
  double-check the source connection in Railway → Settings after renaming.
- The Railway **service name** can be renamed in Railway → Settings (purely a label).
