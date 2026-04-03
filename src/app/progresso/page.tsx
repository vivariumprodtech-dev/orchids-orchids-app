"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab     = "obiettivo" | "macros";
type Period  = "settimana" | "1mese" | "2mesi" | "3mesi";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "settimana", label: "Settimana" },
  { value: "1mese",     label: "1 Mese"    },
  { value: "2mesi",     label: "2 Mesi"    },
  { value: "3mesi",     label: "3 Mesi"    },
];

// How many days each period spans
const PERIOD_DAYS: Record<Period, number> = {
  settimana: 7,
  "1mese":   30,
  "2mesi":   60,
  "3mesi":   90,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** "22 Gen 2026" */
function formatDate(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

// ─── PeriodSelect ─────────────────────────────────────────────────────────────

function PeriodSelect({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? "";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "var(--spacing-1-5)",
          paddingTop:      "var(--spacing-1-5)",
          paddingBottom:   "var(--spacing-1-5)",
          paddingLeft:     "var(--spacing-3)",
          paddingRight:    "var(--spacing-2-5)",
          borderRadius:    "var(--rounded-full)",
          backgroundColor: "var(--primary-tonal)",
          color:           "var(--primary-text)",
          border:          "var(--border-1) solid var(--primary-surface-light)",
          cursor:          "pointer",
          outline:         "none",
          userSelect:      "none",
        }}
      >
        <span className="label-sm">{label}</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position:        "absolute",
              top:             "calc(100% + var(--spacing-1-5))",
              left:            0,
              zIndex:          20,
              backgroundColor: "var(--background)",
              borderRadius:    "var(--rounded-4)",
              boxShadow:       "var(--shadow-lg)",
              border:          "var(--border-1) solid var(--border)",
              overflow:        "hidden",
              minWidth:        "9rem",
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display:         "block",
                  width:           "100%",
                  textAlign:       "left",
                  padding:         "var(--spacing-2-5) var(--spacing-4)",
                  backgroundColor: opt.value === value ? "var(--primary-tonal)" : "transparent",
                  color:           opt.value === value ? "var(--primary-text)" : "var(--body)",
                  cursor:          "pointer",
                  border:          "none",
                  outline:         "none",
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--neutral-tonal-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    opt.value === value ? "var(--primary-tonal)" : "transparent";
                }}
              >
                <span className="label-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PeriodNavigator ──────────────────────────────────────────────────────────

function PeriodNavigator({
  endDate,
  period,
  onPrev,
  onNext,
}: {
  endDate: Date;
  period:  Period;
  onPrev:  () => void;
  onNext:  () => void;
}) {
  const days       = PERIOD_DAYS[period];
  const startDate  = addDays(endDate, -(days - 1));
  const today      = startOfDay(new Date());
  const isToday    = startOfDay(endDate).getTime() === today.getTime();

  const rangeLabel = isToday
    ? `${formatDate(startDate)} a ${formatDate(endDate)} (oggi)`
    : `${formatDate(startDate)} a ${formatDate(endDate)}`;

  return (
    <div
      style={{
        display:         "flex",
        alignItems:      "center",
        gap:             "var(--spacing-1)",
        flex:            1,
        minWidth:        0,
      }}
    >
      {/* prev */}
      <button
        onClick={onPrev}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "var(--spacing-7)",
          height:          "var(--spacing-7)",
          borderRadius:    "var(--rounded-full)",
          backgroundColor: "transparent",
          border:          "none",
          cursor:          "pointer",
          color:           "var(--subtitle-2)",
          flexShrink:      0,
        }}
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      {/* label */}
      <span
        style={{
          flex:        1,
          textAlign:   "center",
          color:       "var(--subtitle-1)",
          fontSize:    "0.75rem",
          fontWeight:  500,
          lineHeight:  "1rem",
          whiteSpace:  "nowrap",
          overflow:    "hidden",
          textOverflow:"ellipsis",
        }}
      >
        {rangeLabel}
      </span>

      {/* next — disabled when end = today */}
      <button
        onClick={onNext}
        disabled={isToday}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "var(--spacing-7)",
          height:          "var(--spacing-7)",
          borderRadius:    "var(--rounded-full)",
          backgroundColor: "transparent",
          border:          "none",
          cursor:          isToday ? "not-allowed" : "pointer",
          color:           isToday ? "var(--disabled-font)" : "var(--subtitle-2)",
          flexShrink:      0,
          opacity:         isToday ? 0.4 : 1,
        }}
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── SegmentedTabs ────────────────────────────────────────────────────────────

function SegmentedTabs({
  value,
  onChange,
}: {
  value:    Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div
      style={{
        display:         "flex",
        backgroundColor: "var(--neutral-tonal)",
        borderRadius:    "var(--rounded-full)",
        padding:         "var(--spacing-1)",
        gap:             "var(--spacing-1)",
        border:          "var(--border-1) solid var(--border)",
      }}
    >
      {(["obiettivo", "macros"] as Tab[]).map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              flex:            1,
              paddingTop:      "var(--spacing-1-5)",
              paddingBottom:   "var(--spacing-1-5)",
              paddingLeft:     "var(--spacing-4)",
              paddingRight:    "var(--spacing-4)",
              borderRadius:    "var(--rounded-full)",
              border:          "none",
              cursor:          "pointer",
              backgroundColor: active ? "var(--color-neutral-800)" : "transparent",
              color:           active ? "var(--invert)" : "var(--subtitle-2)",
              transition:      "background-color 0.15s, color 0.15s",
              outline:         "none",
              userSelect:      "none",
            }}
          >
            <span className="label-sm">
              {tab === "obiettivo" ? "Obiettivo" : "Macros"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function ProgressoContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [tab,     setTab]     = useState<Tab>("obiettivo");
  const [period,  setPeriod]  = useState<Period>("1mese");

  // endDate starts at today; navigation shifts it back/forward by 'period' days
  const today = useMemo(() => startOfDay(new Date()), []);
  const [endDate, setEndDate] = useState<Date>(today);

  const days = PERIOD_DAYS[period];

  function handlePrev() {
    setEndDate((d) => addDays(d, -days));
  }

  function handleNext() {
    const next = addDays(endDate, days);
    if (next.getTime() > today.getTime()) return;
    setEndDate(next);
  }

  // When period changes, snap end back to today
  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setEndDate(today);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "var(--neutral-bg)",
        padding:         "var(--spacing-4)",
        gap:             "var(--spacing-3)",
      }}
    >
      {/* Back */}
      <div style={{ display: "flex", alignItems: "center", marginLeft: "calc(-1 * var(--spacing-1))" }}>
        <Button
          variant="neutral-link"
          size="sm"
          iconStart={ChevronLeft}
          onClick={() => router.back()}
        >
          Indietro
        </Button>
      </div>

      {/* Header card */}
      <div
        style={{
          backgroundColor: "var(--background)",
          borderRadius:    "var(--rounded-6)",
          boxShadow:       "var(--shadow-sm)",
          padding:         "var(--spacing-4)",
          display:         "flex",
          flexDirection:   "column",
          gap:             "var(--spacing-3)",
        }}
      >
        {/* Tabs */}
        <SegmentedTabs value={tab} onChange={setTab} />

        {/* Period selector row */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          <PeriodSelect value={period} onChange={handlePeriodChange} />
          <PeriodNavigator
            endDate={endDate}
            period={period}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Page title */}
      <h1 className="page-title" style={{ paddingLeft: "var(--spacing-1)" }}>
        Tuo progresso
      </h1>

      {/* Placeholder */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow:       "var(--shadow-sm)",
          borderRadius:    "var(--rounded-6)",
          padding:         "var(--spacing-6)",
          display:         "flex",
          flexDirection:   "column",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "var(--spacing-2)",
          minHeight:       "12rem",
        }}
      >
        <span className="card-secondary-title">In arrivo</span>
        <span className="help-text">Metriche su obiettivi, kcal e macro</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressoPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "var(--neutral-bg)" }}
        >
          <span className="body-md" style={{ color: "var(--placeholder)" }}>
            Caricamento…
          </span>
        </div>
      }
    >
      <ProgressoContent />
    </Suspense>
  );
}
