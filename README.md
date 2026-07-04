# Social Connect — Frontend

Standalone React + TypeScript + Vite app.

**Repository:** [social-connect-frontend](https://github.com/vijaynarkar17-crypto/social-connect-frontend)

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

## Git

```powershell
git add .
git commit -m "your message"
git push origin main
```

Only commit from **this folder**. Do not mix frontend and backend in one repo.
