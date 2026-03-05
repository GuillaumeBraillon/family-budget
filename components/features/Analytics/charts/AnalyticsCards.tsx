import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, Wallet, PieChart as PieIcon, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

// --- TYPES ---
interface AnalyticsProps {
  data: {
    income: number;
    expenses: number;
    plannedExpenses: number;
    balance: number;
    extras: number;
    savingsRatio: number;
    topCategories: { name: string; value: number }[];
    topBeneficiaries: { name: string; value: number }[];
    byAccount: { name: string; real: number; planned: number; diff: number }[];
  };
  onNavigate: (path: string) => void;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#64748b"];

const formatEuro = (val: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

// --- CARTE 1: SANTÉ BUDGÉTAIRE ---
export const HealthCard: React.FC<AnalyticsProps> = ({ data, onNavigate }) => {
  const progress = Math.min((data.expenses / (data.plannedExpenses || 1)) * 100, 100);
  const isOver = data.expenses > data.plannedExpenses;
  const remaining = data.plannedExpenses - data.expenses;

  return (
    <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <Wallet size={16} className="text-indigo-600" /> Santé du Budget
          </span>
          <button onClick={() => onNavigate("balances")} className="text-indigo-600 hover:text-indigo-800">
            <ArrowUpRight size={16} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="mt-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-2xl font-black text-slate-900">{formatEuro(data.expenses)}</span>
            <span className="text-xs font-medium text-slate-500 mb-1">/ {formatEuro(data.plannedExpenses)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isOver ? "bg-rose-500" : "bg-indigo-600"}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div
            className={`p-2 rounded-lg text-xs font-bold flex justify-between items-center ${isOver ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            <span>{isOver ? "Dépassement" : "Reste à dépenser"}</span>
            <span>
              {isOver ? "+" : ""}
              {formatEuro(Math.abs(remaining))}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Par Compte</h4>
          {data.byAccount.slice(0, 3).map((acc, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1 last:border-0">
              <span className="text-slate-600 font-medium truncate max-w-[120px]">{acc.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{formatEuro(acc.real)}</span>
                {Math.abs(acc.diff) > 1 && (
                  <span className={`text-[9px] px-1.5 rounded ${acc.diff >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
                    {acc.diff > 0 ? "+" : ""}
                    {acc.diff.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- CARTE 2: FLUX DE TRÉSORERIE ---
export const CashFlowCard: React.FC<AnalyticsProps> = ({ data, onNavigate }) => {
  // Hack pour éviter le rendu Recharts avant que le DOM ne soit prêt
  const [_isChartReady, setIsChartReady] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsChartReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const chartData = [
    { name: "Entrées", value: data.income, fill: "#10b981" },
    { name: "Sorties", value: data.expenses, fill: "#ef4444" },
  ];

  const net = data.income - data.expenses;

  return (
    <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <ArrowUpRight size={16} className="text-emerald-600" /> Flux de Trésorerie
          </span>
          <button onClick={() => onNavigate("planner")} className="text-emerald-600 hover:text-emerald-800">
            <ArrowUpRight size={16} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="h-32 mb-4 w-full relative min-h-[128px]">
          {_isChartReady && (
            <ResponsiveContainer width="99%" height="100%" minWidth={10}>
              <BarChart data={chartData} layout="vertical" barSize={20}>
                <XAxis type="number" hide />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`${value.toFixed(0)} €`, ""]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} background={{ fill: "#f1f5f9" }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" /> Entrées
            </span>
            <span className="font-bold text-slate-800">{formatEuro(data.income)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <TrendingDown size={12} className="text-rose-500" /> Sorties
            </span>
            <span className="font-bold text-slate-800">{formatEuro(data.expenses)}</span>
          </div>
          <div
            className={`mt-3 p-2 rounded-lg flex justify-between items-center text-sm font-bold ${
              net >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            <span>Reste à vivre</span>
            <span>
              {net > 0 ? "+" : ""}
              {formatEuro(net)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- CARTE 3: ANALYSE EXTRAS ---
export const ExtrasCard: React.FC<AnalyticsProps> = ({ data, onNavigate }) => {
  const ratio = data.expenses > 0 ? (data.extras / data.expenses) * 100 : 0;

  return (
    <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:border-amber-200 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" /> Analyse Extras
          </span>
          <button onClick={() => onNavigate("planner")} className="text-amber-600 hover:text-amber-800">
            <ArrowUpRight size={16} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center pt-0 text-center">
        <div className="bg-amber-50 p-4 rounded-full mb-3 text-amber-500 ring-4 ring-amber-100">
          <AlertTriangle size={24} />
        </div>
        <span className="text-3xl font-black text-slate-900">{formatEuro(data.extras)}</span>
        <span className="text-xs text-slate-500 font-medium mt-1">Dépenses hors budget</span>

        <div className="mt-4 w-full space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-600 px-1">
            <span>Impact sur les dépenses</span>
            <span className="font-bold">{ratio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(ratio, 100)}%` }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- CARTE 4: TOP DÉPENSES ---
export const TopExpensesCard: React.FC<AnalyticsProps> = ({ data, onNavigate: _onNavigate }) => {
  const [mode, setMode] = useState<"CAT" | "BEN">("CAT");
  // Hack pour éviter le rendu Recharts avant que le DOM ne soit prêt
  const [_isChartReady, setIsChartReady] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsChartReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const displayData = mode === "CAT" ? data.topCategories : data.topBeneficiaries;
  const totalDisplayed = displayData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <PieIcon size={16} className="text-purple-600" /> Répartition
          </span>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode("CAT")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${mode === "CAT" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
            >
              Cat
            </button>
            <button
              onClick={() => setMode("BEN")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${mode === "BEN" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
            >
              Qui
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 flex gap-4 items-center">
        <div className="h-28 w-28 flex-shrink-0 relative">
          {_isChartReady && (
            <ResponsiveContainer width="100%" height="100%" minWidth={10}>
              <PieChart>
                <Pie data={displayData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400">
              Total
              <br />
              {formatEuro(totalDisplayed)}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
          {displayData.map((item, idx) => {
            const percent = totalDisplayed > 0 ? (item.value / totalDisplayed) * 100 : 0;
            return (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium truncate max-w-[80px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-400">{percent.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="font-bold text-slate-800">{formatEuro(item.value)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
