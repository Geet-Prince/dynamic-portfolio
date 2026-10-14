# GitHub Setup Guide — `dynamic-portfolio` in 30 Seconds

> For **Prince Raj (`@Geet-Prince`)**. Exact values + copy-paste `gh` CLI commands. No guessing.

## 1. Repository Name

**Use:** `dynamic-portfolio` → `github.com/Geet-Prince/dynamic-portfolio`

Why not `geetprince.me`? A literal domain name works but reads as a redirect repo; `dynamic-portfolio` is keyword-rich for GitHub search (`portfolio` is one of the highest-traffic repo search terms) while the About section below carries the domain authority. **Pin this repo** on your profile (`github.com/Geet-Prince` → Customize pins) — pinned repos pass disproportionate authority to linked domains (`geetprince.me`, `progex.geetprince.me`).

```bash
gh repo create dynamic-portfolio --public \
  --description "⚡ Official Dynamic Developer Portfolio & Headless CMS of Prince Raj (Geet-Prince) — Built with Next.js 15, TypeScript, Tailwind CSS & Supabase. Features an Apple-inspired Design Studio, GEO/AEO AI Search Engine (llms.txt), Command Palette (⌘K), and Automated Daily Google SERP Bot. B.Tech CSE (Data Science) @ NIET Greater Noida." \
  --homepage "https://geetprince.me"
```

## 2. About Section (exact values)

| Field | Value |
|---|---|
| Description (≤350 chars) | `⚡ Official Dynamic Developer Portfolio & Headless CMS of Prince Raj (Geet-Prince) — Built with Next.js 15, TypeScript, Tailwind CSS & Supabase. Features an Apple-inspired Design Studio, GEO/AEO AI Search Engine (llms.txt), Command Palette (⌘K), and Automated Daily Google SERP Bot. B.Tech CSE (Data Science) @ NIET Greater Noida.` |
| Website | `https://geetprince.me` (check "Include in the home page") |

```bash
gh repo edit Geet-Prince/dynamic-portfolio \
  --homepage "https://geetprince.me" \
  --add-topic "portfolio" \
  --add-topic "developer-portfolio" \
  --add-topic "nextjs" \
  --add-topic "nextjs-15" \
  --add-topic "react" \
  --add-topic "typescript" \
  --add-topic "tailwindcss" \
  --add-topic "supabase" \
  --add-topic "headless-cms" \
  --add-topic "seo" \
  --add-topic "geo" \
  --add-topic "aeo" \
  --add-topic "llms-txt" \
  --add-topic "data-science" \
  --add-topic "framer-motion" \
  --add-topic "vercel" \
  --add-topic "github-actions"
```

Verify: `gh repo view Geet-Prince/dynamic-portfolio --json description,homepageUrl,repositoryTopics`.

## 3. Secrets (for the backup daily cron)

The `.github/workflows/daily-seo-bot.yml` backup cron needs one secret. (`CRON_SECRET` must match the same value in Vercel env / `.env.local`.)

```bash
# Generates a token AND stores it as the Actions secret in one step:
CRON_SECRET_VALUE=$(openssl rand -hex 24) && \
gh secret set CRON_SECRET --body "$CRON_SECRET_VALUE" --repo Geet-Prince/dynamic-portfolio && \
echo "PUT THIS SAME VALUE IN Vercel → Settings → Environment Variables → CRON_SECRET:" && \
echo "$CRON_SECRET_VALUE"
```

Manual runs anytime: repo → **Actions** → *Daily SEO Bot Scan* → **Run workflow**.

## 4. Vercel Environment Variables (production)

Vercel → Project → Settings → Environment Variables (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=https://geetprince.me
REVALIDATE_SECRET=
SERPER_API_KEY=            # optional — or paste in /admin/seo-bot vault
CRON_SECRET=               # same value as the GitHub secret above
```

Vercel Cron (`vercel.json`, `0 18 * * *` UTC) activates automatically on Hobby with the cron entry present; the GitHub Actions workflow covers the rest.

## 5. First Push

```bash
git init -b main
git add -A
git commit -m "Initial commit: dynamic portfolio + headless CMS for geetprince.me (Next.js 15, Supabase, GEET-SENTINEL)"
git remote add origin https://github.com/Geet-Prince/dynamic-portfolio.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.next/`, `.env*.local`, `.vercel/`, and `data/portfolio-store.json` — secrets can never leak via push. Verify with `git status` before committing.

## 6. Post-Push Checklist

- [ ] About description + `https://geetprince.me` homepage visible on repo page
- [ ] 17 topics applied (`gh repo view --json repositoryTopics`)
- [ ] Repo **pinned** on `github.com/Geet-Prince`
- [ ] Actions tab shows *Daily SEO Bot Scan* (runs 18:00 UTC; test via Run workflow)
- [ ] `CRON_SECRET` identical in GitHub Secrets and Vercel env
- [ ] Supabase `supabase/schema.sql` run once (or `reset-schema.sql` for a clean rebuild)
