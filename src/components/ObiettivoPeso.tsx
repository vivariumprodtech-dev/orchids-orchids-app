"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface ObiettivoPesoProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
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

function formatXLabel(dateStr: string, period: Period): string {
  const d = parseYMD(dateStr);
  if (period === "settimana") {
    return `${DOW_IT[d.getDay()]} ${d.getDate()}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ObiettivoPeso({
  userId,
  startDate,
  endDate,
  period,
}: ObiettivoPesoProps) {
  const [data, setData] = useState<WeightDay[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // Try to fetch weight logs
    supabase
      .from("weight_logs")
      .select("date, weight")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error || !rows || rows.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        setData(
          rows.map((r: any) => ({
            date: r.date,
            weight: r.weight ?? 0,
          }))
        );
        setLoading(false);
      });

    // Fetch user goal weight
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
  }, [userId, startDate, endDate]);

  if (loading) {
    return <CardShell title="Obiettivo di peso" loading />;
  }

  if (data.length === 0) {
    return (
      <CardShell title="Obiettivo di peso">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "6rem",
          }}
        >
          <span className="help-text">Nessun dato di peso disponibile</span>
        </div>
      </CardShell>
    );
  }

  const currentWeight = data[data.length - 1].weight;
  const effectiveStart = startingWeight ?? data[0].weight;
  const lost = Math.round((effectiveStart - currentWeight) * 10) / 10;
  const goalLabel = goalWeight ? `${goalWeight}kg` : "—";

  const chartData = data.map((d) => ({
    label: formatXLabel(d.date, period),
    weight: d.weight,
    date: d.date,
  }));

  // Y axis domain
  const weights = chartData.map((d) => d.weight);
  if (goalWeight) weights.push(goalWeight);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);

  const showDots = period === "settimana";

  return (
    <CardShell
      title={`Obiettivo di peso → ${goalLabel}`}
    >
      {/* Metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {lost}
        </span>{" "}
        kg persi → da {effectiveStart}kg a {currentWeight}kg attuale
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              domain={[minW, maxW]}
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
                    <div>Peso: <strong>{d.weight}kg</strong></div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--primary-action)"
              strokeWidth={2}
              dot={showDots ? { r: 4, fill: "var(--primary-action)", stroke: "var(--color-white)", strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: "var(--primary-action)" }}
            />
          </LineChart>
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
        <LegendItem color="var(--primary-action)" label="Peso kg" type="line" />
        {goalWeight && (
          <LegendItem
            color="var(--neutral-surface-light)"
            label="Obiettivo di peso"
            type="dashed"
          />
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
      <span className="card-main-title">{title}</span>
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
  type?: "dot" | "line" | "dashed";
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1-5)" }}>
      {type === "dashed" ? (
        <div
          style={{
            width: 16,
            height: 0,
            borderTop: `2px dashed ${color}`,
          }}
        />
      ) : type === "line" ? (
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
