# GuardScope

AI-Powered Email Authentication & Phishing Investigation Chrome Extension for Gmail.

## Structure

```
guardscope/
├── extension/    Chrome MV3 extension (Vite + CRXJS + React + TypeScript + Tailwind)
├── backend/      Next.js 15 backend API (deployed on Vercel)
├── tasks/        Development plan, todo, and lessons learned
└── README.md
```

## Quick Start

### Extension
```bash
cd extension
npm install
npm run dev
```
Load `extension/dist/` in Chrome via chrome://extensions → Developer mode → Load unpacked.

### Backend
```bash
cd backend
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

## Tech Stack
- **Extension**: Chrome MV3, TypeScript, React, Tailwind CSS, Vite + CRXJS
- **Backend**: Next.js 15 App Router, TypeScript, deployed on Vercel
- **AI**: Claude Haiku (pre-scan) + Claude Sonnet (deep analysis)
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Payments**: Stripe
- **DNS**: Cloudflare DNS over HTTPS
- **Threat Intel**: VirusTotal + Google Safe Browsing
- **Rate Limiting**: Upstash Redis

## Development Phases
1. **Phase 1** — Foundation & Scaffolding (current)
2. **Phase 2** — Analysis Engine
3. **Phase 3** — Full UI & Authentication
4. **Phase 4** — Monetization & Production

See `tasks/MASTER_PLAN.md` for full details.
