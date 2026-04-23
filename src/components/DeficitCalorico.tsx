"use client";

import React, { useState } from "react";
import { Utensils, TrendingDown, TrendingUp, MoveRight, Info, X, Zap, Flame } from "lucide-react";
import { isMockUser, getMockCalories } from "@/lib/mock-progress-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface DeficitCaloricoProps {
  userId:        string;
  startDate:     string;
  endDate:       string;
  period:        Period;
  preloadedData?: DayData[];
  userGoal?:     "deficit" | "maintain" | "surplus";
  bmr?:          number;
}

interface DayData {
  date:        string;
  calories:    number;
  target:      number;
  fabbisogno?: number;
}

// ─── Motivational copy ────────────────────────────────────────────────────────

interface MotivationResult {
  title:   string;
  emoji:   string;
  message: string;
}

function resolveMotivation(avgDiff: number, avgRef: number, userGoal: "deficit" | "maintain" | "surplus"): MotivationResult {
  const pct = avgDiff / avgRef;

  if (userGoal === "maintain") {
    if (pct <= -0.50) return { title: "Deficit calorico", emoji: "📋", message: "Deficit alto, controlla di aver loggato tutti i pasti" };
    if (pct <= -0.05) return { title: "Sotto la media",   emoji: "🏃", message: "Stai mangiando un po' meno del necessario" };
    if (pct <   0.05) return { title: "Nella media",      emoji: "🌟", message: "Perfetto! Stai mantenendo il tuo obiettivo" };
    if (pct <   0.50) return { title: "Sopra la media",   emoji: "🏃", message: "Essere consapevole è già un passo, continuiamo" };
    return                   { title: "Surplus calorico", emoji: "🏃", message: "Succede, continua e rientriamo nell'obiettivo" };
  }

  if (userGoal === "surplus") {
    if (pct >= 0.50)  return { title: "Surplus calorico", emoji: "📋", message: "Surplus alto, controlla di aver loggato tutti i pasti" };
    if (pct >= 0.05)  return { title: "Surplus calorico", emoji: "🌟", message: "Ottimo! Stai andando verso il tuo obiettivo" };
    if (pct > -0.05)  return { title: "Nella media",      emoji: "💪", message: "Stabile e costante, continua" };
    if (pct > -0.50)  return { title: "Deficit calorico", emoji: "🏃", message: "Essere consapevole è già un passo, continuiamo" };
    return                   { title: "Deficit calorico", emoji: "🏃", message: "Succede, continua e rientriamo nell'obiettivo" };
  }

  // deficit (default)
  if (pct <= -0.50) return { title: "Deficit calorico", emoji: "📋", message: "Deficit alto, controlla di aver loggato tutti i pasti" };
  if (pct <= -0.05) return { title: "Deficit calorico", emoji: "🌟", message: "Ogni giorno in deficit è un passo verso il tuo obiettivo" };
  if (pct <   0.05) return { title: "Nella media",      emoji: "💪", message: "Stabile e costante, il percorso è questo" };
  if (pct <   0.50) return { title: "Surplus calorico", emoji: "🏃", message: "Essere consapevole è già un passo, continuiamo" };
  return                   { title: "Surplus calorico", emoji: "🏃", message: "Succede, continua e rientriamo nell'obiettivo" };
}

// ─── Info Modal ───────────────────────────────────────────────────────────────

function InfoModal({
  onClose,
  cardTitle,
  avgIntake,
  avgActiveCal,
  bmr,
  avgDiff,
}: {
  onClose:      () => void;
  cardTitle:    string;
  avgIntake:    number;
  avgActiveCal: number;
  bmr:          number;
  avgDiff:      number;
}) {
  const absDiff = Math.abs(avgDiff);

  // Derive modal type from the card title (the single source of truth)
  const modalType: "deficit" | "surplus" | "media" =
    cardTitle === "Surplus calorico" ? "surplus"
    : cardTitle === "Nella media" || cardTitle === "Sotto la media" || cardTitle === "Sopra la media" ? "media"
    : "deficit";

  const headerIcon =
    modalType === "surplus" ? <TrendingUp  size={14} color="var(--invert)" strokeWidth={2} /> :
    modalType === "media"   ? <MoveRight   size={14} color="var(--invert)" strokeWidth={2} /> :
                              <TrendingDown size={14} color="var(--invert)" strokeWidth={2} />;

  const headerTitle =
    modalType === "surplus" ? "Surplus calorico" :
    modalType === "media"   ? "Nella media"      :
                              "Deficit calorico";

  const descriptionText =
    modalType === "surplus" ? "Le calorie che mangi sono più di quelle che consumi."   :
    modalType === "media"   ? "Le calorie che mangi sono molto vicine a quelle che consumi." :
                              "Le calorie che mangi sono meno di quelle che consumi.";

  const summaryLabel =
    modalType === "surplus" ? "SURPLUS"    :
    modalType === "media"   ? "NELLA MEDIA" :
                              "DEFICIT";

  const summarySuffix = avgDiff <= 0 ? "kcal in meno per giorno" : "kcal in più per giorno";

  const summaryIcon =
    modalType === "surplus" ? <TrendingUp  size={14} color="var(--color-ciano-600)" strokeWidth={2} /> :
    modalType === "media"   ? <MoveRight   size={14} color="var(--color-ciano-600)" strokeWidth={2} /> :
                              <TrendingDown size={14} color="var(--color-ciano-600)" strokeWidth={2} />;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          100,
        background:      "rgba(117, 127, 160, 0.20)",
        backdropFilter:  "blur(10px)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        paddingLeft:     "var(--spacing-5)",
        paddingRight:    "var(--spacing-5)",
        paddingBottom:   "var(--spacing-5)",
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:           "100%",
          maxWidth:        "480px",
          backgroundColor: "var(--color-white)",
          borderRadius:    "var(--rounded-6)",
          boxShadow:       "var(--shadow-sm)",
          padding:         "var(--spacing-5)",
          display:         "flex",
          flexDirection:   "column",
          gap:             "var(--spacing-3)",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2-5)" }}>
            {/* Badge icon */}
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
              {headerIcon}
            </div>
            <span className="heading-5" style={{ color: "var(--heading)" }}>{headerTitle}</span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           "2rem",
              height:          "2rem",
              borderRadius:    "var(--rounded-full)",
              backgroundColor: "var(--neutral-tonal)",
              border:          "none",
              cursor:          "pointer",
              flexShrink:      0,
              color:           "var(--neutral-action)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--neutral-tonal-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--neutral-tonal)")}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Description text */}
        <p className="body-md" style={{ color: "var(--body)", margin: 0 }}>
          {descriptionText}
        </p>

        {/* BMR + Attive row */}
        <div style={{ display: "flex", alignItems: "stretch", gap: "var(--spacing-2)" }}>
          {/* BMR card */}
          <MiniCard
            icon={<Zap size={13} color="var(--placeholder)" strokeWidth={2} />}
            iconBg="var(--color-neutral-400-a12)"
            bg="var(--neutral-bg)"
            color="var(--subtitle-1)"
            label="METABOLISMO BASALE (BMR)"
            value={bmr}
            style={{ flex: 1 }}
          />

          {/* Plus sign */}
          <div style={{ display: "flex", alignItems: "center", color: "var(--placeholder)", fontSize: "1rem", fontWeight: 600, paddingBottom: "var(--spacing-3)" }}>+</div>

          {/* Kcal Attive card */}
          <MiniCard
            icon={<Flame size={13} color="var(--color-orange-600)" strokeWidth={2} />}
            iconBg="var(--color-orange-400-a12)"
            bg="var(--color-orange-50)"
            color="var(--color-orange-800)"
            label="MEDIA CALORIE ATTIVE PERIODO"
            value={avgActiveCal}
            style={{ flex: 1 }}
          />
        </div>

        {/* Minus sign */}
        <div style={{ textAlign: "center", color: "var(--placeholder)", fontSize: "1rem", fontWeight: 600, marginTop: "calc(-1 * var(--spacing-1))", marginBottom: "calc(-1 * var(--spacing-1))" }}>−</div>

        {/* Kcal Ingerite card */}
        <MiniCard
          icon={<Utensils size={13} color="var(--color-ciano-600)" strokeWidth={2} />}
          iconBg="var(--color-ciano-400-a12)"
          bg="var(--color-ciano-50)"
          color="var(--color-ciano-800)"
          label="MEDIA CALORIE INGERITE PERIODO"
          value={avgIntake}
          style={{ width: "100%" }}
        />

        {/* Equals sign */}
        <div style={{ textAlign: "center", color: "var(--placeholder)", fontSize: "1rem", fontWeight: 600, marginTop: "calc(-1 * var(--spacing-1))", marginBottom: "calc(-1 * var(--spacing-1))" }}>=</div>

        {/* Summary card */}
        <div
          style={{
            borderRadius:    "var(--rounded-5)",
            padding:         "var(--spacing-3)",
            backgroundColor: "var(--color-ciano-600)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-0-5)" }}>
            <span className="label-sm" style={{ color: "var(--invert)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              {summaryLabel}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-1)" }}>
              <span className="heading-3" style={{ color: "var(--invert)" }}>{absDiff}</span>
              <span className="body-sm" style={{ color: "var(--invert)" }}>{summarySuffix}</span>
            </div>
          </div>
          {/* Badge icon */}
          <div
            style={{
              width:           "2rem",
              height:          "2rem",
              borderRadius:    "var(--rounded-full)",
              backgroundColor: "var(--color-ciano-50)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
            }}
          >
            {summaryIcon}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Card ────────────────────────────────────────────────────────────────

function MiniCard({
  icon,
  iconBg,
  bg,
  color,
  label,
  value,
  valuePrefix = "",
  style,
}: {
  icon:         React.ReactNode;
  iconBg:       string;
  bg:           string;
  color:        string;
  label:        string;
  value:        number;
  valuePrefix?: string;
  style?:       React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius:    "var(--rounded-5)",
        padding:         "var(--spacing-3)",
        backgroundColor: bg,
        display:         "flex",
        flexDirection:   "column",
        gap:             "var(--spacing-1-5)",
        ...style,
      }}
    >
      <div
        style={{
          width:           "1.75rem",
          height:          "1.75rem",
          borderRadius:    "var(--rounded-full)",
          backgroundColor: iconBg,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          flexShrink:      0,
        }}
      >
        {icon}
      </div>
      <span
        className="label-sm"
        style={{ color, textTransform: "uppercase" as const, letterSpacing: "0.04em", lineHeight: 1.2 }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--spacing-1)" }}>
        <span className="heading-6" style={{ color }}>{valuePrefix}{value.toLocaleString("it-IT")}</span>
        <span className="body-sm" style={{ color }}>kcal</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DeficitCalorico({
  userId,
  startDate,
  endDate,
  period,
  preloadedData,
  userGoal = "deficit",
  bmr = 0,
}: DeficitCaloricoProps) {
  const [modalOpen, setModalOpen] = useState(false);

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

  const avgIntake    = Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length);
  const avgRef       = Math.round(logged.reduce((s, d) => s + (d.fabbisogno ?? d.target), 0) / logged.length);
  const avgDiff      = avgIntake - avgRef;
  const totalDiff    = Math.round(logged.reduce((s, d) => s + (d.calories - (d.fabbisogno ?? d.target)), 0));
  const avgActiveCal = Math.round(avgRef - bmr);

  const { title: cardTitle, emoji: cardEmoji, message: cardMessage } = resolveMotivation(avgDiff, avgRef, userGoal);

  const deficitSuffix = avgDiff <= 0 ? "kcal in meno al giorno" : "kcal in più al giorno";

  return (
    <>
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
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: "none",
              border:     "none",
              padding:    0,
              cursor:     "pointer",
              display:    "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Info size={15} style={{ color: "var(--placeholder)" }} strokeWidth={1.5} />
          </button>
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
      

          {/* Row 2 — total diff */}
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
                {totalDiff <= 0
                  ? <TrendingDown size={15} color="var(--invert)" strokeWidth={2} />
                  : <TrendingUp   size={15} color="var(--invert)" strokeWidth={2} />}
              </div>
              <span className="body-sm" style={{ color: "var(--subtitle-2)" }}>
                {totalDiff <= 0 ? "Totale deficit periodo" : "Totale surplus periodo"}
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

      {/* Modal */}
      {modalOpen && (
        <InfoModal
          onClose={() => setModalOpen(false)}
          cardTitle={cardTitle}
          avgIntake={avgIntake}
          avgActiveCal={avgActiveCal}
          bmr={bmr}
          avgDiff={avgDiff}
        />
      )}
    </>
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
