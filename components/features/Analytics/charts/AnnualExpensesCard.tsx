import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AnnualExpensesCardProps {
  data: {
    monthName: string;
    monthIndex: number;
    totals: { expenses: number };
  }[];
  year: number;
  onYearChange: (year: number) => void;
}

export const AnnualExpensesCard: React.FC<AnnualExpensesCardProps> = ({ data, year, onYearChange }) => {
  // Hack pour éviter le flash de rendu Recharts SSR/Hydration
  const [isChartReady, setIsChartReady] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsChartReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const chartData = data.map((d) => ({
    name: d.monthName.substring(0, 3), // Jan, Fev...
    fullMonth: d.monthName,
    amount: d.totals.expenses,
  }));

  const maxVal = Math.max(...chartData.map((d) => d.amount), 1000);

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <BarChart3 size={20} className="text-rose-500" />
            Suivi des Dépenses
          </CardTitle>

          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button onClick={() => onYearChange(year - 1)} className="p-1 hover:bg-white rounded-md transition-colors text-slate-600">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-900 px-2 min-w-[40px] text-center">{year}</span>
            <button onClick={() => onYearChange(year + 1)} className="p-1 hover:bg-white rounded-md transition-colors text-slate-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[300px]">
        {isChartReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl">
                        <p className="font-bold capitalize mb-1">{data.fullMonth}</p>
                        <p className="font-mono text-rose-300">{data.amount.toFixed(2)} €</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.amount > maxVal * 0.8 ? "#f43f5e" : "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 animate-pulse">Chargement...</div>
        )}
      </CardContent>
    </Card>
  );
};
