"use client";

import React from "react";
import { Utensils, TrendingDown } from "lucide-react";
import { isMockUser, getMockCalories } from "@/lib/mock-progress-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface DeficitCaloricoProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
  /** Pre-fetched calorie data from parent */
  preloadedData?: DayData[];
}

interface DayData {
  date: string;
  calories: number;
  target: number;
}

// ─── Motivational copy ────────────────────────────────────────────────────────

function resolveMotivation(
  avgDeficit: number,   // positive = in deficit (ate less than target), negative = surplus
  totalDeficit: number, // sum of daily deficits over period
  period: Period
): { text: string; emoji: string } | null {
  // No data — no message
  if (!isFinite(avgDeficit)) return null;

  if (avgDeficit > 200) {
    return { text: "Ottimo! Stai costruendo il tuo risultato!", emoji: "⭐" };
  }
  if (avgDeficit > 50) {
    return { text: "Buon lavoro, sei in deficit calorico", emoji: "🎯" };
  }
  if (avgDeficit >= -50) {
    return { text: "Sei in equilibrio calorico", emoji: "⚖️" };
  }
  if (avgDeficit >= -200) {
    return { text: "Leggero surplus, monitora l'andamento", emoji: "📊" };
  }
  return { text: "Surplus elevato, cerca di ridurre un po'", emoji: "💡" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeficitCalorico({
  userId,
  startDate,
  endDate,
  period,
  preloadedData,
}: DeficitCaloricoProps) {
  // Resolve data — prefer preloaded, fallback to mock
  let data: DayData[] = [];

  if (preloadedData !== undefined) {
    data = preloadedData;
  } else if (isMockUser(userId)) {
    data = getMockCalories(userId, startDate, endDate) as DayData[];
  }

  // Only consider days that were actually logged (calories > 0)
  const logged = data.filter((d) => d.calories > 0 && d.target > 0);

  if (logged.length === 0) {
    return (
      <CardShell title="Deficit calorico" emoji="⭐">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "5rem" }}>
          <span className="help-text">Nessun dato disponibile</span>
        </div>
      </CardShell>
    );
  }

  // avg deficit per day (positive = ate less than target = good deficit)
  const avgIntake  = Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length);
  const avgTarget  = Math.round(logged.reduce((s, d) => s + d.target,   0) / logged.length);
  const avgDeficit = avgTarget - avgIntake; // positive means under target

  // total deficit across all logged days
  const totalDeficit = logged.reduce((s, d) => s + (d.target - d.calories), 0);

  const motivation = resolveMotivation(avgDeficit, totalDeficit, period);

  const deficitLabel =
    avgDeficit >= 0
      ? `${avgDeficit} kcal in meno al giorno`
      : `${Math.abs(avgDeficit)} kcal in più al giorno`;

  const totalLabel =
    totalDeficit >= 0
      ? `−${Math.round(Math.abs(totalDeficit))} kcal`
      : `+${Math.round(Math.abs(totalDeficit))} kcal`;

  return (
    <CardShell title="Deficit calorico" emoji="⭐">
      {/* Primary metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {Math.abs(avgDeficit)}
        </span>{" "}
        {deficitLabel}
      </div>

      {/* Two stat rows */}
      <div
        style={{
          display:         "flex",
          flexDirection:   "column",
          gap:             "var(--spacing-3)",
          marginTop:       "var(--spacing-1)",
          paddingTop:      "var(--spacing-5)",
          paddingBottom:   "var(--spacing-5)",
          paddingLeft:     "var(--spacing-5)",
          paddingRight:    "var(--spacing-5)",
          borderRadius:    "var(--rounded-4)",
          backgroundColor: "var(--neutral-bg)",
        }}
      >
        {/* Row 1 — avg intake */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2-5)" }}>
            <div
              style={{
                width:           "2rem",
                height:          "2rem",
                borderRadius:    "var(--rounded-full)",
                backgroundColor: "var(--primary-surface)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                flexShrink:      0,
              }}
            >
              <Utensils size={14} color="var(--invert)" strokeWidth={2} />
            </div>
            <span className="body-sm" style={{ color: "var(--subtitle-2)" }}>
              Media ingerite al giorno
            </span>
          </div>
          <span className="label-md" style={{ color: "var(--subtitle-1)", flexShrink: 0 }}>
            {avgIntake.toLocaleString("it-IT")} kcal
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: "var(--border-1)", backgroundColor: "var(--border)" }} />

        {/* Row 2 — total deficit */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2-5)" }}>
            <div
              style={{
                width:           "2rem",
                height:          "2rem",
                borderRadius:    "var(--rounded-full)",
                backgroundColor: "var(--primary-surface)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                flexShrink:      0,
              }}
            >
              <TrendingDown size={14} color="var(--invert)" strokeWidth={2} />
            </div>
            <span className="body-sm" style={{ color: "var(--subtitle-2)" }}>
              Totale deficit della settimana
            </span>
          </div>
          <span
            className="label-md"
            style={{
              color:     totalDeficit >= 0 ? "var(--primary-action)" : "var(--danger-action)",
              flexShrink: 0,
            }}
          >
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Motivational footer */}
      {motivation && (
        <div
          style={{
            textAlign:  "center",
            paddingTop: "var(--spacing-1)",
          }}
        >
          <span
            className="body-sm"
            style={{ color: "var(--subtitle-2)", fontStyle: "italic" }}
          >
            {motivation.text}
          </span>
        </div>
      )}
    </CardShell>
  );
}

// ─── Card Shell ──────────────────────────────────────────────────────────────

function CardShell({
  title,
  emoji,
  children,
}: {
  title:    string;
  emoji:    string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        boxShadow:       "var(--shadow-sm)",
        borderRadius:    "var(--rounded-6)",
        padding:         "var(--spacing-4)",
        display:         "flex",
        flexDirection:   "column",
        gap:             "var(--spacing-2)",
      }}
    >
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}
      >
        <span className="card-main-title">{title}</span>
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{emoji}</span>
      </div>
      {children}
    </div>
  );
}
