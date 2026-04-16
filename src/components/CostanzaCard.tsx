"use client";

import React from "react";
import { MessageCircle, Utensils, Check } from "lucide-react";
import { Badge } from "./Badge";
import { BadgeDot } from "./BadgeDot";
import { Button } from "./Button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CostanzaPeriod = "settimana" | "1mese" | "2mesi" | "3mesi";

export interface CostanzaCardProps {
  /** ISO date strings (YYYY-MM-DD) of days the user logged — for badge/dot display */
  loggedDates: string[];
  /** All logged dates across full history — used for streak calculation only */
  streakLoggedDates?: string[];
  /** ISO date string of the first day to display (inclusive) */
  startDate: string;
  /** ISO date string of the last day to display (inclusive) */
  endDate: string;
  period: CostanzaPeriod;
  /** True when this is the most recent period (motivational rules apply for week view) */
  isCurrentPeriod?: boolean;
  /** Whether this user is in their first week of usage */
  isNewUser?: boolean;
  /** Called when the CTA button is tapped */
  onOpenChat?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInRange(start: string, end: string): string[] {
  const result: string[] = [];
  const cur = parseYMD(start);
  const last = parseYMD(end);
  while (cur <= last) {
    result.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function computeCurrentStreak(loggedSet: Set<string>, today: string): number {
  let streak = 0;
  const cur = parseYMD(today);
  while (true) {
    if (!loggedSet.has(toYMD(cur))) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function longestConsecutiveStreak(sorted: string[]): number {
  if (sorted.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseYMD(sorted[i - 1]);
    prev.setDate(prev.getDate() + 1);
    if (toYMD(prev) === sorted[i]) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function areConsecutive(days: string[]): boolean {
  if (days.length <= 1) return true;
  const sorted = [...days].sort();
  return longestConsecutiveStreak(sorted) === sorted.length;
}

// ─── Day-of-week abbreviations ────────────────────────────────────────────────

const DOW_IT = ["D", "L", "M", "M", "G", "V", "S"]; // Sun=0 … Sat=6

// ─── Week Rule Engine ─────────────────────────────────────────────────────────

interface WeekState {
  title: string;
  emoji: string;
  metric: string;
  buttonAlways: boolean;
  noButton?: boolean;
}

function resolveWeekState(
  loggedSet: Set<string>,
  weekDays: string[],
  today: string,
  isNewUser: boolean,
  streakFromEnd: number
): WeekState {
  const logsThisWeek = weekDays.filter((d) => loggedSet.has(d)).length;
  const missingThisWeek = weekDays.filter((d) => !loggedSet.has(d)).length;
  const consecutiveDays = computeCurrentStreak(loggedSet, today);
  const loggedDaysThisWeek = weekDays.filter((d) => loggedSet.has(d));
  const missingDays = weekDays.filter((d) => !loggedSet.has(d));

  // Rule 1 — Long streak (8+ days): no button ever
  if (consecutiveDays >= 8) {
    return {
      title: "Sei inarrestabile",
      emoji: "💎",
      metric: `${streakFromEnd} giorni di log in sequenza`,
      buttonAlways: false,
      noButton: true,
    };
  }

  // Rule 2 — Onboarding
  if (consecutiveDays >= 3 && isNewUser) {
    return {
      title: "Ottimo inizio, continua così",
      emoji: "🌱",
      metric: `${streakFromEnd} giorni di log in sequenza`,
      buttonAlways: false,
    };
  }

  // Rule 3 — Perfect streak (exactly 7 days)
  if (consecutiveDays === 7) {
    return {
      title: "Costanza perfetta",
      emoji: "⚡",
      metric: `${streakFromEnd} giorni di log in sequenza`,
      buttonAlways: false,
    };
  }

  // Rule 4 — No logs this week
  if (logsThisWeek === 0) {
    return {
      title: "Inizia oggi",
      emoji: "👋",
      metric: "0 log questa settimana",
      buttonAlways: true,
    };
  }

  // Rule 5 — Only today missing
  if (missingThisWeek >= 3 && missingDays[0] === today) {
    return {
      title: "Ricomincia, ci siamo",
      emoji: "🤝",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: true,
    };
  }

  // Rule 6 — 2 days missing
  if (missingThisWeek === 2) {
    return {
      title: "Quasi una settimana perfetta",
      emoji: "🤝",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: false,
    };
  }

  // Rule 7 — Return after break, 1 day
  if (logsThisWeek === 1 && !isNewUser) {
    return {
      title: "Bentornato!",
      emoji: "🤝",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: false,
    };
  }

  // Rule 8 — Return after break, 2 days, not consecutive
  if (logsThisWeek === 2 && !isNewUser && !areConsecutive(loggedDaysThisWeek)) {
    return {
      title: "Stai riprendendo",
      emoji: "🤝",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: false,
    };
  }

  // Rule 9 — Return after break, 3+ days, not consecutive
  if (logsThisWeek >= 3 && !isNewUser && !areConsecutive(loggedDaysThisWeek)) {
    return {
      title: "Buona ripresa, continua",
      emoji: "🌱",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: false,
    };
  }

  // Rule 10 — 3+ days missing
  if (missingThisWeek >= 3) {
    return {
      title: "Ricomincia, ci siamo",
      emoji: "🤝",
      metric: `${logsThisWeek} giorni di log nella settimana`,
      buttonAlways: false,
    };
  }

  // Generic fallback
  return {
    title: "Continua così",
    emoji: "🌱",
    metric: `${logsThisWeek} giorni di log nella settimana`,
    buttonAlways: false,
  };
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  loggedSet,
  streakSet,
  weekDays,
  today,
  isCurrentPeriod,
  isNewUser,
  onOpenChat,
}: {
  loggedSet: Set<string>;
  streakSet: Set<string>;
  weekDays: string[];
  today: string;
  isCurrentPeriod: boolean;
  isNewUser: boolean;
  onOpenChat?: () => void;
}) {
  const todayLogged = loggedSet.has(today);

  // Streak ending at the last displayed day (using full history)
  const lastDay = weekDays[weekDays.length - 1];
  const streakFromEnd = computeCurrentStreak(streakSet, lastDay);

  // Motivational rules only for the current (most recent) week
  const isPast = !isCurrentPeriod;
  const state = isPast ? null : resolveWeekState(streakSet, weekDays, today, isNewUser, streakFromEnd);

  const showButton = isCurrentPeriod && !todayLogged && !state?.noButton;

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--rounded-6)",
        padding: "var(--spacing-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
        {isPast ? (
          <>
            <span className="card-main-title">Costanza</span>
            <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
              <span className="card-number-md" style={{ display: "inline" }}>{streakFromEnd}</span>
              {" "}giorni di log in sequenza
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="card-main-title">{state!.title}</span>
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{state!.emoji}</span>
            </div>
            <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
              <span className="card-number-md" style={{ display: "inline" }}>
                {state!.metric.match(/^\d+/)?.[0]}
              </span>{" "}
              {state!.metric.replace(/^\d+\s*/, "")}
            </div>
          </>
        )}
      </div>

      {/* 7 badges */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-1)",
          alignItems: "flex-end",
        }}
      >
        {weekDays.map((day) => {
          const isLogged = loggedSet.has(day);
          const dow = parseYMD(day).getDay();
          const label = DOW_IT[dow];

          const variant: "neutral-tonal-disabled" | "primary" = isLogged ? "primary" : "neutral-tonal-disabled";
          const Icon = isLogged ? Check : Utensils;

          return (
            <div
              key={day}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--spacing-1-5)",
              }}
            >
              <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <Badge
                  iconOnly={Icon}
                  size="md"
                  variant={variant}
                  style={{ width: "100%", maxWidth: "2.5rem", aspectRatio: "1" }}
                />
              </div>
              <span
                className="label-sm"
                style={{
                  color: "var(--neutral-surface-light)",
                  fontSize: "0.75rem",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {showButton && (
        <Button
          variant="primary-outlined"
          size="sm"
          fullWidth
          iconStart={MessageCircle}
          onClick={onOpenChat}
        >
          Scrivimi i tuoi pasti di oggi
        </Button>
      )}
    </div>
  );
}

// ─── Month / Multi-Month View ─────────────────────────────────────────────────

function MonthView({
  loggedSet,
  streakSet,
  allDays,
  today,
  period,
  onOpenChat,
}: {
  loggedSet: Set<string>;
  streakSet: Set<string>;
  allDays: string[];
  today: string;
  period: CostanzaPeriod;
  onOpenChat?: () => void;
}) {
  const todayLogged = loggedSet.has(today);
  const dotSize = period === "1mese" ? "lg" : "sm";

  // Streak ending at the last day of this period (using full history)
  const lastDayInPeriod = [...allDays].reverse().find((d) => d <= today) ?? allDays[allDays.length - 1];
  const streak = computeCurrentStreak(streakSet, lastDayInPeriod);

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--rounded-6)",
        padding: "var(--spacing-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
        <span className="card-main-title">Costanza</span>
        <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
          <span className="card-number-md" style={{ display: "inline" }}>{streak}</span>
          {" "}giorni di log in sequenza
        </div>
      </div>

      {/* Dots — inline flow wrapping with "oggi" label inline */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: dotSize === "lg" ? "var(--spacing-1-5)" : "var(--spacing-1)",
          alignItems: "center",
          rowGap: dotSize === "lg" ? "var(--spacing-2)" : "var(--spacing-1-5)",
        }}
      >
        {allDays.map((day) => {
          const isLogged = loggedSet.has(day);
          const variant: "neutral-tonal-disabled" | "primary" = isLogged ? "primary" : "neutral-tonal-disabled";

          return <BadgeDot key={day} size={dotSize} variant={variant} />;
        })}
      </div>

      {/* CTA — only if today is in range and not logged */}
      {allDays.includes(today) && !todayLogged && (
        <Button
          variant="primary-outlined"
          size="sm"
          fullWidth
          iconStart={MessageCircle}
          onClick={onOpenChat}
        >
          Scrivimi i tuoi pasti di oggi
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CostanzaCard({
  loggedDates,
  startDate,
  endDate,
  period,
  isCurrentPeriod = false,
  isNewUser = false,
  onOpenChat,
  streakLoggedDates,
}: CostanzaCardProps) {
  const loggedSet = new Set(loggedDates);
  const streakSet = streakLoggedDates ? new Set(streakLoggedDates) : loggedSet;
  const today = toYMD(new Date());

  if (period === "settimana") {
    const allDays = daysInRange(startDate, endDate);
    const weekDays = allDays.slice(-7);
    return (
      <WeekView
        loggedSet={loggedSet}
        streakSet={streakSet}
        weekDays={weekDays}
        today={today}
        isCurrentPeriod={isCurrentPeriod}
        isNewUser={isNewUser}
        onOpenChat={onOpenChat}
      />
    );
  }

  const allDays = daysInRange(startDate, endDate);
  return (
    <MonthView
      loggedSet={loggedSet}
      streakSet={streakSet}
      allDays={allDays}
      today={today}
      period={period}
      onOpenChat={onOpenChat}
    />
  );
}
