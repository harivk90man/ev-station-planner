# ⚡ EV Station Planner

**India's #1 tool for entrepreneurs planning an EV charging station business.**  
Plan costs, discover subsidies, and project ROI — in under 5 minutes.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ev--station--planner.vercel.app-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://ev-station-planner.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

---

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Capacitor](https://img.shields.io/badge/Android_APK-Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com)

---

## Why this exists

India needs **1.3 million EV charging stations by 2030**. Most entrepreneurs don't know where to start — equipment costs vary wildly, subsidy schemes are buried in government PDFs, and ROI calculations require a finance degree.

EV Station Planner solves this in a 4-step mobile-first calculator using real 2026 data: 20 state EV tariffs, equipment prices from actual vendors, and live PM E-DRIVE + state subsidy calculations.

---

## Live Demo

**[ev-station-planner.vercel.app](https://ev-station-planner.vercel.app)**

| Landing Page | Step 1: Location | Step 4: Report |
|---|---|---|
| Dark hero with market stats | State + charger selection | Full P&L + ROI + WhatsApp share |

---

## Features

- **4-Step Calculator** — Location → Revenue → Subsidies → Full Report
- **20 Indian States** with real 2026 EV tariffs (₹4.50–₹7.00/kWh) and duty-exemption windows
- **6 Charger Types** — AC 7.4 kW through DC 180 kW with real equipment pricing from Indian vendors
- **PM E-DRIVE + 7 State Schemes** — auto-calculated subsidy benefit for each eligible scheme
- **Full P&L Model** — monthly revenue, electricity costs, opex, net profit, payback period, 5-year ROI
- **WhatsApp Share** — one-tap share of your business plan summary
- **PWA-ready** — installable on Android/iOS as a home screen app
- **Android APK** — native app via Capacitor
- **Mobile-first** — dark theme, large touch targets, works at 375px

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript, Static Export) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (edge, global CDN) |
| Mobile | Capacitor v7 (Android APK) |
| Fonts | Geist Sans / Geist Mono |

---

## Database Schema

```sql
states           -- 20 states: EV tariffs, duty-exemption, years
charger_types    -- 6 types: AC 7.4kW → DC 180kW with real 2026 pricing
subsidies        -- PM E-DRIVE central + 7 state schemes with eligibility
cost_components  -- 16 capex/opex line items (civil, electrical, software, HR…)
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Clone

```bash
git clone https://github.com/harivk90man/ev-station-planner.git
cd ev-station-planner
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database setup

Run the migrations in Supabase SQL editor — see the seed migrations applied via Supabase MCP (tables: `states`, `charger_types`, `subsidies`, `cost_components`).

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Building the Android APK

Requires Java 21 and Android Studio (API 35+).

```bash
npm run build            # static export → out/
npx cap sync android     # copy to android/
cd android
./gradlew assembleDebug  # → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set env vars in Vercel dashboard (or via `vercel env add`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Project Structure

```
src/
├── app/
│   ├── calculator/
│   │   ├── page.tsx              # Route entry
│   │   └── CalculatorClient.tsx  # 4-step wizard (client component)
│   ├── layout.tsx                # Root layout + PWA metadata + footer
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/
│   └── Footer.tsx
└── lib/
    └── supabase.ts
public/
├── manifest.json   # PWA manifest
└── icon.svg        # App icon
android/            # Capacitor Android project
capacitor.config.ts
```

---

## Contributing

PRs welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# open PR
```

---

## License

[MIT](./LICENSE) © 2026 Hariharan

---

## Built by

**Hariharan** — [@harivk90man](https://github.com/harivk90man)

> *"India's EV revolution needs 1.3 million charging stations. Let's build them."*
