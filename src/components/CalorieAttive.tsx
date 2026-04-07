"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { isMockUser, getMockActive } from "@/lib/mock-progress-data";
import { niceYTicks } from "@/lib/chart-utils";
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

// ─── Custom X-axis tick ──────────────────────────────────────────────────────

function XTick({ x, y, payload, period }: any) {
  const d = parseYMD(payload.value);
  if (period === "settimana") {
    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor="middle" dy={12} fontSize={11} fill="var(--placeholder)">
          {DOW_IT[d.getDay()]}
        </text>
        <text textAnchor="middle" dy={24} fontSize={11} fill="var(--placeholder)">
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

export function CalorieAttive({
  userId,
  startDate,
  endDate,
  period,
}: CalorieAttiveProps) {
  const [rawData, setRawData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    if (isMockUser(userId)) {
      const mock = getMockActive(userId, startDate, endDate);
      setRawData(mock);
      setLoading(false);
      return;
    }

    supabase
      .from("daily_logs")
      .select("date, active_calories")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .then(({ data: rows }) => {
        setRawData(
          (rows ?? []).map((r: any) => ({
            date: r.date,
            activeCal: r.active_calories ?? 0,
          }))
        );
        setLoading(false);
      });
  }, [userId, startDate, endDate]);

  const allDays = useMemo(() => daysInRange(startDate, endDate), [startDate, endDate]);
  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    rawData.forEach((d) => m.set(d.date, d.activeCal));
    return m;
  }, [rawData]);

  if (loading) {
    return <CardShell title="Calorie Attive" emoji="🔥" loading />;
  }

  const loggedDays = rawData.filter((d) => d.activeCal > 0);
  const totalActiveCal = loggedDays.reduce((s, d) => s + d.activeCal, 0);
  const numDays = loggedDays.length || 1;
  const avg = Math.round(totalActiveCal / numDays);

  const chartData = allDays.map((date) => ({
    date,
    value: dataMap.get(date) ?? 0,
  }));

  const values = chartData.map((d) => d.value).filter((v) => v > 0);
  const maxVal = Math.max(...values, 100);
  const { ticks: yTicks, domain: yDomain } = niceYTicks(0, maxVal, 4);

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
      <div style={{ width: "100%", height: period === "settimana" ? 180 : 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tick={(props: any) => <XTick {...props} period={period} />}
              interval={period === "settimana" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
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
              radius={[2, 2, 0, 0]}
              maxBarSize={period === "settimana" ? 28 : 10}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "var(--spacing-3)",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "8rem" }}>
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
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <span className="help-text" style={{ color: "var(--placeholder)" }}>
        {label}
      </span>
    </div>
  );
}
