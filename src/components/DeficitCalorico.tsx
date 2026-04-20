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
}

// ─── Motivational copy ────────────────────────────────────────────────────────

function resolveMotivation(avgDeficit: number): string | null {
  if (!isFinite(avgDeficit)) return null;
  if (avgDeficit > 200) return "Ottimo! Stai costruendo il tuo risultato!";
  if (avgDeficit > 50)  return "Buon lavoro, sei in deficit calorico";
  if (avgDeficit >= -50) return "Sei in equilibrio calorico";
  if (avgDeficit >= -200) return "Leggero surplus, monitora l'andamento";
  return "Surplus elevato, cerca di ridurre un po'";
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

  const logged = data.filter((d) => d.calories > 0 && d.target > 0);

  if (logged.length === 0) {
    return (
      <CardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "5rem" }}>
          <span className="help-text">Nessun dato disponibile</span>
        </div>
      </CardShell>
    );
  }

  const avgIntake   = Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length);
  const avgTarget   = Math.round(logged.reduce((s, d) => s + d.target,   0) / logged.length);
  const avgDeficit  = avgTarget - avgIntake;
  const totalDeficit = logged.reduce((s, d) => s + (d.target - d.calories), 0);

  const motivation = resolveMotivation(avgDeficit);

  const deficitSuffix =
    avgDeficit >= 0 ? "kcal in meno al giorno" : "kcal in più al giorno";

  return (
    <CardShell>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span className="card-main-title">Deficit calorico</span>
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>⭐</span>
      </div>

      {/* Primary metric */}
      <div
        className="card-text"
        style={{ color: "var(--subtitle-1)", display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}
      >
        <span className="card-number-md" style={{ display: "inline" }}>
          {Math.abs(avgDeficit)}
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
            <strong>{totalDeficit >= 0 ? "−" : "+"}{Math.round(Math.abs(totalDeficit)).toLocaleString("it-IT")}</strong> kcal
          </span>
        </div>
      </div>

      {/* Motivational footer */}
      {motivation && (
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
            {motivation}
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
