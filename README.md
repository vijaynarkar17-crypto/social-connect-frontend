# Social Connect — Frontend

React + TypeScript + Vite app for Social Connect.

**GitHub:** [social-connect-frontend](https://github.com/vijaynarkar17-crypto/social-connect-frontend)

## Requirements

- Node.js 18+
- Backend API running on `http://localhost:4000` ([social-connect-backend](https://github.com/vijaynarkar17-crypto/social-connect-backend))

## Quick start

```powershell
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173**

Vite proxies `/api`, `/uploads`, and `/socket.io` to the backend — you do **not** need `VITE_API_URL` for local dev.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No (local) | API base URL for production builds |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google sign-in button |

## Repo layout

This folder is its own Git repo. The backend lives in a separate repo. For local full-stack dev, use the parent workspace (`socialconnect/`) and run `npm run dev` from there to start both servers.
