"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface MacrosChartProps {
  data: any[];
  title: string;
  type?: "bar" | "area";
  subtitle?: string;
}

export default function MacrosChart({ data, title, type = "bar", subtitle }: MacrosChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-6">
        <h2 className="text-title-custom font-bold text-[#262C44]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{title}</h2>
        {subtitle && (
          <p className="text-body-sm-custom mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "#757FA0" }}>{subtitle}</p>
        )}
      </div>

      <div className="h-[200px] w-full">
        <ChartContainer config={chartConfig}>
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="dayNumber"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5A658D", fontSize: 12, fontWeight: 400 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5A658D", fontSize: 12, fontWeight: 400 }}
                tickFormatter={(value) => `${value}g`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="protein" name="Protein" stackId="a" fill="#FF9191" radius={[0, 0, 0, 0]} barSize={24} />
              <Bar dataKey="carbs" name="Carb" stackId="a" fill="#FFDD95" radius={[0, 0, 0, 0]} barSize={24} />
              <Bar dataKey="fats" name="Fat" stackId="a" fill="#8586E2" radius={[0, 0, 0, 0]} barSize={24} />
              <Bar dataKey="fiber" name="Fiber" stackId="a" fill="#79D58D" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5A658D", fontSize: 10, fontWeight: 400 }}
                dy={10}
                interval={Math.floor(data.length / 5)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5A658D", fontSize: 12, fontWeight: 400 }}
                tickFormatter={(value) => `${value}g`}
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
        </ChartContainer>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FF9191" }} />
          <span className="text-body-sm-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Protein</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#FFDD95" }} />
          <span className="text-body-sm-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Carb</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#8586E2" }} />
          <span className="text-body-sm-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Fat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#79D58D" }} />
          <span className="text-body-sm-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Fiber</span>
        </div>
      </div>
    </div>
  );
}
