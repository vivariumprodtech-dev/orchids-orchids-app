"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { isMockUser, getMockCalories } from "@/lib/mock-progress-data";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface BilancioCaloricoProp {
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  period: Period;
}

interface DayData {
  date: string;
  calories: number;
  target: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOW_IT = ["D", "L", "M", "M", "G", "V", "S"];

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
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

function formatXLabel(dateStr: string, period: Period): string {
  const d = parseYMD(dateStr);
  if (period === "settimana") {
    return `${DOW_IT[d.getDay()]} ${d.getDate()}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function classifyBar(
  cal: number,
  target: number
): "pocoSopra" | "pocoSotto" | "troppoSopra" | "troppoSotto" | "onTarget" | "empty" {
  if (cal === 0) return "empty";
  if (target === 0) return "onTarget";
  const diff = cal - target;
  const pct = diff / target;
  if (pct > 0.15) return "troppoSopra";
  if (pct > 0) return "pocoSopra";
  if (pct < -0.15) return "troppoSotto";
  if (pct < 0) return "pocoSotto";
  return "onTarget";
}

const BAR_COLORS: Record<string, string> = {
  pocoSopra: "var(--primary-surface)",
  pocoSotto: "var(--color-ciano-200)",
  troppoSopra: "var(--danger-surface)",
  troppoSotto: "var(--color-danger-200)",
  onTarget: "var(--primary-surface)",
  empty: "var(--color-neutral-100, #f0f0f0)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BilancioCalorico({
  userId,
  startDate,
  endDate,
  period,
}: BilancioCaloricoProp) {
  const [rawData, setRawData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    if (isMockUser(userId)) {
      const mock = getMockCalories(userId, startDate, endDate);
      setRawData(mock);
      setLoading(false);
      return;
    }

    supabase
      .from("daily_logs")
      .select("date, calories, target_calories")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .then(({ data: rows }) => {
        setRawData(
          (rows ?? []).map((r: any) => ({
            date: r.date,
            calories: r.calories ?? 0,
            target: r.target_calories ?? 0,
          }))
        );
        setLoading(false);
      });
  }, [userId, startDate, endDate]);

  // Fill all days in range, even those with no data
  const allDays = useMemo(() => daysInRange(startDate, endDate), [startDate, endDate]);
  const dataMap = useMemo(() => {
    const m = new Map<string, DayData>();
    rawData.forEach((d) => m.set(d.date, d));
    return m;
  }, [rawData]);

  if (loading) {
    return <CardShell title="Bilancio calorico" emoji="🍽️" loading />;
  }

  // Get the default target from available data
  const loggedDays = rawData.filter((d) => d.calories > 0);
  const avgTarget =
    loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + d.target, 0) / loggedDays.length)
      : 0;

  const daysNearTarget = loggedDays.filter((d) => {
    if (d.target === 0) return false;
    const pct = Math.abs(d.calories - d.target) / d.target;
    return pct <= 0.15;
  }).length;

  const totalDays = loggedDays.length;

  // Build chart data — all days, calories as positive bars, target as reference line
  const chartData = allDays.map((date) => {
    const d = dataMap.get(date);
    const cal = d?.calories ?? 0;
    const target = d?.target ?? avgTarget;
    return {
      label: formatXLabel(date, period),
      calories: cal,
      target,
      category: classifyBar(cal, target),
    };
  });

  // Y axis domain — based on actual calorie values
  const calValues = chartData.map((d) => d.calories).filter((v) => v > 0);
  const maxCal = Math.max(...calValues, avgTarget + 200, 500);
  const yMax = Math.ceil(maxCal / 500) * 500;

  return (
    <CardShell title="Bilancio calorico" emoji="🍽️">
      {/* Metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {daysNearTarget}
        </span>{" "}
        /{totalDays} giorni vicino al target
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 0, bottom: 0, left: -12 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              interval={period === "settimana" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={[0, yMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            {avgTarget > 0 && (
              <ReferenceLine
                y={avgTarget}
                stroke="var(--primary-action)"
                strokeWidth={2}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                if (d.calories === 0) return null;
                return (
                  <div
                    style={{
                      background: "var(--color-white)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--rounded-3)",
                      padding: "var(--spacing-2) var(--spacing-3)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div>Calorie: <strong>{d.calories}</strong></div>
                    <div>Target: <strong>{d.target}</strong></div>
                  </div>
                );
              }}
            />
            <Bar dataKey="calories" radius={[3, 3, 0, 0]} maxBarSize={period === "settimana" ? 28 : 12}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={BAR_COLORS[entry.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--spacing-3)",
          marginTop: "var(--spacing-1)",
        }}
      >
        <LegendItem color="var(--primary-action)" label="Target al kcal" type="line" />
        <LegendItem color="var(--primary-surface)" label="Poco sopra" />
        <LegendItem color="var(--color-ciano-200)" label="Poco sotto" />
        <LegendItem color="var(--danger-surface)" label="Troppo sopra" />
        <LegendItem color="var(--color-danger-200)" label="Troppo sotto" />
      </div>
    </CardShell>
  );
}

// ─── Shared Card Shell ───────────────────────────────────────────────────────

function CardShell({
  title,
  emoji,
  loading,
  children,
}: {
  title: string;
  emoji: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--rounded-6)",
        padding: "var(--spacing-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="card-main-title">{title}</span>
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{emoji}</span>
      </div>
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "8rem",
          }}
        >
          <span className="help-text">Caricamento…</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({
  color,
  label,
  type = "dot",
}: {
  color: string;
  label: string;
  type?: "dot" | "line";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}>
      {type === "line" ? (
        <div
          style={{
            width: 16,
            height: 2,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      ) : (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      )}
      <span className="help-text" style={{ color: "var(--placeholder)" }}>
        {label}
      </span>
    </div>
  );
}
