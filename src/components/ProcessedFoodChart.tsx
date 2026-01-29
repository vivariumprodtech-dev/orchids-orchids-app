"use client";

import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Area, ResponsiveContainer, ComposedChart, Line } from "recharts";

interface ProcessedFoodChartProps {
  data: Array<{
    dayName?: string;
    dayNumber: number;
    date: string;
    processedPercentage: number;
    [key: string]: any;
  }>;
  title: string;
  type?: "bar" | "area";
  subtitle?: string;
}

export default function ProcessedFoodChart({ data, title, type = "bar", subtitle }: ProcessedFoodChartProps) {
  // Goal is always 50%
  const chartData = data.map(d => ({
    ...d,
    goal: 50
  }));

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-2 shadow-sm">
          <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">{label}</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#DB74ED" }} />
                <span className="text-xs text-gray-600">Processed food</span>
              </div>
              <span className="text-xs font-bold text-gray-900">{Math.round(payload[0].value)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const showXAxisDates = type === "area";
  const xTicks = showXAxisDates 
    ? Array.from({ length: 5 }, (_, i) => {
        const idx = Math.floor(i * (chartData.length - 1) / 4);
        return chartData[idx]?.date;
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
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid vertical={false} stroke="#ECEDF2" />
            <XAxis
              dataKey={showXAxisDates ? "date" : "dayNumber"}
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              interval={0}
              tick={(props) => {
                const { x, y, index, payload } = props;
                if (showXAxisDates) {
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
                        {payload.value}
                      </text>
                    </g>
                  );
                }
                const day = chartData[index];
                if (!day) return null;
                const isLast = index === chartData.length - 1;
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
                      fill={isLast ? "#262C44" : "#757FA0"}
                      className={`text-[12px] ${isLast ? "font-bold" : "font-medium"}`}
                      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                    >
                      {day.dayNumber}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#757FA0", fontSize: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {type === "bar" ? (
              <Bar 
                dataKey="processedPercentage" 
                fill="#DB74ED" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="processedPercentage"
                stroke="#DB74ED"
                fill="#DB74ED"
                fillOpacity={0.4}
                strokeWidth={2}
              />
            )}

            <Line 
              type="monotone" 
              dataKey="goal" 
              stroke="#757FA0" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={type === "area" ? false : { r: 3, fill: "#757FA0", strokeWidth: 0 }}
              activeDot={false}
              legendType="none"
              tooltipType="none"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#DB74ED" }} />
          <span className="text-[14px] font-medium text-[#757FA0]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Processed food</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="h-[2px] w-6 bg-[#757FA0]" style={{ borderStyle: 'dashed', backgroundImage: 'linear-gradient(to right, #757FA0 50%, rgba(255, 255, 255, 0) 0%)', backgroundSize: '6px 2px', backgroundRepeat: 'repeat-x' }} />
            {type !== "area" && <div className="h-2 w-2 rounded-full bg-[#757FA0] -ml-[14px]" />}
            <div className="h-[2px] w-6" /> {/* Spacer */}
          </div>
          <span className="text-[14px] font-medium text-[#757FA0]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Goal</span>
        </div>
      </div>
    </div>
  );
}
