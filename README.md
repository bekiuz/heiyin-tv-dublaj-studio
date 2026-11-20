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
