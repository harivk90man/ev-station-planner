# ⚡ EV Station Planner

> India's #1 tool for entrepreneurs planning an EV charging station business.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ev--station--planner.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://ev-station-planner.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## What is this?

India needs **1.3 million EV charging stations by 2030**. Most entrepreneurs don't know where to start — costs vary wildly, subsidies are complex, and ROI calculations are buried in PDFs.

EV Station Planner solves this with a 4-step interactive calculator that gives any Indian entrepreneur a clear, accurate business plan in under 5 minutes.

### Features

- **4-Step Calculator** — Location → Revenue → Subsidies → Full Report
- **20 Indian States** with real 2026 EV tariffs (₹4.50–₹7.00/kWh) and duty-exemption data
- **6 Charger Types** — AC 7.4 kW up to DC 180 kW with real equipment pricing
- **PM E-DRIVE + State Subsidies** — auto-calculated benefit for every eligible scheme
- **Full P&L Model** — monthly revenue, electricity costs, opex, net profit, payback period
- **5-Year ROI projection**
- **PWA-ready** — installable on Android/iOS as a home screen app
- **Mobile-first UI** — dark theme, touch-friendly, works perfectly on phones

---

## Screenshots

| Landing Page | Calculator — Step 1 | Summary Report |
|---|---|---|
| _Hero with market stats_ | _State & charger selection_ | _Full P&L + ROI_ |

> Live preview at **[ev-station-planner.vercel.app](https://ev-station-planner.vercel.app)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Hosting | [Vercel](https://vercel.com) |
| Mobile | [Capacitor](https://capacitorjs.com) (Android APK) |
| Fonts | Geist Sans / Geist Mono (next/font) |

---

## Database Schema

```
states           — 20 states, EV tariffs, duty-exemption info
charger_types    — 6 charger specs with real 2026 pricing
subsidies        — PM E-DRIVE central + 7 state schemes
cost_components  — 16 capex/opex line items
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/harivk90man/ev-station-planner.git
cd ev-station-planner
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the database

Run the migrations in order using the Supabase SQL editor or CLI:

```sql
-- See /supabase/migrations/ for full schema and seed data
-- Or use Supabase MCP to apply migrations automatically
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Building for Android (APK)

The app uses [Capacitor](https://capacitorjs.com) to wrap the static export into a native Android app.

### Prerequisites

- Java JDK 11+
- Android Studio with Android SDK (API 35+)

### Build steps

```bash
# 1. Build static export
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Build debug APK
cd android
./gradlew assembleDebug

# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

For a release (signed) APK:

```bash
./gradlew assembleRelease
```

---

## Deployment

The app auto-deploys to Vercel on every push to `main`. To deploy manually:

```bash
vercel --prod
```

Set the following environment variables in your Vercel project:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

---

## Project Structure

```
src/
├── app/
│   ├── calculator/
│   │   ├── page.tsx           # Route entry point
│   │   └── CalculatorClient.tsx  # 4-step calculator (client component)
│   ├── layout.tsx             # Root layout with metadata + footer
│   ├── page.tsx               # Landing page
│   └── globals.css
├── components/
│   └── Footer.tsx
└── lib/
    └── supabase.ts            # Supabase client
public/
├── manifest.json              # PWA manifest
└── icon.svg                   # App icon
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push and open a PR

---

## License

[MIT](./LICENSE) © 2026 Hariharan

---

## Built by

**Hariharan** — [@harivk90man](https://github.com/harivk90man)

> *"India's EV revolution needs 1.3 million charging stations. Let's build them."*
