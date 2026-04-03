"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab    = "obiettivo" | "macros";
type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "settimana", label: "Settimana" },
  { value: "1mese",     label: "1 Mese"    },
  { value: "2mesi",     label: "2 Mesi"    },
  { value: "3mesi",     label: "3 Mesi"    },
];

const PERIOD_DAYS: Record<Period, number> = {
  settimana: 7,
  "1mese":   30,
  "2mesi":   60,
  "3mesi":   90,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger — styled as neutral-invert button */}
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
          backgroundColor: "var(--aila-button-neutral-invert-bg-default)",
          color:           "var(--aila-button-neutral-invert-text-default)",
          border:          "var(--aila-button-border-width) solid transparent",
          cursor:          "pointer",
          outline:         "none",
          userSelect:      "none",
          boxShadow:       "var(--shadow-xs)",
          transition:      "var(--aila-button-transition)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--aila-button-neutral-invert-bg-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--aila-button-neutral-invert-bg-default)";
        }}
      >
        <span className="label-sm">{label}</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open && (
        <>
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
                  backgroundColor: opt.value === value ? "var(--neutral-tonal)" : "transparent",
                  color:           opt.value === value ? "var(--neutral-action)" : "var(--body)",
                  cursor:          "pointer",
                  border:          "none",
                  outline:         "none",
                  transition:      "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--neutral-tonal-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    opt.value === value ? "var(--neutral-tonal)" : "transparent";
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

// ─── PeriodNavigator ─────────────────────────────────────────────────────────
// Looks like a neutral-invert button, chevrons on each side, small date text

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
  const days      = PERIOD_DAYS[period];
  const startDate = addDays(endDate, -(days - 1));
  const today     = startOfDay(new Date());
  const isToday   = startOfDay(endDate).getTime() === today.getTime();

  const rangeLabel = isToday
    ? `${formatDate(startDate)} – ${formatDate(endDate)} (oggi)`
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // shared chevron button style
  const chevronStyle = (disabled: boolean): React.CSSProperties => ({
    display:         "inline-flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "none",
    border:          "none",
    padding:         "0 var(--spacing-1)",
    cursor:          disabled ? "not-allowed" : "pointer",
    color:           disabled ? "var(--disabled-font)" : "var(--neutral-action)",
    opacity:         disabled ? 0.4 : 1,
    flexShrink:      0,
    outline:         "none",
  });

  return (
    <div
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        flex:            1,
        minWidth:        0,
        height:          "calc(var(--spacing-1-5) * 2 + 1.25rem + 2 * var(--border-1))",
        paddingLeft:     "var(--spacing-1)",
        paddingRight:    "var(--spacing-1)",
        borderRadius:    "var(--rounded-full)",
        backgroundColor: "var(--aila-button-neutral-invert-bg-default)",
        boxShadow:       "var(--shadow-xs)",
        border:          "var(--aila-button-border-width) solid transparent",
        gap:             "var(--spacing-1)",
        overflow:        "hidden",
        boxSizing:       "border-box",
      }}
    >
      {/* prev */}
      <button style={chevronStyle(false)} onClick={onPrev}>
        <ChevronLeft size={15} strokeWidth={2.5} />
      </button>

      {/* range label */}
      <span
        className="body-sm"
        style={{
          flex:         1,
          textAlign:    "center",
          color:        "var(--subtitle-1)",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          userSelect:   "none",
        }}
      >
        {rangeLabel}
      </span>

      {/* next — disabled when end = today */}
      <button
        style={chevronStyle(isToday)}
        onClick={onNext}
        disabled={isToday}
      >
        <ChevronRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function ProgressoContent() {
  const router = useRouter();

  const [tab,    setTab]    = useState<Tab>("obiettivo");
  const [period, setPeriod] = useState<Period>("1mese");

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
      <div style={{ marginLeft: "calc(-1 * var(--spacing-1))" }}>
        <Button
          variant="neutral-link"
          size="sm"
          iconStart={ChevronLeft}
          onClick={() => router.back()}
        >
          Indietro
        </Button>
      </div>

      {/* Tabs — two separate buttons, no card */}
      <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
        <Button
          variant={tab === "obiettivo" ? "neutral" : "neutral-invert"}
          size="sm"
          fullWidth
          style={{ flex: 1 }}
          onClick={() => setTab("obiettivo")}
        >
          Obiettivo
        </Button>
        <Button
          variant={tab === "macros" ? "neutral" : "neutral-invert"}
          size="sm"
          fullWidth
          style={{ flex: 1 }}
          onClick={() => setTab("macros")}
        >
          Macros
        </Button>
      </div>

      {/* Period selector row — no card */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
        <PeriodSelect value={period} onChange={handlePeriodChange} />
        <PeriodNavigator
          endDate={endDate}
          period={period}
          onPrev={handlePrev}
          onNext={handleNext}
        />
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
