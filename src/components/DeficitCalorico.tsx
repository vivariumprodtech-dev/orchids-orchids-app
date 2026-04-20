"use client";

import React from "react";
import { Utensils, TrendingDown, Info } from "lucide-react";
import { isMockUser, getMockCalories } from "@/lib/mock-progress-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface DeficitCaloricoProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
  preloadedData?: DayData[];
}

interface DayData {
  date: string;
  calories: number;
  target: number;
  fabbisogno?: number; // BMR + active calories (preferred reference)
}

// ─── Date range label ─────────────────────────────────────────────────────────

const MONTHS_IT = ["gen","feb","mar","apr","mai","giu","lug","ago","set","ott","nov","dic"];

function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const ddS = String(sd).padStart(2, "0");
  const ddE = String(ed).padStart(2, "0");
  if (sm === em && sy === ey) {
    return `${ddS} a ${ddE} ${MONTHS_IT[em - 1]}`;
  }
  return `${ddS} ${MONTHS_IT[sm - 1]} a ${ddE} ${MONTHS_IT[em - 1]}`;
}

// ─── Motivational copy ────────────────────────────────────────────────────────

interface MotivationResult {
  title:   string;
  emoji:   string;
  message: string;
}

function resolveMotivation(avgDiff: number, avgRef: number): MotivationResult {
  const pct = avgDiff / avgRef;

  if (pct <= -0.50) return {
    title:   "Deficit calorico",
    emoji:   "📋",
    message: "Deficit alto, controlla di aver loggato tutti i pasti",
  };
  if (pct <= -0.05) return {
    title:   "Deficit calorico",
    emoji:   "🌟",
    message: "Ogni giorno in deficit è un passo verso il tuo obiettivo",
  };
  if (pct < 0.05) return {
    title:   "Nella media",
    emoji:   "💪",
    message: "Stabile e costante, il percorso è questo",
  };
  if (pct < 0.50) return {
    title:   "Surplus calorico",
    emoji:   "🏃",
    message: "Essere consapevole è già un passo, continuiamo",
  };
  return {
    title:   "Surplus calorico",
    emoji:   "🏃",
    message: "Succede, continua e rientriamo nell'obiettivo",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeficitCalorico({
  userId,
  startDate,
  endDate,
  period,
  preloadedData,
}: DeficitCaloricoProps) {
  let data: DayData[] = [];
  if (preloadedData !== undefined) {
    data = preloadedData;
  } else if (isMockUser(userId)) {
    data = getMockCalories(userId, startDate, endDate) as DayData[];
  }

  const logged = data.filter((d) => d.calories > 0 && (d.fabbisogno ?? d.target) > 0);

  if (logged.length === 0) {
    return (
      <CardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "5rem" }}>
          <span className="help-text">Nessun dato disponibile</span>
        </div>
      </CardShell>
    );
  }

  // ref = fabbisogno (BMR + active). Positive diff = surplus, negative = deficit.
  const avgIntake    = Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length);
  const avgRef       = Math.round(logged.reduce((s, d) => s + (d.fabbisogno ?? d.target), 0) / logged.length);
  const avgDiff   = avgIntake - avgRef;
  const totalDiff = Math.round(logged.reduce((s, d) => s + (d.calories - (d.fabbisogno ?? d.target)), 0));

  const { title: cardTitle, emoji: cardEmoji, message: cardMessage } = resolveMotivation(avgDiff, avgRef);

  const deficitSuffix = avgDiff <= 0 ? "kcal in meno al giorno" : "kcal in più al giorno";

  return (
    <CardShell>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span className="card-main-title">{cardTitle}</span>
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{cardEmoji}</span>
      </div>

      {/* Primary metric */}
      <div
        className="card-text"
        style={{ color: "var(--subtitle-1)", display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}
      >
        <span className="card-number-md" style={{ display: "inline" }}>
          {Math.abs(avgDiff)}
        </span>{" "}
        {deficitSuffix}
        <Info size={15} style={{ color: "var(--placeholder)", flexShrink: 0 }} strokeWidth={1.5} />
      </div>

      {/* Stat rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: "var(--spacing-2)" }}>

        {/* Row 1 — avg intake */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            paddingTop:     "var(--spacing-2)",
            paddingBottom:  "var(--spacing-1-5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
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
              <Utensils size={15} color="var(--invert)" strokeWidth={2} />
            </div>
            <span className="body-sm" style={{ color: "var(--subtitle-2)" }}>
              Media ingerite al giorno
            </span>
          </div>
          <span className="body-sm" style={{ color: "var(--subtitle-1)", flexShrink: 0 }}>
            <strong>{avgIntake.toLocaleString("it-IT")}</strong> kcal
          </span>
        </div>
       

        {/* Row 2 — total deficit */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            paddingTop:     "var(--spacing-1-5)",
            paddingBottom:  "var(--spacing-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
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
              <TrendingDown size={15} color="var(--invert)" strokeWidth={2} />
            </div>
            <span className="body-sm" style={{ color: "var(--subtitle-2)" }}>
              Totale deficit periodo
            </span>
          </div>
          <span className="body-sm" style={{ color: "var(--subtitle-1)", flexShrink: 0 }}>
            <strong>{totalDiff >= 0 ? "+" : "−"}{Math.abs(totalDiff).toLocaleString("it-IT")}</strong> kcal
          </span>
        </div>
      </div>

      {/* Motivational footer */}
      {cardMessage && (
        <div
          style={{
            marginTop:       "var(--spacing-1)",
            textAlign:       "center",
            padding:         "var(--spacing-3) var(--spacing-4)",
            borderRadius:    "var(--rounded-4)",
            backgroundColor: "var(--neutral-bg)",
          }}
        >
          <span className="body-sm" style={{ color: "var(--subtitle-2)", fontStyle: "italic", fontWeight: 600 }}>
            {cardMessage}
          </span>
        </div>
      )}
    </CardShell>
  );
}

// ─── Card Shell ──────────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        boxShadow:       "var(--shadow-sm)",
        borderRadius:    "var(--rounded-6)",
        padding:         "var(--spacing-4)",
        display:         "flex",
        flexDirection:   "column",
        gap:             "var(--spacing-1)",
      }}
    >
      {children}
    </div>
  );
}
