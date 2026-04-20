"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { isMockUser, getMockWeights, getMockWeightMeta, getMockPreviousWeight } from "@/lib/mock-progress-data";
import { niceYTicks, formatTooltipDate, fmt1 } from "@/lib/chart-utils";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface ObiettivoPesoProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
  /** Pre-fetched data from parent (skips internal fetch when provided) */
  preloadedWeights?: WeightDay[];
  preloadedGoalWeight?: number | null;
  preloadedStartingWeight?: number | null;
  /** Last weight entry strictly before startDate — used to draw a line when period has ≤ 1 entry */
  preloadedPreviousWeight?: WeightDay | null;
}

interface WeightDay {
  date: string;
  weight: number;
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

export function ObiettivoPeso({
  userId,
  startDate,
  endDate,
  period,
  preloadedWeights,
  preloadedGoalWeight,
  preloadedStartingWeight,
  preloadedPreviousWeight,
}: ObiettivoPesoProps) {
  const [rawData, setRawData] = useState<WeightDay[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [previousWeight, setPreviousWeight] = useState<WeightDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // Use pre-fetched data from parent (real API users)
    if (preloadedWeights !== undefined) {
      setRawData(preloadedWeights);
      setGoalWeight(preloadedGoalWeight ?? null);
      setStartingWeight(preloadedStartingWeight ?? null);
      setPreviousWeight(preloadedPreviousWeight ?? null);
      setLoading(false);
      return;
    }

    // Mock demo users
    if (isMockUser(userId)) {
      const mock = getMockWeights(userId, startDate, endDate);
      const meta = getMockWeightMeta(userId);
      setRawData(mock);
      setGoalWeight(meta?.goalWeight ?? null);
      setStartingWeight(meta?.startingWeight ?? null);
      setPreviousWeight(getMockPreviousWeight(userId, startDate));
      setLoading(false);
      return;
    }

    // Supabase fallback
    Promise.all([
      supabase
        .from("weight_logs")
        .select("date, weight")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("weight_logs")
        .select("date, weight")
        .eq("user_id", userId)
        .lt("date", startDate)
        .order("date", { ascending: false })
        .limit(1),
    ]).then(([{ data: rows }, { data: prev }]) => {
      setRawData((rows ?? []).map((r: any) => ({ date: r.date, weight: r.weight ?? 0 })));
      const prevRow = prev?.[0];
      setPreviousWeight(prevRow ? { date: prevRow.date, weight: prevRow.weight ?? 0 } : null);
      setLoading(false);
    });

    supabase
      .from("users")
      .select("goal_weight, starting_weight")
      .eq("telegram_id", userId)
      .single()
      .then(({ data: user }) => {
        if (user) {
          setGoalWeight(user.goal_weight ?? null);
          setStartingWeight(user.starting_weight ?? null);
        }
      });
  }, [userId, startDate, endDate, preloadedWeights, preloadedGoalWeight, preloadedStartingWeight, preloadedPreviousWeight]);

  const allDays = useMemo(() => daysInRange(startDate, endDate), [startDate, endDate]);
  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    rawData.forEach((d) => m.set(d.date, d.weight));
    return m;
  }, [rawData]);

  if (loading) {
    return <CardShell title="Obiettivo di peso" loading />;
  }

  // No data at all — not in period AND no prior weight either
  if (rawData.length === 0 && previousWeight == null) {
    return (
      <CardShell title="Obiettivo di peso">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "6rem" }}>
          <span className="help-text">Nessun dato di peso disponibile</span>
        </div>
      </CardShell>
    );
  }

  // Use the last in-period measurement, or fall back to previousWeight
  const currentWeight =
    rawData.length > 0 ? rawData[rawData.length - 1].weight : previousWeight!.weight;
  const effectiveStart =
    startingWeight ?? (rawData.length > 0 ? rawData[0].weight : previousWeight!.weight);
  const lost = Math.round((effectiveStart - currentWeight) * 100) / 100;
  const goalLabel = goalWeight ? `${goalWeight}kg` : "—";

  // Carry the last known weight forward through endDate — line always reaches the last day.
  // "previousWeight" anchors the line start when the period starts without a measurement.
  let lastKnown: number | null = previousWeight?.weight ?? null;

  const chartData = allDays.map((date) => {
    const w = dataMap.get(date);

    if (w != null) {
      lastKnown = w;
      return { date, weight: w, isAnchor: false, isCarryForward: false };
    }

    if (lastKnown == null) {
      return { date, weight: null, isAnchor: false, isCarryForward: false };
    }

    // Anchor point at startDate (silent — connects the line but hidden in tooltip/dots)
    const isAnchor = previousWeight != null && date === startDate;
    return { date, weight: lastKnown, isAnchor, isCarryForward: !isAnchor };
  });

  const weights = rawData.map((d) => d.weight);
  if (previousWeight) weights.push(previousWeight.weight);
  if (goalWeight) weights.push(goalWeight);
  const { ticks: yTicks, domain: [minW, maxW] } = niceYTicks(
    Math.min(...weights) - 0.5,
    Math.max(...weights) + 0.5,
    4
  );

  const showDots = period === "settimana";

  return (
    <CardShell title={`Obiettivo di peso → ${goalLabel}`}>
      {/* Metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {Math.abs(lost)}
        </span>{" "}
        {lost >= 0 ? "kg persi" : "kg in più"} → da {effectiveStart}kg a {currentWeight}kg attuale
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: period === "settimana" ? 180 : 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              tick={(props: any) => <XTick {...props} period={period} />}
              interval={period === "settimana" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={[minW, maxW]}
              ticks={yTicks}
              interval={0}
              allowDataOverflow
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--placeholder)" }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            {goalWeight && (
              <ReferenceLine
                y={goalWeight}
                stroke="var(--neutral-surface-light)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                if (d.weight == null || d.isAnchor || d.isCarryForward) return null;
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
                    <div>Peso: <strong>{fmt1(d.weight)}kg</strong></div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--primary-action)"
              strokeWidth={2}
              connectNulls
              dot={showDots ? (props: any) => {
                if (props.payload?.isAnchor || props.payload?.isCarryForward) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="var(--primary-action)" stroke="var(--color-white)" strokeWidth={2} />;
              } : false}
              activeDot={(props: any) => {
                if (props.payload?.isAnchor || props.payload?.isCarryForward) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="var(--primary-action)" />;
              }}
            />
          </LineChart>
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
        <LegendItem color="var(--primary-action)" label="Peso kg" type="line" />
        {goalWeight && (
          <LegendItem color="var(--neutral-surface-light)" label="Obiettivo di peso" type="dashed" />
        )}
      </div>
    </CardShell>
  );
}

// ─── Card Shell ──────────────────────────────────────────────────────────────

function CardShell({
  title,
  loading,
  children,
}: {
  title: string;
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="card-main-title">{title}</span>
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>🎯</span>
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

function LegendItem({
  color,
  label,
  type = "line",
}: {
  color: string;
  label: string;
  type?: "line" | "dashed";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}>
      {type === "dashed" ? (
        <svg width={16} height={4} viewBox="0 0 16 4">
          <line x1={0} y1={2} x2={16} y2={2} stroke={color} strokeWidth={2} strokeDasharray="4 2" />
        </svg>
      ) : (
        <svg width={16} height={4} viewBox="0 0 16 4">
          <line x1={0} y1={2} x2={16} y2={2} stroke={color} strokeWidth={2} />
        </svg>
      )}
      <span className="help-text" style={{ color: "var(--placeholder)" }}>
        {label}
      </span>
    </div>
  );
}
