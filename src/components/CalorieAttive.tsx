"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface CalorieAttiveProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
}

interface DayData {
  date: string;
  activeCal: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOW_IT = ["D", "L", "M", "M", "G", "V", "S"];

const PERIOD_LABEL: Record<Period, string> = {
  settimana: "media settimana",
  "1mese": "media mese",
  "2mesi": "media 2 mesi",
  "3mesi": "media 3 mesi",
};

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

// ─── Component ────────────────────────────────────────────────────────────────

export function CalorieAttive({
  userId,
  startDate,
  endDate,
  period,
}: CalorieAttiveProps) {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("daily_logs")
      .select("date, active_calories")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .then(({ data: rows }) => {
        setData(
          (rows ?? []).map((r: any) => ({
            date: r.date,
            activeCal: r.active_calories ?? 0,
          }))
        );
        setLoading(false);
      });
  }, [userId, startDate, endDate]);

  if (loading) {
    return <CardShell title="Calorie Attive" emoji="🔥" loading />;
  }

  const totalActiveCal = data.reduce((s, d) => s + d.activeCal, 0);
  const numDays = data.length || 1;
  const avg = Math.round(totalActiveCal / numDays);

  const chartData = data.map((d) => ({
    label: formatXLabel(d.date, period),
    value: d.activeCal,
    date: d.date,
  }));

  // Y axis: compute nice ticks
  const values = chartData.map((d) => d.value);
  const maxVal = Math.max(...values, 100);

  return (
    <CardShell title="Calorie Attive" emoji="🔥">
      {/* Metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {avg}
        </span>{" "}
        kcal giorno ({PERIOD_LABEL[period]})
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
              domain={[0, Math.ceil(maxVal * 1.1)]}
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
                    <div>Kcal attive: <strong>{d.value}</strong></div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--nutrient-attive-surface)"
              radius={[3, 3, 0, 0]}
              maxBarSize={period === "settimana" ? 28 : 12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-3)",
          marginTop: "var(--spacing-1)",
        }}
      >
        <LegendItem color="var(--nutrient-attive-surface)" label="kcal attive" />
      </div>
    </CardShell>
  );
}

// ─── Card Shell ──────────────────────────────────────────────────────────────

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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span className="help-text" style={{ color: "var(--placeholder)" }}>
        {label}
      </span>
    </div>
  );
}
