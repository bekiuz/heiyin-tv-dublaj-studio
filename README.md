# HEIYIN TV

Anime, film and series discovery platform with website + Telegram bot.

## Stack
- React + Vite + TypeScript
- Cloudflare Pages (web)
- Cloudflare Workers (API)
- D1 (catalog database)
- Telegram Bot API

## Setup
Website: `npm install && npm run dev`

Secrets (never commit tokens):
- `TELEGRAM_BOT_TOKEN` Worker secret
- `ADMIN_ID` Worker variable

Content must only link to authorized streaming/download sources.

## Automatic Cloudflare Pages deployment
The GitHub Actions workflow deploys the website to Cloudflare Pages on every push to `main`.
Add these repository secrets under Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN` (token with Cloudflare Pages edit permissions)
- `CLOUDFLARE_ACCOUNT_ID`
The workflow creates the `heiyin-tv` Pages project if it does not exist, then deploys `dist`.
