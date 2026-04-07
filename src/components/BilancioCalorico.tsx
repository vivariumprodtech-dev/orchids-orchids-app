"use client";

import React, { useEffect, useState } from "react";
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
): "pocoSopra" | "pocoSotto" | "troppoSopra" | "troppoSotto" | "onTarget" {
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
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BilancioCalorico({
  userId,
  startDate,
  endDate,
  period,
}: BilancioCaloricoProp) {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("daily_logs")
      .select("date, calories, target_calories")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .then(({ data: rows }) => {
        setData(
          (rows ?? []).map((r: any) => ({
            date: r.date,
            calories: r.calories ?? 0,
            target: r.target_calories ?? 0,
          }))
        );
        setLoading(false);
      });
  }, [userId, startDate, endDate]);

  if (loading) {
    return <CardShell title="Bilancio calorico" emoji="🍽️" loading />;
  }

  const avgTarget =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.target, 0) / data.length)
      : 0;

  const daysNearTarget = data.filter((d) => {
    if (d.target === 0) return false;
    const pct = Math.abs(d.calories - d.target) / d.target;
    return pct <= 0.15;
  }).length;

  const totalDays = data.length;

  // Build chart data with relative values (difference from target)
  const chartData = data.map((d) => ({
    label: formatXLabel(d.date, period),
    value: d.calories - d.target,
    calories: d.calories,
    target: d.target,
    category: classifyBar(d.calories, d.target),
  }));

  // Compute Y axis domain
  const values = chartData.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 100);
  const yDomain = [-Math.ceil(absMax / 100) * 100, Math.ceil(absMax / 100) * 100];

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
            margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              interval={period === "settimana" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            <ReferenceLine y={0} stroke="var(--primary-action)" strokeWidth={2} />
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
                    <div>Diff: <strong>{d.value > 0 ? "+" : ""}{d.value}</strong></div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 3, 3]} maxBarSize={period === "settimana" ? 28 : 12}>
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
        <LegendItem color="var(--primary-action)" label="Target" type="line" />
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
