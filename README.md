# Social Connect — Frontend

Standalone React + TypeScript + Vite app.

**Owner:** [vijaynarkar17-crypto](https://github.com/vijaynarkar17-crypto)  
**Repository:** [social-connect-frontend](https://github.com/vijaynarkar17-crypto/social-connect-frontend)  
**License:** All Rights Reserved — see [LICENSE](./LICENSE). Viewing for evaluation is allowed; copying or claiming ownership is not.

This is an **independent project**. Open this folder alone in your editor — not the parent directory.

## Requirements

- Node.js 18+
- A running Social Connect API (default `http://localhost:4000`)

## Setup

```powershell
git clone https://github.com/vijaynarkar17-crypto/social-connect-frontend.git
cd social-connect-frontend
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173**

## Local API

For development, Vite proxies `/api`, `/uploads`, and `/socket.io` to `http://localhost:4000`. Start the backend separately in its own project folder.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Full API URL when not using Vite proxy |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google sign-in |

## Production (Vercel)

In **Vercel → Settings → Environment Variables**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://your-api.onrender.com` |

- No trailing slash
- Apply to **Production** (and Preview if needed)
- **Redeploy** after saving — Vite bakes env vars at build time

On **Render**, set `FRONTEND_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`).

## Git

```powershell
git add .
git commit -m "your message"
git push origin main
```

Only commit from **this folder**. Do not mix frontend and backend in one repo.
