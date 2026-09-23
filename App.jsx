import { useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Mail,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";

/* ═══════════════════════════ Config & mock data ═══════════════════════════ */

const SAFE_THRESHOLD = 5000; // "Safe Operating Threshold" drawn on the chart (฿)
const SUPPLIER_PAYABLE = 25000; // the big payable that lands on Day 16

/**
 * 30-day cash-flow forecast (THB) for "Mae Bua Coffee".
 * The story behind the numbers (use this in your pitch!):
 *  - Days 1–15 : steady operating burn with small sales bumps;
 *                rent + utilities hit on Day 5, payroll on Day 10.
 *  - Day 16    : the ฿25,000 supplier payable lands → the cash crunch begins.
 *  - Day 18    : lowest point of the month (฿1,200).
 *  - Days 19–30: slow recovery as sales continue → ends at ฿8,500.
 */
const BASE_DATA = [
  { day: 1, balance: 45000 },
  { day: 2, balance: 44150 },
  { day: 3, balance: 44850 }, // weekend sales bump
  { day: 4, balance: 43950 },
  { day: 5, balance: 38050 }, // rent + utilities
  { day: 6, balance: 38900 },
  { day: 7, balance: 38000 },
  { day: 8, balance: 37150 },
  { day: 9, balance: 37950 }, // sales bump
  { day: 10, balance: 30550 }, // payroll
  { day: 11, balance: 31400 },
  { day: 12, balance: 30550 },
  { day: 13, balance: 29750 },
  { day: 14, balance: 30550 }, // sales bump
  { day: 15, balance: 27000 }, // marketing + subscriptions
  { day: 16, balance: 1950 }, // ⚠ supplier payable ฿25,000 hits
  { day: 17, balance: 1550 },
  { day: 18, balance: 1200 }, // lowest point of the month
  { day: 19, balance: 1650 }, // recovery begins
  { day: 20, balance: 2100 },
  { day: 21, balance: 2650 },
  { day: 22, balance: 3150 },
  { day: 23, balance: 3700 },
  { day: 24, balance: 4250 },
  { day: 25, balance: 4750 },
  { day: 26, balance: 5350 }, // back above the safe threshold
  { day: 27, balance: 6100 },
  { day: 28, balance: 6800 },
  { day: 29, balance: 7650 },
  { day: 30, balance: 8500 },
];

const CRUNCH_DAY = 18;
const CRUNCH_LOW = BASE_DATA.find((d) => d.day === CRUNCH_DAY).balance; // ฿1,200

const fmtBaht = (v) => `฿${Math.round(v).toLocaleString("en-US")}`;
const dayLabel = (d) => `Day ${d}`;

/* ═══════════════════════════ Small shared pieces ═══════════════════════════ */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const balance = payload[0].value;
  const belowSafe = balance < SAFE_THRESHOLD;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {dayLabel(label)}
      </p>
      <p className={`text-sm font-bold ${belowSafe ? "text-red-600" : "text-slate-800"}`}>
        {fmtBaht(balance)}
      </p>
      {belowSafe && (
        <p className="mt-0.5 text-[11px] font-medium text-red-500">
          Below safe threshold ({fmtBaht(SAFE_THRESHOLD)})
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════ Header ═══════════════════════════════ */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-slate-900">
              CashFlow<span className="text-indigo-600">Pulse</span>
            </p>
            <p className="text-[11px] leading-tight text-slate-400">
              SME cash-flow early warning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">
                Mae Bua Coffee
              </p>
              <p className="text-xs leading-tight text-slate-400">Business account</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-sm font-bold text-white shadow ring-2 ring-white">
              MB
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════ 1. Top summary cards ════════════════════════ */

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card 1 — Current Cash Balance */}
      <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Wallet className="h-5 w-5 text-slate-800" />
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Synced just now
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Current Cash Balance</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">฿45,200</p>
        <p className="mt-1 text-xs text-slate-400">Across linked bank & PromptPay accounts</p>
      </article>

      {/* Card 2 — Projected 30-Day Balance */}
      <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <TrendingDown className="h-5 w-5 text-slate-500" />
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            −81% vs today
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Projected 30-Day Balance</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">฿8,500</p>
        <p className="mt-1 text-xs text-slate-400">Forecast for Day 30 · updated daily</p>
      </article>

      {/* Card 3 — Financial Health Status */}
      <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">
            Action needed
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Financial Health Status</p>
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            High Risk of Deficit
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">Crunch expected on Day 16 · act within 14 days</p>
      </article>
    </section>
  );
}

/* ════════════════════ 3. Smart deficit alert banner ════════════════════ */

function DeficitAlert({ onAction }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-700">
              ⚠️ Early Warning: Cash Crunch Detected
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-red-700/80">
              Your cash balance is projected to fall below the safe operational
              threshold in 14 days due to upcoming supplier payables (฿25,000) on
              Day 16.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-red-600">
                <CalendarClock className="h-3 w-3" />
                Payable due: Day 16
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-red-600">
                Impact: −{fmtBaht(SUPPLIER_PAYABLE)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-red-600">
                Model confidence: 92%
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
          <button
            type="button"
            onClick={() => onAction("delay")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            Delay Supplier Payment
          </button>
          <button
            type="button"
            onClick={() => onAction("remind")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <Mail className="h-4 w-4" />
            Send Invoice Reminders
          </button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ 2. Predictive cash-flow chart ══════════════════ */

function ForecastChart({ data, extraExpense, onReset }) {
  // If the what-if scenario pushes any day below ฿0, the line turns red.
  const hasDeficit = data.some((d) => d.balance < 0);
  const lineColor = hasDeficit ? "#dc2626" : "#4f46e5";
  const gradientId = hasDeficit ? "crimsonFill" : "indigoFill";

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Predictive Cash-Flow: 30-Day Forecast
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Projected end-of-day balance · simulated data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {extraExpense > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              What-if: −{fmtBaht(extraExpense)}
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset what-if scenario"
                className="rounded-full p-0.5 transition hover:bg-amber-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-4 rounded-full" style={{ background: lineColor }} />
            Forecast balance
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-0 w-4 border-t-2 border-dashed border-red-500" />
            Safe threshold {fmtBaht(SAFE_THRESHOLD)}
          </span>
        </div>
      </div>

      <div className="mt-4 h-[320px] w-full min-w-0 sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 28, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="crimsonFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="day"
              type="category"
              ticks={[1, 5, 10, 15, 20, 25, 30]}
              tickFormatter={dayLabel}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `฿${Math.round(v / 1000)}k`}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={52}
              /* Round the axis to ฿10k steps so the line fills the chart,
                 and stretch downward automatically if a scenario goes negative. */
              domain={[
                (dataMin) => Math.floor(Math.min(0, dataMin) / 10000) * 10000,
                (dataMax) => Math.ceil(dataMax / 10000) * 10000,
              ]}
              tickCount={6}
              allowDecimals={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
            />
            <ReferenceLine
              y={SAFE_THRESHOLD}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              label={{
                value: `Safe Operating Threshold (${fmtBaht(SAFE_THRESHOLD)})`,
                position: "insideTopLeft",
                fill: "#dc2626",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            {/* Red dot that tracks the lowest point of the month */}
            <ReferenceDot
              x={CRUNCH_DAY}
              y={CRUNCH_LOW - extraExpense}
              r={5}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Cash balance"
              stroke={lineColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
        <span>
          Lowest point:{" "}
          <span className="font-semibold text-red-500">
            {fmtBaht(CRUNCH_LOW - extraExpense)} on {dayLabel(CRUNCH_DAY)}
          </span>{" "}
          — caused by the {fmtBaht(SUPPLIER_PAYABLE)} supplier payable on Day 16.
        </span>
      </p>
    </section>
  );
}

/* ═════════════════ 4. "What-If" scenario simulator ═════════════════ */

function ScenarioSimulator({
  expense,
  setExpense,
  firstNegative,
  firstBelowSafe,
  minPoint,
  endBalance,
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
          <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Test a Financial Decision</h2>
          <p className="text-xs text-slate-400">What-if scenario simulator</p>
        </div>
      </div>

      {/* Dynamic value of the slider */}
      <p className="mt-5 text-sm text-slate-500">
        Simulate New Expense (฿) — Expected Cost:{" "}
        <span
          className={`text-2xl font-bold tracking-tight ${
            expense > 0 ? "text-indigo-600" : "text-slate-900"
          }`}
        >
          {fmtBaht(expense)}
        </span>
      </p>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={30000}
          step={1000}
          value={expense}
          onChange={(e) => setExpense(Number(e.target.value))}
          className="cfp-slider"
          aria-label="Simulate new expense in Thai Baht"
        />
        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400">
          <span>฿0</span>
          <span>฿30,000</span>
        </div>
      </div>

      {/* Quick presets — handy during the live demo */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[0, 10000, 20000, 30000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setExpense(v)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              expense === v
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {v === 0 ? "Reset" : fmtBaht(v)}
          </button>
        ))}
      </div>

      {/* Impact summary */}
      <div className="mt-5 space-y-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3.5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-slate-500">Projected lowest balance</span>
          <span className="text-right font-semibold text-slate-800">
            <span className={minPoint.balance < 0 ? "text-red-600" : "text-slate-800"}>
              {fmtBaht(minPoint.balance)}
            </span>{" "}
            <span className="text-xs font-normal text-slate-400">
              on {dayLabel(minPoint.day)}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 text-sm">
          <span className="text-slate-500">Balance on Day 30</span>
          <span
            className={`font-semibold ${endBalance < 0 ? "text-red-600" : "text-slate-800"}`}
          >
            {fmtBaht(endBalance)}
          </span>
        </div>
      </div>

      {/* Conditional warning */}
      {firstNegative ? (
        <div className="mt-4 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-semibold leading-snug text-red-600">
            Alert: This purchase will cause a negative cash balance on{" "}
            {dayLabel(firstNegative.day)}!
          </p>
        </div>
      ) : (
        firstBelowSafe && (
          <div className="mt-4 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm leading-snug text-amber-700">
              Balance dips below the {fmtBaht(SAFE_THRESHOLD)} safety threshold on{" "}
              {dayLabel(firstBelowSafe.day)} — plan carefully.
            </p>
          </div>
        )
      )}
    </section>
  );
}

/* ═══════════════════════════════ Toast ═══════════════════════════════ */

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast-in fixed bottom-5 right-5 z-50 flex max-w-xs items-start gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      <p className="text-sm leading-snug">{message}</p>
    </div>
  );
}

/* ═══════════════════════════════ App ═══════════════════════════════ */

export default function App() {
  const [expense, setExpense] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const handleAlertAction = (type) => {
    showToast(
      type === "delay"
        ? "Request sent to supplier — rescheduling the ฿25,000 payment to Day 24 is pending approval."
        : "Invoice reminders sent to 4 overdue customers — ฿18,700 expected within 7 days."
    );
  };

  /* The what-if engine: subtract the simulated expense from EVERY day of the forecast. */
  const adjustedData = useMemo(
    () => BASE_DATA.map((d) => ({ ...d, balance: d.balance - expense })),
    [expense]
  );
  const firstNegative = useMemo(
    () => adjustedData.find((d) => d.balance < 0),
    [adjustedData]
  );
  const firstBelowSafe = useMemo(
    () => adjustedData.find((d) => d.balance < SAFE_THRESHOLD),
    [adjustedData]
  );
  const minPoint = useMemo(
    () => adjustedData.reduce((a, b) => (b.balance < a.balance ? b : a)),
    [adjustedData]
  );
  const endBalance = adjustedData[adjustedData.length - 1].balance;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900">Cash-flow overview</h1>
          <p className="text-sm text-slate-400">{today} · Forecast updated 08:15</p>
        </div>

        {/* 1. Summary cards */}
        <SummaryCards />

        {/* 3. Smart deficit alert */}
        <div className="mt-5">
          <DeficitAlert onAction={handleAlertAction} />
        </div>

        {/* 2. Forecast chart + 4. What-if simulator */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <ForecastChart
              data={adjustedData}
              extraExpense={expense}
              onReset={() => setExpense(0)}
            />
          </div>
          <ScenarioSimulator
            expense={expense}
            setExpense={setExpense}
            firstNegative={firstNegative}
            firstBelowSafe={firstBelowSafe}
            minPoint={minPoint}
            endBalance={endBalance}
          />
        </div>

        <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
          CashFlowPulse · ZERO ORIGIN hackathon prototype · all data is simulated
          for demonstration
        </footer>
      </main>

      <Toast message={toast} />
    </div>
  );
}
