"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { isMockUser, getMockGirovita, getMockPreviousGirovita } from "@/lib/mock-progress-data";
import { niceYTicks, formatTooltipDate, fmt1 } from "@/lib/chart-utils";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

interface GirovitaProps {
  userId: string;
  startDate: string;
  endDate: string;
  period: Period;
  preloadedData?: GirovitaDay[];
  preloadedFirstEver?: GirovitaDay | null;
  preloadedPreviousEntry?: GirovitaDay | null;
}

interface GirovitaDay {
  date: string;
  cm: number;
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

export function Girovita({
  userId,
  startDate,
  endDate,
  period,
  preloadedData,
  preloadedFirstEver,
  preloadedPreviousEntry,
}: GirovitaProps) {
  const [rawData, setRawData] = useState<GirovitaDay[]>([]);
  const [firstEver, setFirstEver] = useState<GirovitaDay | null>(null);
  const [previousEntry, setPreviousEntry] = useState<GirovitaDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    if (preloadedData !== undefined) {
      setRawData(preloadedData);
      setFirstEver(preloadedFirstEver ?? null);
      setPreviousEntry(preloadedPreviousEntry ?? null);
      setLoading(false);
      return;
    }

    if (isMockUser(userId)) {
      setRawData(getMockGirovita(userId, startDate, endDate));
      setFirstEver(getMockPreviousGirovita(userId, null)); // null = get absolute first
      setPreviousEntry(getMockPreviousGirovita(userId, startDate));
      setLoading(false);
      return;
    }

    // Supabase fallback
    Promise.all([
      supabase
        .from("health_logs")
        .select("date, value")
        .eq("user_id", userId)
        .eq("type", "girovita")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("health_logs")
        .select("date, value")
        .eq("user_id", userId)
        .eq("type", "girovita")
        .order("date", { ascending: true })
        .limit(1),
      supabase
        .from("health_logs")
        .select("date, value")
        .eq("user_id", userId)
        .eq("type", "girovita")
        .lt("date", startDate)
        .order("date", { ascending: false })
        .limit(1),
    ]).then(([{ data: rows }, { data: first }, { data: prev }]) => {
      setRawData((rows ?? []).map((r: any) => ({ date: r.date, cm: r.value ?? 0 })));
      const f = first?.[0];
      setFirstEver(f ? { date: f.date, cm: f.value ?? 0 } : null);
      const p = prev?.[0];
      setPreviousEntry(p ? { date: p.date, cm: p.value ?? 0 } : null);
      setLoading(false);
    });
  }, [userId, startDate, endDate, preloadedData, preloadedFirstEver, preloadedPreviousEntry]);

  const allDays = useMemo(() => daysInRange(startDate, endDate), [startDate, endDate]);
  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    rawData.forEach((d) => m.set(d.date, d.cm));
    return m;
  }, [rawData]);

  if (loading) {
    return <CardShell title="Girovita" loading />;
  }

  // No girovita data at all — hide the card entirely
  if (rawData.length === 0 && firstEver == null && previousEntry == null) {
    return null;
  }

  // Carry the last known value forward to endDate; anchor with previousEntry at startDate
  let lastKnown: number | null = previousEntry?.cm ?? null;

  const chartData = allDays.map((date) => {
    const v = dataMap.get(date);
    if (v != null) {
      lastKnown = v;
      return { date, cm: v, isAnchor: false, isCarryForward: false };
    }
    if (lastKnown == null) {
      return { date, cm: null, isAnchor: false, isCarryForward: false };
    }
    const isAnchor = previousEntry != null && date === startDate;
    return { date, cm: lastKnown, isAnchor, isCarryForward: !isAnchor };
  });

  // Metric: diff vs first-ever measurement
  const currentCm = rawData.length > 0
    ? rawData[rawData.length - 1].cm
    : previousEntry?.cm ?? firstEver?.cm ?? 0;
  const initialCm = firstEver?.cm ?? (rawData.length > 0 ? rawData[0].cm : currentCm);
  const diff = Math.round((currentCm - initialCm) * 10) / 10;
  const absDiff = Math.abs(diff);

  let metricText: string;
  if (diff > 0) {
    metricText = `cm in più → da ${fmt1(initialCm)}cm a ${fmt1(currentCm)}cm attuale`;
  } else if (diff < 0) {
    const word = absDiff === 1 ? "cm perso" : "cm persi";
    metricText = `${word} → da ${fmt1(initialCm)}cm a ${fmt1(currentCm)}cm attuale`;
  } else {
    metricText = `cm persi → ${fmt1(currentCm)}cm attuale`;
  }

  const allValues = chartData.map((d) => d.cm).filter((v): v is number => v != null);
  const maxVal = Math.max(...allValues, currentCm);
  const minVal = Math.min(...allValues, currentCm);
  const { ticks: yTicks, domain: [minW, maxW] } = niceYTicks(minVal - 0.5, maxVal + 0.5, 4);

  const showDots = period === "settimana";

  return (
    <CardShell title="Girovita">
      {/* Metric */}
      <div className="card-text" style={{ color: "var(--subtitle-1)" }}>
        <span className="card-number-md" style={{ display: "inline" }}>
          {fmt1(absDiff)}
        </span>{" "}
        {metricText}
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
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                if (d.cm == null || d.isAnchor || d.isCarryForward) return null;
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
                    <div>Girovita: <strong>{fmt1(d.cm)}cm</strong></div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="cm"
              stroke="var(--color-blue-400)"
              strokeWidth={2}
              connectNulls
              dot={showDots ? (props: any) => {
                if (props.payload?.isAnchor || props.payload?.isCarryForward) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={4} fill="var(--color-blue-400)" stroke="var(--color-white)" strokeWidth={2} />;
              } : false}
              activeDot={(props: any) => {
                if (props.payload?.isAnchor || props.payload?.isCarryForward) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill="var(--color-blue-400)" />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <LegendItem color="var(--color-blue-400)" label="Girovita in cm" />
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
        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>📏</span>
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
      <svg width={16} height={4} viewBox="0 0 16 4">
        <line x1={0} y1={2} x2={16} y2={2} stroke={color} strokeWidth={2} />
        <circle cx={8} cy={2} r={2.5} fill={color} stroke="var(--color-white)" strokeWidth={1} />
      </svg>
      <span className="help-text" style={{ color: "var(--placeholder)" }}>
        {label}
      </span>
    </div>
  );
}
