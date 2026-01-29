"use client";

import {
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
} from "recharts";

interface CaloricData {
  dayName?: string;
  dayNumber?: number;
  date?: string;
  consumed: number | null;
  bmr: number;
  target: number;
}

interface CaloricConsumeChartProps {
  data: CaloricData[];
  title?: string;
  subtitle?: string;
  type?: "bar" | "area";
}

export default function CaloricConsumeChart({ 
  data, 
  title = "Caloric consume", 
  subtitle,
  type = "bar"
}: CaloricConsumeChartProps) {
  // Use a default limit of 2000 if data is empty or low
  const validValues = data.flatMap(d => [d.consumed, d.bmr, d.target]).filter((v): v is number => v !== null);
  const maxValue = validValues.length > 0 ? Math.max(...validValues, 2000) : 2000;
  
  // Vertical axis always rounded integers, maintain exactly 5 horizontal lines
  const limit = Math.ceil(maxValue / 500) * 500;
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
              margin={{ top: 10, right: 30, left: -20, bottom: 20 }}
            >
            <defs>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6ACFD5" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6ACFD5" stopOpacity={0}/>
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
              <Bar dataKey="consumed" radius={[4, 4, 0, 0]} barSize={32} fill="#6ACFD5" />
            ) : (
              <Area
                type="monotone"
                dataKey="consumed"
                stroke="#6ACFD5"
                strokeWidth={2}
                fill="url(#areaColor)"
                isAnimationActive={false}
                connectNulls={true}
              />
            )}

              <Line
                type="monotone"
                dataKey="bmr"
                stroke="#757FA0"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={type === "bar" ? { r: 3, fill: "#757FA0", strokeWidth: 0 } : false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />

              <Line
                type="monotone"
                dataKey="target"
                stroke="#FF893F"
                strokeWidth={2}
                dot={type === "bar" ? { r: 3, fill: "#FF893F", strokeWidth: 0 } : false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#6ACFD5]" style={{ opacity: 1, border: type === "area" ? "1px solid #6ACFD5" : "none" }} />
            <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Consumed kcal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="h-[2px] w-6 bg-[#757FA0] border-t border-dashed" style={{ borderTop: "2px dashed #757FA0" }} />
              {type === "bar" && <div className="h-2 w-2 rounded-full bg-[#757FA0] -ml-[5px]" />}
            </div>
            <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>BMR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="h-[2px] w-6 bg-[#FF893F]" />
              {type === "bar" && <div className="h-2 w-2 rounded-full bg-[#FF893F] -ml-[5px]" />}
            </div>
            <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Target</span>
          </div>
        </div>
      </div>
    );
  }

