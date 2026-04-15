'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

interface State {
  id: string;
  name: string;
  code: string;
  ev_tariff_per_kwh: number;
  electricity_duty_exempt: boolean;
  duty_exempt_years: number | null;
}

interface ChargerType {
  id: string;
  name: string;
  category: 'AC' | 'DC';
  power_kw: number;
  connector_type: string;
  equipment_cost_min: number;
  equipment_cost_max: number;
  installation_cost_min: number;
  installation_cost_max: number;
  suitable_for: string;
}

interface Subsidy {
  id: string;
  state_id: string | null;
  scheme_name: string;
  scheme_type: 'central' | 'state';
  subsidy_percentage: number | null;
  max_subsidy_amount: number | null;
  eligible_charger_types: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
}

interface CostComponent {
  id: string;
  component_name: string;
  category: string;
  cost_min: number;
  cost_max: number;
  depends_on_charger_type: boolean;
  is_recurring: boolean;
}


// ── Helpers ────────────────────────────────────────────────────────────────

const mid = (min: number, max: number) => (min + max) / 2;

const fmt = (n: number): string => {
  if (n < 0) return `−${fmt(-n)}`;
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

// ── Constants ──────────────────────────────────────────────────────────────

const LOCATION_TYPES = [
  { value: 'highway',     label: 'Highway / Dhaba',      icon: '🛣️', desc: 'High traffic, 24/7 ops' },
  { value: 'urban',       label: 'Urban Hub',             icon: '🏙️', desc: 'Office zones, bus stands' },
  { value: 'residential', label: 'Residential Complex',   icon: '🏘️', desc: 'Apartments, societies' },
  { value: 'commercial',  label: 'Mall / Hotel',          icon: '🏪', desc: 'Retail & hospitality' },
];

const STEPS = ['Location', 'Revenue', 'Subsidies', 'Summary'];

// ── Main Component ─────────────────────────────────────────────────────────

export default function CalculatorClient() {
  // Remote data
  const [states, setStates] = useState<State[]>([]);
  const [chargerTypes, setChargerTypes] = useState<ChargerType[]>([]);
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [costComponents, setCostComponents] = useState<CostComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('states').select('*').order('name'),
      supabase.from('charger_types').select('*').order('power_kw'),
      supabase.from('subsidies').select('*'),
      supabase.from('cost_components').select('*'),
    ]).then(([s, ct, sub, cc]) => {
      setStates(s.data ?? []);
      setChargerTypes(ct.data ?? []);
      setSubsidies(sub.data ?? []);
      setCostComponents(cc.data ?? []);
      setLoading(false);
    });
  }, []);

  // Navigation
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedStateId, setSelectedStateId] = useState('');
  const [locationType, setLocationType] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Step 2
  const [chargeRate, setChargeRate] = useState(15);
  const [dailySessions, setDailySessions] = useState(8);
  const [avgKwh, setAvgKwh] = useState(20);

  // Derived from Step 1
  const selectedState = states.find((s) => s.id === selectedStateId) ?? null;
  const selectedChargers = chargerTypes
    .map((ct) => ({ charger: ct, quantity: quantities[ct.id] ?? 0 }))
    .filter((sc) => sc.quantity > 0);
  const totalChargers = selectedChargers.reduce((s, sc) => s + sc.quantity, 0);

  const updateQty = (id: string, delta: number) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(10, (prev[id] ?? 0) + delta)),
    }));

  // ── Calculations ──────────────────────────────────────────────────────────

  const calc = useMemo(() => {
    if (!selectedState || totalChargers === 0) return null;

    // Capex
    const equipmentCost = selectedChargers.reduce(
      (s, { charger, quantity }) =>
        s + mid(charger.equipment_cost_min, charger.equipment_cost_max) * quantity,
      0,
    );
    const installationCost = selectedChargers.reduce(
      (s, { charger, quantity }) =>
        s + mid(charger.installation_cost_min, charger.installation_cost_max) * quantity,
      0,
    );
    const onetimeCost = costComponents
      .filter((c) => !c.is_recurring)
      .reduce((s, c) => {
        const base = mid(c.cost_min, c.cost_max);
        return s + (c.depends_on_charger_type ? base * totalChargers : base);
      }, 0);
    const totalCapex = equipmentCost + installationCost + onetimeCost;

    // Revenue
    const monthlyRevenue = totalChargers * dailySessions * avgKwh * chargeRate * 30;

    // Opex
    const monthlyElectricity =
      totalChargers * dailySessions * avgKwh * selectedState.ev_tariff_per_kwh * 30;
    const monthlyRecurring = costComponents
      .filter((c) => c.is_recurring)
      .reduce((s, c) => {
        const base = mid(c.cost_min, c.cost_max) / 12;
        return s + (c.depends_on_charger_type ? base * totalChargers : base);
      }, 0);
    const monthlyOpex = monthlyElectricity + monthlyRecurring;
    const monthlyProfit = monthlyRevenue - monthlyOpex;

    // Subsidies
    const subsidyDetails = subsidies
      .filter(
        (sub) => sub.state_id === null || sub.state_id === selectedState.id,
      )
      .map((sub) => {
        const eligibleEquipmentCost = selectedChargers
          .filter(
            ({ charger }) =>
              !sub.eligible_charger_types ||
              sub.eligible_charger_types.includes(charger.name),
          )
          .reduce(
            (s, { charger, quantity }) =>
              s + mid(charger.equipment_cost_min, charger.equipment_cost_max) * quantity,
            0,
          );
        const benefit =
          sub.subsidy_percentage && eligibleEquipmentCost > 0
            ? Math.min(
                eligibleEquipmentCost * (sub.subsidy_percentage / 100),
                sub.max_subsidy_amount ?? Infinity,
              )
            : 0;
        return { ...sub, benefit, eligibleEquipmentCost };
      });

    const totalSubsidy = subsidyDetails.reduce((s, sub) => s + sub.benefit, 0);
    const effectiveCapex = totalCapex - totalSubsidy;
    const paybackMonths = monthlyProfit > 0 ? effectiveCapex / monthlyProfit : Infinity;
    const annualProfit = monthlyProfit * 12;
    const fiveYearNet = annualProfit * 5 - effectiveCapex;

    return {
      equipmentCost,
      installationCost,
      onetimeCost,
      totalCapex,
      monthlyRevenue,
      monthlyElectricity,
      monthlyRecurring,
      monthlyOpex,
      monthlyProfit,
      subsidyDetails,
      totalSubsidy,
      effectiveCapex,
      paybackMonths,
      annualProfit,
      fiveYearNet,
    };
  }, [
    selectedState,
    selectedChargers,
    chargeRate,
    dailySessions,
    avgKwh,
    costComponents,
    subsidies,
    totalChargers,
  ]);

  const canProceed =
    step === 1
      ? selectedStateId !== '' && locationType !== '' && totalChargers > 0
      : true;

  const resetAll = () => {
    setStep(1);
    setSelectedStateId('');
    setLocationType('');
    setQuantities({});
    setChargeRate(15);
    setDailySessions(8);
    setAvgKwh(20);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <span className="text-4xl animate-pulse">⚡</span>
        <p className="text-zinc-400 text-sm">Loading data…</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="text-emerald-400 text-lg">⚡</span>
          <span className="font-bold text-sm truncate">EV Station Planner</span>
        </Link>
        <span className="text-xs text-zinc-500 shrink-0 ml-2">Step {step}/4</span>
      </header>

      {/* Step progress */}
      <div className="px-4 pt-4 pb-2 max-w-2xl mx-auto w-full shrink-0">
        <div className="flex items-center">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex-1 flex items-center">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${done
                        ? 'bg-emerald-500 text-zinc-950'
                        : active
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    {done ? '✓' : n}
                  </div>
                  <span
                    className={`text-[9px] mt-0.5 font-medium hidden sm:block leading-none
                      ${active ? 'text-emerald-400' : done ? 'text-zinc-400' : 'text-zinc-600'}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <main className="px-4 py-4 pb-6 max-w-2xl mx-auto w-full space-y-0">

          {/* ── STEP 1: Location & Chargers ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-black mb-1">Where are you setting up?</h1>
                <p className="text-zinc-400 text-xs">Pick your state, location type, and charger mix.</p>
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  State
                </label>
                <select
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select a state...</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{s.ev_tariff_per_kwh}/kWh
                      {s.electricity_duty_exempt ? ` · duty-exempt ${s.duty_exempt_years}yr` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location type */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Location Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_TYPES.map((lt) => (
                    <button
                      key={lt.value}
                      onClick={() => setLocationType(lt.value)}
                      className={`text-left rounded-xl border p-3 transition-all active:scale-95
                        ${locationType === lt.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                    >
                      <div className="text-2xl mb-1">{lt.icon}</div>
                      <div className="text-xs font-bold leading-tight">{lt.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{lt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Charger picker */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Select Chargers
                </label>
                <div className="space-y-2">
                  {chargerTypes.map((ct) => {
                    const qty = quantities[ct.id] ?? 0;
                    return (
                      <div
                        key={ct.id}
                        className={`rounded-xl border p-3 flex items-center gap-3 transition-all
                          ${qty > 0
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-zinc-800 bg-zinc-900'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0
                                ${ct.category === 'AC'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-orange-500/20 text-orange-400'}`}
                            >
                              {ct.category} {ct.power_kw}kW
                            </span>
                            <span className="text-xs font-semibold text-zinc-200 truncate">{ct.name}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {fmt(ct.equipment_cost_min)}–{fmt(ct.equipment_cost_max)} · {ct.connector_type}
                          </div>
                        </div>
                        {/* Quantity picker */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateQty(ct.id, -1)}
                            disabled={qty === 0}
                            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-lg font-bold hover:bg-zinc-700 active:scale-90 transition-all disabled:opacity-20"
                            aria-label="Remove one"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-black tabular-nums">{qty}</span>
                          <button
                            onClick={() => updateQty(ct.id, 1)}
                            disabled={qty >= 10}
                            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-lg font-bold hover:bg-zinc-700 active:scale-90 transition-all disabled:opacity-20"
                            aria-label="Add one"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalChargers > 0 && (
                  <p className="text-xs text-emerald-400 mt-2 font-semibold">
                    {totalChargers} charger{totalChargers > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Revenue Assumptions ──────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <h1 className="text-xl font-black mb-1">Revenue assumptions</h1>
                <p className="text-zinc-400 text-xs">Drag the sliders to match your expected usage.</p>
              </div>

              {[
                {
                  label: 'Charging Rate',
                  unit: '₹/kWh',
                  value: chargeRate,
                  min: 10,
                  max: 25,
                  step: 0.5,
                  onChange: setChargeRate,
                  note: 'Market range: ₹10–₹25/kWh. India avg 2026: ₹14–₹18',
                  display: `₹${chargeRate}`,
                },
                {
                  label: 'Daily Sessions per Charger',
                  unit: 'sessions/day',
                  value: dailySessions,
                  min: 1,
                  max: 30,
                  step: 1,
                  onChange: setDailySessions,
                  note: 'Highway: 15–25 · Urban: 6–15 · Residential: 2–8',
                  display: `${dailySessions}`,
                },
                {
                  label: 'Avg. Energy per Session',
                  unit: 'kWh',
                  value: avgKwh,
                  min: 5,
                  max: 60,
                  step: 5,
                  onChange: setAvgKwh,
                  note: '2W/3W: 5–10 kWh · Cars: 15–30 kWh · Buses: 40–60 kWh',
                  display: `${avgKwh}`,
                },
              ].map((slider) => (
                <div key={slider.label}>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-semibold text-zinc-300">{slider.label}</label>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400 tabular-nums">
                        {slider.display}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">{slider.unit}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={slider.value}
                    onChange={(e) => slider.onChange(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-800
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-6
                      [&::-webkit-slider-thumb]:h-6
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-emerald-500
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-6
                      [&::-moz-range-thumb]:h-6
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-emerald-500
                      [&::-moz-range-thumb]:border-0"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">{slider.note}</p>
                </div>
              ))}

              {/* Live preview */}
              {calc && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Live Preview
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500">Monthly Revenue</p>
                      <p className="text-2xl font-black text-emerald-400">{fmt(calc.monthlyRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Monthly Profit</p>
                      <p className={`text-2xl font-black ${calc.monthlyProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt(calc.monthlyProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Electricity Cost</p>
                      <p className="text-sm font-bold text-zinc-300">{fmt(calc.monthlyElectricity)}/mo</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Payback Period</p>
                      <p className="text-sm font-bold text-zinc-300">
                        {calc.paybackMonths === Infinity
                          ? 'N/A'
                          : calc.paybackMonths < 12
                          ? `${Math.ceil(calc.paybackMonths)} months`
                          : `${(calc.paybackMonths / 12).toFixed(1)} years`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Subsidies ────────────────────────────────────────── */}
          {step === 3 && calc && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-black mb-1">Available Subsidies</h1>
                <p className="text-zinc-400 text-xs">
                  For <span className="text-emerald-400 font-semibold">{selectedState?.name}</span> based on your charger selection.
                </p>
              </div>

              {calc.subsidyDetails.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
                  No active subsidy schemes found for this state and selection.
                </div>
              ) : (
                <div className="space-y-3">
                  {calc.subsidyDetails.map((sub) => (
                    <div
                      key={sub.id}
                      className={`rounded-xl border p-4 transition-colors
                        ${sub.benefit > 0
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-zinc-800 bg-zinc-900 opacity-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mr-1.5
                              ${sub.scheme_type === 'central'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'}`}
                          >
                            {sub.scheme_type}
                          </span>
                          <span className="text-sm font-semibold">{sub.scheme_name}</span>
                        </div>
                        {sub.benefit > 0 && (
                          <span className="text-emerald-400 font-black text-base shrink-0">
                            −{fmt(sub.benefit)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 space-y-0.5">
                        {sub.subsidy_percentage && (
                          <p>
                            {sub.subsidy_percentage}% on equipment · max{' '}
                            {fmt(sub.max_subsidy_amount ?? 0)}
                          </p>
                        )}
                        {sub.valid_until && (
                          <p>
                            Valid until:{' '}
                            {new Date(sub.valid_until).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                        {sub.benefit === 0 && (
                          <p className="text-zinc-600">No eligible charger types in your selection.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subsidy total */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-400 mb-0.5">Total Subsidy Benefit</p>
                  <p className="text-2xl font-black text-emerald-400">{fmt(calc.totalSubsidy)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 mb-0.5">Effective Investment</p>
                  <p className="text-xl font-black text-white">{fmt(calc.effectiveCapex)}</p>
                </div>
              </div>

              <p className="text-[10px] text-zinc-600 leading-relaxed">
                * Subsidy amounts are estimates based on published scheme guidelines. Actual disbursal
                depends on DISCOM approval, documentation, and scheme availability at the time of
                application. Always verify with the nodal agency.
              </p>
            </div>
          )}

          {/* ── STEP 4: Summary Report ───────────────────────────────────── */}
          {step === 4 && calc && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-black mb-1">Your Business Report</h1>
                <p className="text-zinc-400 text-xs">
                  {totalChargers} charger{totalChargers > 1 ? 's' : ''} ·{' '}
                  {selectedState?.name} ·{' '}
                  {LOCATION_TYPES.find((l) => l.value === locationType)?.label}
                </p>
              </div>

              {/* Capital Investment */}
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Capital Investment
                </h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
                  {[
                    { label: 'Equipment Cost', value: calc.equipmentCost },
                    { label: 'Installation Cost', value: calc.installationCost },
                    { label: 'Civil, Electrical & Setup', value: calc.onetimeCost },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-zinc-400">{row.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{fmt(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
                    <span className="text-sm font-bold">Total Capex</span>
                    <span className="text-sm font-black tabular-nums">{fmt(calc.totalCapex)}</span>
                  </div>
                  {calc.totalSubsidy > 0 && (
                    <>
                      <div className="flex items-center justify-between px-4 py-3 text-emerald-400">
                        <span className="text-sm font-semibold">Less: Subsidies</span>
                        <span className="text-sm font-bold tabular-nums">−{fmt(calc.totalSubsidy)}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10">
                        <span className="text-sm font-black text-emerald-300">Effective Investment</span>
                        <span className="text-sm font-black tabular-nums text-emerald-300">
                          {fmt(calc.effectiveCapex)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Monthly P&L */}
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Monthly P&L
                </h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 mr-3">
                      <span className="text-sm text-zinc-400">Revenue</span>
                      <p className="text-[10px] text-zinc-600">
                        {totalChargers}×{dailySessions} sess×{avgKwh}kWh×₹{chargeRate}×30d
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 tabular-nums shrink-0">
                      {fmt(calc.monthlyRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm text-zinc-400">Electricity</span>
                      <p className="text-[10px] text-zinc-600">₹{selectedState?.ev_tariff_per_kwh}/kWh</p>
                    </div>
                    <span className="text-sm font-semibold text-red-400 tabular-nums">
                      −{fmt(calc.monthlyElectricity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-zinc-400">Operations & Maintenance</span>
                    <span className="text-sm font-semibold text-red-400 tabular-nums">
                      −{fmt(calc.monthlyRecurring)}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between px-4 py-3
                      ${calc.monthlyProfit > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}
                  >
                    <span className="text-sm font-black">Net Monthly Profit</span>
                    <span
                      className={`text-sm font-black tabular-nums
                        ${calc.monthlyProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {fmt(calc.monthlyProfit)}
                    </span>
                  </div>
                </div>
              </section>

              {/* ROI Cards */}
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Return on Investment
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Payback',
                      value:
                        calc.paybackMonths === Infinity
                          ? 'N/A'
                          : calc.paybackMonths < 12
                          ? `${Math.ceil(calc.paybackMonths)}mo`
                          : `${(calc.paybackMonths / 12).toFixed(1)}yr`,
                      sub: 'to break even',
                      good: calc.paybackMonths < 84,
                    },
                    {
                      label: 'Annual Profit',
                      value: fmt(calc.annualProfit),
                      sub: 'per year',
                      good: calc.annualProfit > 0,
                    },
                    {
                      label: '5-Year Net',
                      value: fmt(calc.fiveYearNet),
                      sub: 'after capex',
                      good: calc.fiveYearNet > 0,
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-xl border p-3 text-center
                        ${card.good
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-red-500/40 bg-red-500/5'}`}
                    >
                      <p className="text-[10px] text-zinc-500 mb-1">{card.label}</p>
                      <p
                        className={`text-sm font-black tabular-nums leading-tight
                          ${card.good ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {card.value}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{card.sub}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tip */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500 leading-relaxed">
                <span className="font-semibold text-zinc-400">💡 Next steps:</span> Contact your state
                DISCOM for the EV charging connection application, get 3 equipment vendor quotes, and
                apply to PM E-DRIVE via the BEE portal.
              </div>

              {/* Actions */}
              <button
                onClick={resetAll}
                className="w-full rounded-xl border border-zinc-700 py-3.5 text-sm font-semibold text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Sticky bottom navigation */}
      <div className="sticky bottom-0 z-20 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl border border-zinc-700 py-4 text-sm font-semibold text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors active:scale-95"
            >
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex-1 rounded-xl bg-emerald-500 py-4 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              {step === 1 && !canProceed
                ? selectedStateId === '' || locationType === ''
                  ? 'Select state & location'
                  : 'Add at least 1 charger'
                : step === 3
                ? 'View Report →'
                : 'Continue →'}
            </button>
          ) : (
            <Link
              href="/"
              className="flex-1 rounded-xl bg-emerald-500 py-4 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-colors text-center active:scale-95"
            >
              Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
