"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer, ComposedChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface MacrosChartProps {
  data: Array<{
    dayName?: string;
    dayNumber: number;
    date: string;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    [key: string]: any;
  }>;
  title: string;
  type?: "bar" | "area";
  subtitle?: string;
}

  export default function MacrosChart({ data, title, type = "bar", subtitle }: MacrosChartProps) {
    const chartData = data.map((d, i) => {
      if (i === data.length - 1) {
        return { ...d, protein: null, carbs: null, fats: null, fiber: null };
      }
      return d;
    });

    const chartConfig = {
      protein: {
        label: "Protein",
        color: "#FF9191",
      },
      carbs: {
        label: "Carb",
        color: "#FFDD95",
      },
      fats: {
        label: "Fat",
        color: "#8586E2",
      },
      fiber: {
        label: "Fiber",
        color: "#79D58D",
      },
    };
  
    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
      if (active && payload && payload.length) {
        return (
          <div className="rounded-lg border bg-white p-2 shadow-sm">
            <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">{label}</div>
            <div className="flex flex-col gap-1">
              {payload.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{Math.round(item.value)}g</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return null;
    };
  
    // For area chart, we need 5 dates on X-axis
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
            {type === "bar" ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid vertical={false} stroke="#ECEDF2" />
                <XAxis
                  dataKey="dayNumber"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={(props) => {
                    const { x, y, index } = props;
                    const day = chartData[index];
                    if (!day) return null;
                    const isToday = index === chartData.length - 1;
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
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#757FA0", fontSize: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="protein" name="Protein" stackId="a" fill="#FF9191" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="carbs" name="Carb" stackId="a" fill="#FFDD95" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="fats" name="Fat" stackId="a" fill="#8586E2" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="fiber" name="Fiber" stackId="a" fill="#79D58D" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid vertical={false} stroke="#ECEDF2" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  ticks={xTicks}
                  interval={0}
                  tick={(props) => {
                    const { x, y, index, payload } = props;
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
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#757FA0", fontSize: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="protein"
                  name="Protein"
                  stackId="1"
                  stroke="#FF9191"
                  fill="#FF9191"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="carbs"
                  name="Carb"
                  stackId="1"
                  stroke="#FFDD95"
                  fill="#FFDD95"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="fats"
                  name="Fat"
                  stackId="1"
                  stroke="#8586E2"
                  fill="#8586E2"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="fiber"
                  name="Fiber"
                  stackId="1"
                  stroke="#79D58D"
                  fill="#79D58D"
                  fillOpacity={0.8}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FF9191" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Protein</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FFDD95" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Carb</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#8586E2" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Fat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#79D58D" }} />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Fiber</span>
        </div>
      </div>
    </div>
  );
}
