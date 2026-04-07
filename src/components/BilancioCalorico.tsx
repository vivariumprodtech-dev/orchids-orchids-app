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
import { supabase } from "@/lib/supabase";

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

  // Build chart data: diverging bars (diff from target), 0 = target line
  const chartData = allDays.map((date) => {
    const d = dataMap.get(date);
    const cal = d?.calories ?? 0;
    const target = d?.target ?? avgTarget;
    const diff = cal > 0 ? cal - target : 0;
    return {
      date,
      diff,
      zero: 0, // for the target line with dots
      calories: cal,
      target,
      category: cal > 0 ? classifyBar(diff, target) : "empty",
    };
  });

  // Y axis: symmetric around 0
  const diffs = chartData.map((d) => d.diff).filter((v) => v !== 0);
  const absMax = diffs.length > 0 ? Math.max(...diffs.map(Math.abs)) : 500;
  const yBound = Math.ceil(absMax / 250) * 250;
  const yDomain = [-yBound, yBound];

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
            margin={{ top: 4, right: 4, bottom: period === "settimana" ? 16 : 4, left: -12 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              vertical={false}
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
                    <div>Calorie: <strong>{d.calories}</strong></div>
                    <div>Target: <strong>{d.target}</strong></div>
                    <div>Diff: <strong>{d.diff > 0 ? "+" : ""}{d.diff}</strong></div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="diff"
              radius={[2, 2, 2, 2]}
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
