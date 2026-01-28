"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from "recharts";

interface BalanceData {
  dayName: string; // "S", "M", etc.
  dayNumber: number;
  diff: number;
  baseline: number;
}

interface BalanceChartProps {
  data: BalanceData[];
  title?: string;
  subtitle?: string;
}

export default function BalanceChart({ data, title = "Balance", subtitle }: BalanceChartProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-title-custom font-bold text-[#262C44]">{title}</h2>
        {subtitle && (
          <p className="text-body-sm-custom text-[#757FA0] mt-1">{subtitle}</p>
        )}
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            stackOffset="sign"
          >
            <CartesianGrid vertical={false} stroke="#ECEDF2" />
            <XAxis
              dataKey="dayNumber"
              axisLine={false}
              tickLine={false}
              tick={(props) => {
                const { x, y, payload, index } = props;
                const day = data[index];
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
              }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#757FA0", fontSize: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}
              domain={['dataMin - 500', 'dataMax + 500']}
              ticks={[-1000, -500, 0, 500, 1000]}
            />
            
            <Bar dataKey="diff" radius={[4, 4, 4, 4]} barSize={32}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.diff >= 0 ? "#ED5070" : "#FFE5A3"} 
                />
              ))}
            </Bar>

            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#757FA0"
              strokeWidth={2}
              dot={{ r: 3, fill: "#757FA0", strokeWidth: 0 }}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#ED5070]" />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Kcal over</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#FFE5A3]" />
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Kcal low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="h-[2px] w-6 bg-[#757FA0]" />
            <div className="h-2 w-2 rounded-full bg-[#757FA0] -ml-[5px]" />
          </div>
          <span className="text-[12px] font-medium text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Target + active kcal</span>
        </div>
      </div>
    </div>
  );
}
