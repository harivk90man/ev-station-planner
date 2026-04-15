import Link from "next/link";

const stats = [
  { value: "1.3M+", label: "Charging stations needed by 2030" },
  { value: "₹3.2L Cr", label: "Market opportunity by 2030" },
  { value: "20+", label: "States with active EV subsidies" },
  { value: "30–50%", label: "Subsidy on equipment cost" },
];

const steps = [
  {
    num: "01",
    title: "Pick Your State & Charger",
    desc: "Select your target state and charger type — from AC 7.4 kW home chargers to 120 kW highway fast chargers.",
  },
  {
    num: "02",
    title: "Model Your Costs",
    desc: "Get itemised capex and opex — equipment, civil work, electrical connections, and recurring costs — based on real 2026 market data.",
  },
  {
    num: "03",
    title: "Apply Subsidies",
    desc: "Automatically apply PM E-DRIVE and state-level subsidies to reduce your effective investment by up to 50%.",
  },
  {
    num: "04",
    title: "See Your ROI",
    desc: "Project monthly revenue, payback period, and 5-year returns based on realistic utilisation scenarios.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-emerald-400">
            ⚡
          </span>
          <span className="text-lg font-bold tracking-tight">
            EV Station Planner
          </span>
        </div>
        <Link
          href="/calculator"
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
        >
          Launch Calculator
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center flex-1 relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-6">
            India EV Revolution
          </span>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            <span className="text-white">1.3 Million</span>
            <br />
            <span className="text-emerald-400">Charging Stations</span>
            <br />
            <span className="text-zinc-400 text-4xl md:text-5xl font-bold">
              needed by 2030
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            India&apos;s EV infrastructure gap is your business opportunity.
            Plan your charging station with real subsidy data, state EV
            tariffs, and accurate ROI projections — built for Indian
            entrepreneurs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/calculator"
              className="rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
            >
              Start Planning for Free →
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-zinc-700 px-8 py-4 text-base font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 bg-zinc-900/50 px-6 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-1">
                {s.value}
              </div>
              <div className="text-sm text-zinc-400 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-4">
            From idea to investment in{" "}
            <span className="text-emerald-400">4 steps</span>
          </h2>
          <p className="text-zinc-400 text-center mb-14 max-w-xl mx-auto">
            No spreadsheets. No guesswork. Just accurate numbers based on the
            latest 2026 India market data.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-emerald-500/40 transition-colors"
              >
                <div className="text-4xl font-black text-emerald-500/30 mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-16 bg-emerald-500/10 border-t border-emerald-500/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Ready to build India&apos;s EV future?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join thousands of entrepreneurs already planning with EV Station
            Planner. It&apos;s free to get started.
          </p>
          <Link
            href="/calculator"
            className="inline-block rounded-full bg-emerald-500 px-10 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Open the Calculator →
          </Link>
        </div>
      </section>

    </div>
  );
}
