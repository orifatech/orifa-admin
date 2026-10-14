# Orifa Admin — External Resources, Accounts & Credentials Guide

This guide details all external services, accounts, environment variables, and credentials required to run, deploy, and operate the **Orifa Admin Platform** in both development and production.

---

## Quick Reference Checklist

| Service / Resource | Purpose | Required in Dev? | Required in Prod? | Where to Configure |
| :--- | :--- | :--- | :--- | :--- |
| **Convex Cloud** | Database, Auth, Real-time APIs, File Storage | ✅ Yes (Connected) | ✅ Yes | `.env.local` / Hosting Env |
| **GitHub Token** | Commits, Branches & Pull Requests | ✅ Yes | ✅ Yes | Convex Dashboard Env |
| **Hosting (Vercel/Netlify)** | Next.js App Hosting | ❌ (Runs localhost) | ✅ Yes | Vercel / Netlify Dashboard |
| **Client Git Repos** | Target repos for CMS edits | ✅ Yes | ✅ Yes | Added per Project in Admin |
| **Client Site Embed** | `orifa-editor.js` script tag | ✅ Yes | ✅ Yes | Client site codebase (`<head>`) |
| **Domain Registrar (Optional)** | Automated WHOIS / RDAP lookups | ⚪ Optional | ⚪ Optional | Convex Dashboard Env |
| **Payment Gateway (Optional)**| Stripe / Paystack for retainer checkout | ⚪ Optional | ⚪ Optional | Convex Dashboard Env |

---

## 1. Convex Cloud Backend

Convex serves as the unified database, serverless backend, real-time sync layer, and file storage engine.

### Accounts & Setup
- **Account**: Create or log in at [convex.dev](https://convex.dev).
- **Current Development Deployment**:
  - Team: `elero-obaitan`
  - Project: `orifa-admin`
  - Dev Deployment Name: `colorless-robin-348`
  - Dev URL: `https://colorless-robin-348.eu-west-1.convex.cloud`
  - Dev Site URL: `https://colorless-robin-348.eu-west-1.convex.site`

### Environment Variables Needed

#### In your Next.js frontend (`.env.local` locally and in your hosting dashboard):
```env
# Deployment identifier used by Convex CLI
CONVEX_DEPLOYMENT=dev:colorless-robin-348

# Public WebSocket URL for reactive queries
NEXT_PUBLIC_CONVEX_URL=https://colorless-robin-348.eu-west-1.convex.cloud

# Public HTTP URL for Auth actions and webhooks
NEXT_PUBLIC_CONVEX_SITE_URL=https://colorless-robin-348.eu-west-1.convex.site
```

#### Inside Convex Dashboard (Settings → Environment Variables):
Configure these on `dashboard.convex.dev` under your deployment:
- `GITHUB_TOKEN`: GitHub Personal Access Token with repo read/write access (see Section 2).
- `SITE_URL`: The origin URL of your frontend (e.g. `http://localhost:3000` for dev, `https://admin.orifatech.com` for prod) for secure authentication session cookies.
- `VAULT_MASTER_KEY` (Optional): A 64-character hex key (256-bit) if server-side encrypted vault backups are enabled.

### Moving to Production
When ready to go live:
```bash
npx convex deploy
```
This generates a production Convex deployment (e.g., `https://<prod-name>.convex.cloud`). Update your hosting provider's environment variables with the production URLs.

---

## 2. GitHub Account & Access Credentials

Orifa Admin interacts with GitHub via `@octokit/rest` to commit files, create automated feature branches, and open Pull Requests on behalf of your agency.

### Required GitHub Account
- **Organization / Account**: The account or organization hosting your client repositories (e.g., `orifatech` or `elero-obaitan`).
- **Target Repositories**: Any repository you connect to a project (e.g., `orifatech/orifatech`, `orifatech/client-site`).

### Credentials Required: Personal Access Token (PAT)
1. Go to **GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens** (or Tokens Classic).
2. Click **Generate new token**.
3. **Repository access**: Select *All repositories* or *Only select repositories* belonging to your agency/clients.
4. **Permissions**:
   - **Repository Permissions**:
     - `Contents`: **Read and Write** *(Required to fetch files, modify JSON/MD, and commit)*
     - `Pull requests`: **Read and Write** *(Required to open PRs, add review breakdowns, and read status)*
     - `Metadata`: **Read-only** *(Default)*
5. **Copy the generated token**: (starts with `github_pat_` or `ghp_`).
6. **Add to Convex**:
   - Go to your Convex Dashboard → **Settings → Environment Variables**.
   - Add variable: `GITHUB_TOKEN` = `<your_github_token>`.

### Terminal Collaborator Access
Your local git client must also be authenticated as an authorized collaborator or member of the `orifatech` organization to push and pull code from the command line.

---

## 3. Web Hosting for Orifa Admin Frontend

To deploy the Orifa Admin dashboard so you and your team can access it anywhere:

### Recommended Providers
- **Vercel** (Recommended for Next.js App Router)
- **Netlify**
- **Cloudflare Pages**

### Build Configuration
- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node.js Version**: `20.x` or higher

### Environment Variables to set in Hosting Dashboard
```env
NEXT_PUBLIC_CONVEX_URL=https://<your-prod-deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-prod-deployment>.convex.site
```

---

## 4. Hosting for Client Websites (Continuous Deployment)

The CMS relies on Git-based continuous deployment (GitOps) to make content changes live.

### How it works:
1. When Orifa Admin commits directly to the default branch (`main`):
   - Your hosting provider (e.g., Vercel, Netlify, Cloudflare) detects the commit and immediately rebuilds the client site.
2. When Orifa Admin creates a Pull Request:
   - Your hosting provider creates a **Preview Deployment** (e.g., `https://client-site-git-orifa-update-...vercel.app`), allowing you to preview the client's edits before merging.

### Requirement:
- Ensure the client's GitHub repository has automated builds enabled on the default production branch (`main`).

---

## 5. Client Website Integration (Visual In-Place Editor)

To enable live click-to-edit on any client website (Astro, Next.js, React, or static HTML):

### Project-Specific Secret Token
When you register a project in Orifa Admin, Convex generates a unique `editorSecretToken` (e.g. `orifa_sec_7k9a1bc2`).

### Integration Script
Add this snippet to the client website (in Astro `Layout.astro`, Next.js `layout.tsx`, or HTML `<head>`):

```html
<script 
  src="https://<your-orifa-admin-domain>/orifa-editor.js" 
  data-orifa-token="<PROJECT_EDITOR_SECRET_TOKEN>" 
  data-orifa-endpoint="https://<your-orifa-admin-domain>" 
  defer>
</script>
```

### HTML Tag Marking:
To make an element visually editable, add the `data-orifa-key` and `data-orifa-file` attributes:
```html
<h1 data-orifa-key="hero.title" data-orifa-file="src/content/home.json">
  Welcome to Acme Corp
</h1>
```

---

## 6. Optional Agency Operations Credentials

These credentials are optional and can be connected if you wish to enable automated synchronization in the agency suite:

### A. Domain Expiration Monitoring (`/domains`)
- **Current functionality**: Real-time tracking of domain names, registrars, nameservers, and expiration dates with daily cron warnings in Convex.
- **Optional API for Auto-Sync**:
  - **WhoisXML API** or **Cloudflare API**: Can be configured in Convex Actions if you prefer automated live WHOIS lookups rather than manual registrar inputs.

### B. Google Workspace / Microsoft 365 License Sync (`/licenses`)
- **Current functionality**: Tracking license tiers, assigned users, renewal dates, and monthly costs per client organization.
- **Optional API for Auto-Sync**:
  - **Google Cloud Console Service Account** with Google Workspace Admin SDK (`Directory API`) permissions.
  - **Microsoft Entra ID App** with Microsoft Graph API (`User.Read.All`, `Organization.Read.All`).

### C. Retainer Subscriptions & Invoicing (`/billing`)
- **Current functionality**: Tracking monthly retainers, included vs used hours, billing cycles, and payment statuses.
- **Optional Payment Gateway**:
  - **Stripe Account**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for automated customer portal links or invoice generation.
  - **Paystack / Flutterwave**: For automated regional invoicing.

---

## Summary Checklist to Go Live

1. [x] **Convex Dev Deployment**: Active (`dev:colorless-robin-348`).
2. [ ] **GitHub Access Token**: Generate Fine-grained PAT with `Contents` & `Pull requests` (Read/Write) and add as `GITHUB_TOKEN` in Convex Dashboard.
3. [ ] **Convex Production**: Run `npx convex deploy` to get production backend URLs.
4. [ ] **Host Admin Dashboard**: Connect `orifatech/orifa-admin` to Vercel/Netlify with `NEXT_PUBLIC_CONVEX_URL`.
5. [ ] **Set `SITE_URL` in Convex**: Add production URL to Convex Dashboard (Settings → Environment Variables).
