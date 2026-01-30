"use client";

import {
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Area,
  Tooltip,
} from "recharts";

interface ActiveKcalData {
  dayName?: string;
  dayNumber?: number;
  date?: string;
  activeCalories: number | null;
}

interface ActiveKcalChartProps {
  data: ActiveKcalData[];
  title?: string;
  subtitle?: string;
  type?: "bar" | "area";
}

export default function ActiveKcalChart({ 
  data, 
  title = "Active kcal", 
  subtitle,
  type = "bar"
}: ActiveKcalChartProps) {
  // Use a default limit of 400 if data is empty or low
  const validValues = data.map(d => d.activeCalories).filter((v): v is number => v !== null);
  const maxValue = validValues.length > 0 ? Math.max(...validValues, 400) : 400;
  
  // Vertical axis always rounded integers, maintain exactly 5 horizontal lines
  const limit = Math.ceil(maxValue / 100) * 100;
  const step = limit / 4;
  const ticksY = [0, step, step * 2, step * 3, step * 4];
  const domainY = [0, limit];

  // For area chart, we need 5 dates on X-axis
  const showXAxisDates = type === "area";
  const xTicks = showXAxisDates 
    ? Array.from({ length: 5 }, (_, i) => {
        const idx = Math.floor(i * (data.length - 1) / 4);
        return data[idx]?.date;
      }).filter((v): v is string => !!v)
    : undefined;

  return (
    <div className="rounded-2xl bg-white pl-4 py-4 pr-2 shadow-sm">
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
              <linearGradient id="activeAreaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9F43" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#FF9F43" stopOpacity={0.1}/>
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
                  const isToday = index === data.length - 1;
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
                        fill={isToday ? "#262C44" : "#757FA0"}
                        className={`text-[12px] ${isToday ? "font-bold" : "font-medium"}`}
                        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                      >
                        {day.dayNumber}
                      </text>
                    </g>
                  );
                } else {
                  const dateStr = payload.value;
                  const isLast = index === 4;
                  return (
                    <g transform={`translate(${x},${y + 15})`}>
                      <text
                        x={0}
                        y={0}
                        dy={0}
                        textAnchor={isLast ? "end" : "middle"}
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
              <Bar dataKey="activeCalories" radius={[4, 4, 0, 0]} barSize={32} fill="#FF9F43" />
            ) : (
              <Area
                type="monotone"
                dataKey="activeCalories"
                stroke="#FF9F43"
                strokeWidth={2}
                fill="url(#activeAreaColor)"
                isAnimationActive={false}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#FF9F43]" style={{ opacity: 1, border: type === "area" ? "1px solid #FF9F43" : "none" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Active kcal</span>
        </div>
      </div>
    </div>
  );
}
