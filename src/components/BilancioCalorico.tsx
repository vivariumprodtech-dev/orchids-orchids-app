"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { isMockUser, getMockCalories } from "@/lib/mock-progress-data";
import { niceSymmetricTicks, formatTooltipDate } from "@/lib/chart-utils";
import { supabase } from "@/lib/supabase";
import { fetchFoodEntries, fetchDailyGoals } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface BilancioCaloricoProp {
  userId: string;
  startDate: string;
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

function classifyBar(
  diff: number,
  target: number
): "pocoSopra" | "pocoSotto" | "troppoSopra" | "troppoSotto" | "onTarget" | "empty" {
  if (target === 0) return "empty";
  const pct = diff / target;
  if (pct > 0.15) return "troppoSopra";
  if (pct > 0.01) return "pocoSopra";
  if (pct < -0.15) return "troppoSotto";
  if (pct < -0.01) return "pocoSotto";
  return "onTarget";
}

const BAR_COLORS: Record<string, string> = {
  pocoSopra: "var(--primary-surface)",
  pocoSotto: "var(--color-ciano-200)",
  troppoSopra: "var(--danger-surface)",
  troppoSotto: "var(--color-danger-200)",
  onTarget: "var(--primary-surface)",
  noLog: "var(--neutral-bg)",
  empty: "transparent",
};

// ─── Custom X-axis tick ──────────────────────────────────────────────────────

function XTick({ x, y, payload, period, todayLabel }: any) {
  const d = parseYMD(payload.value);
  const isBold = payload.value === todayLabel;
  if (period === "settimana") {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          textAnchor="middle"
          dy={12}
          fontSize={11}
          fill="var(--placeholder)"
          fontWeight={isBold ? 700 : 400}
        >
          {DOW_IT[d.getDay()]}
        </text>
        <text
          textAnchor="middle"
          dy={24}
          fontSize={11}
          fill="var(--placeholder)"
          fontWeight={isBold ? 700 : 400}
        >
          {d.getDate()}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" dy={14} fontSize={11} fill="var(--placeholder)">
        {`${d.getDate()}/${d.getMonth() + 1}`}
      </text>
    </g>
  );
}

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

    Promise.all([
      fetchFoodEntries(userId).catch(() => []),
      fetchDailyGoals(userId).catch(() => null),
    ]).then(([foodEntries, dailyGoals]) => {
      // Group food entries by date
      const calByDate = new Map<string, number>();
      for (const entry of foodEntries) {
        const d = entry.date?.slice(0, 10);
        if (!d || d < startDate || d > endDate) continue;
        const cal = entry.totalCalories ?? entry.calories ?? 0;
        calByDate.set(d, (calByDate.get(d) ?? 0) + cal);
      }

      // Build target map from daily goals
      const targetByDate = new Map<string, number>();
      if (Array.isArray(dailyGoals)) {
        for (const g of dailyGoals) {
          const d = g.date?.slice(0, 10);
          if (d) targetByDate.set(d, g.calorieTarget ?? g.calories ?? 0);
        }
      }

      const rows: DayData[] = Array.from(calByDate.entries()).map(([date, calories]) => ({
        date,
        calories,
        target: targetByDate.get(date) ?? 0,
      }));

      setRawData(rows.sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    }).catch(() => {
      // Fallback to Supabase
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
    });
  }, [userId, startDate, endDate]);

  const allDays = useMemo(() => daysInRange(startDate, endDate), [startDate, endDate]);
  const dataMap = useMemo(() => {
    const m = new Map<string, DayData>();
    rawData.forEach((d) => m.set(d.date, d));
    return m;
  }, [rawData]);

  if (loading) {
    return <CardShell title="Bilancio calorico" emoji="🍽️" loading />;
  }

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

  // First date the user ever logged — days before this are "inactive"
  const sortedLogDates = rawData.map((d) => d.date).sort();
  const firstLogDate = sortedLogDates.length > 0 ? sortedLogDates[0] : null;

  // Build chart data: diverging bars (diff from target), 0 = target line
  const chartData = allDays.map((date) => {
    const d = dataMap.get(date);
    const cal = d?.calories ?? 0;
    const target = d?.target ?? avgTarget;
    const hasLog = !!d && cal > 0;
    // Days before the user's first log are inactive (no bar, no line)
    const isInactive = !firstLogDate || date < firstLogDate;

    if (isInactive) {
      return {
        date,
        diff: 0,
        zero: null as number | null, // no target line for inactive days
        calories: 0,
        target: 0,
        category: "empty",
      };
    }

    if (!hasLog) {
      // Active day but no log — full bar from 0 to -target
      return {
        date,
        diff: -target,
        zero: 0 as number | null,
        calories: 0,
        target,
        category: "noLog",
      };
    }

    const diff = cal - target;
    return {
      date,
      diff,
      zero: 0 as number | null, // target line visible for active days
      calories: cal,
      target,
      category: classifyBar(diff, target),
    };
  });

  // Y axis: symmetric around 0 with nice even steps
  const diffs = chartData.map((d) => d.diff).filter((v) => v !== 0);
  const absMax = diffs.length > 0 ? Math.max(...diffs.map(Math.abs)) : 500;
  const { ticks: yTicks, domain: yDomain } = niceSymmetricTicks(absMax, 5);

  const today = toYMD(new Date());

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
      <div style={{ width: "100%", height: period === "settimana" ? 200 : 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 4, bottom: period === "settimana" ? 16 : 4, left: -12 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              vertical={false}
              horizontalValues={yTicks}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={(props: any) => (
                <XTick {...props} period={period} todayLabel={today} />
              )}
              interval={period === "settimana" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              interval={0}
              allowDataOverflow
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
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
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{formatTooltipDate(d.date)}</div>
                    <div>Calorie: <strong>{d.calories}</strong></div>
                    <div>Target: <strong>{d.target}</strong></div>
                    <div>Diff: <strong>{d.diff > 0 ? "+" : ""}{d.diff}</strong></div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="diff"
              radius={0}
              maxBarSize={period === "settimana" ? 28 : 10}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={BAR_COLORS[entry.category]} />
              ))}
            </Bar>
            {/* Target line with dots at y=0 */}
            <Line
              type="monotone"
              dataKey="zero"
              stroke="var(--primary-action)"
              strokeWidth={2}
              dot={period === "settimana" ? { r: 3, fill: "var(--primary-action)", stroke: "var(--color-white)", strokeWidth: 1.5 } : false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "var(--spacing-2) var(--spacing-3)",
        }}
      >
        <LegendItem color="var(--primary-action)" label="Target in kcal" type="line-dot" />
        <LegendItem color="var(--color-ciano-200)" label="Poco sotto" />
        <LegendItem color="var(--primary-surface)" label="Poco sopra" />
        <LegendItem color="var(--color-danger-200)" label="Troppo sotto" />
        <LegendItem color="var(--danger-surface)" label="Troppo sopra" />
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
  type = "square",
}: {
  color: string;
  label: string;
  type?: "square" | "line-dot";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}>
      {type === "line-dot" ? (
        <svg width={20} height={10} viewBox="0 0 20 10">
          <line x1={0} y1={5} x2={20} y2={5} stroke={color} strokeWidth={2} />
          <circle cx={10} cy={5} r={3} fill={color} />
        </svg>
      ) : (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
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
