"use client";

import {
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
} from "recharts";

interface BalanceData {
  dayName?: string; // "S", "M", etc.
  dayNumber?: number;
  date?: string; // "DD/MM" or YYYY-MM-DD
  diff: number;
  baseline: number;
}

interface BalanceChartProps {
  data: BalanceData[];
  title?: string;
  subtitle?: string;
  type?: "bar" | "area";
}

export default function BalanceChart({ 
  data, 
  title = "Balance", 
  subtitle,
  type = "bar"
}: BalanceChartProps) {
  // Use a default minimum limit of 500 if data is empty or all zero
  const validDiffs = data.map(d => d.diff).filter((v): v is number => v !== null);
  const maxAbsDiff = validDiffs.length > 0 ? Math.max(...validDiffs.map(v => Math.abs(v)), 500) : 500;
  
  // For Month view (area), the vertical baseline values adapt to the values in the graphic
  // Highest and lowest lines represent the limit, maintain always 5 horizontal lines centered at zero
  const limit = Math.round(maxAbsDiff);
  const step = Math.round(limit / 2);
  const ticksY = [-limit, -step, 0, step, limit];
  const domainY = [-limit, limit];

    // For area chart, we need 5 dates on X-axis
    const showXAxisDates = type === "area";
      const xTicks = showXAxisDates 
        ? Array.from({ length: 5 }, (_, i) => {
            const idx = Math.floor(i * (data.length - 1) / 4);
            return data[idx]?.date;
          }).filter((v): v is string => !!v)
        : undefined;

  const gradientOffset = () => {
    const activeDiffs = data.map(d => d.diff).filter((v): v is number => v !== null);
    if (activeDiffs.length === 0) return 0.5;
    
    const dataMax = Math.max(...activeDiffs);
    const dataMin = Math.min(...activeDiffs);

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-title-custom font-bold text-[#262C44]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{title}</h2>
        {subtitle && (
          <p className="text-body-sm-custom mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "#757FA0" }}>{subtitle}</p>
        )}
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#ED5070" stopOpacity={0.4} />
                <stop offset={off} stopColor="#FFE5A3" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#ED5070" stopOpacity={1} />
                <stop offset={off} stopColor="#FFC840" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ECEDF2" />
            <XAxis
              dataKey={type === "area" ? "date" : "dayNumber"}
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              tick={(props) => {
                const { x, y, index, payload } = props;
                if (type === "bar") {
                  const day = data[index];
                  if (!day) return null;
                  return (
                    <g transform={`translate(${x},${y + 15})`}>
                      <text
                        x={0}
                        y={0}
                        dy={0}
                        textAnchor="middle"
                        fill="#757FA0"
                        className="text-[12px] font-medium"
                        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                      >
                        {day.dayName}
                      </text>
                      <text
                        x={0}
                        y={18}
                        dy={0}
                        textAnchor="middle"
                        fill="#757FA0"
                        className="text-[12px] font-medium"
                        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                      >
                        {day.dayNumber}
                      </text>
                    </g>
                  );
                } else {
                  // Area chart date display (5 dates)
                  const dateStr = payload.value;
                  // For the x-axis dates, we need to map the index of ticks to labels
                  // Recharts calls this tick component for each tick in 'ticks' prop
                  const isLast = index === 4;
                  return (
                    <g transform={`translate(${x},${y + 15})`}>
                      <text
                        x={0}
                        y={0}
                        dy={0}
                        textAnchor="middle"
                        fill={isLast ? "#262C44" : "#757FA0"}
                        className={`text-[12px] ${isLast ? "font-bold" : "font-medium"}`}
                        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                      >
                        {dateStr}
                      </text>
                    </g>
                  );
                }
              }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#757FA0", fontSize: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}
              domain={domainY}
              ticks={ticksY}
              allowDataOverflow={true}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            
            {type === "bar" ? (
              <Bar dataKey="diff" radius={[4, 4, 4, 4]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.diff === null ? "transparent" : (entry.diff >= 0 ? "#ED5070" : "#FFE5A3")} 
                  />
                ))}
              </Bar>
            ) : (
              <Area
                type="monotone"
                dataKey="diff"
                stroke="url(#strokeGradient)"
                strokeWidth={2}
                fill="url(#splitColor)"
                isAnimationActive={false}
                connectNulls={false}
              />
            )}

            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="#757FA0"
              strokeWidth={2}
              dot={type === "bar" ? { r: 3, fill: "#757FA0", strokeWidth: 0 } : false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#ED5070]" style={{ opacity: type === "area" ? 0.4 : 1, border: type === "area" ? "1px solid #ED5070" : "none" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Kcal over</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#FFE5A3]" style={{ opacity: type === "area" ? 0.4 : 1, border: type === "area" ? "1px solid #FFE5A3" : "none" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Kcal low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="h-[2px] w-6 bg-[#757FA0]" />
            {type === "bar" && <div className="h-2 w-2 rounded-full bg-[#757FA0] -ml-[5px]" />}
          </div>
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Target kcal</span>
        </div>
      </div>
    </div>
  );
}
