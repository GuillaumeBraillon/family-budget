import React from 'react';
import { IncomeConfig, Person } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Scale } from 'lucide-react';

interface EquityKPIProps {
    people: Person[];
    incomeConfigs: IncomeConfig[];
}

export const EquityKPI: React.FC<EquityKPIProps> = ({ people, incomeConfigs }) => {
  // Agrégation des revenus par BÉNÉFICIAIRE (Personne)
  const incomeByPerson: Record<string, number> = {};

  incomeConfigs.forEach(inc => {
      // On utilise beneficiaryId car c'est lui qui "gagne" l'argent pour le calcul d'équité
      // ownerId est le compte de réception (technique)
      if (!incomeByPerson[inc.beneficiaryId]) {
          incomeByPerson[inc.beneficiaryId] = 0;
      }
      incomeByPerson[inc.beneficiaryId] += inc.amount;
  });

  const incomes = Object.entries(incomeByPerson).map(([personId, amount]) => {
      const person = people.find(p => p.id === personId);
      return {
          name: person?.name || 'Inconnu',
          value: amount
      };
  }).filter(i => i.name !== 'Inconnu' && i.value > 0);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.value, 0);
  
  const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b']; // Blue, Purple, Emerald, Amber

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Équité & Revenus</CardTitle>
        <Scale className="text-slate-400" size={20} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Chart */}
          <div className="h-48 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {incomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* KPI Text */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">Revenus Cumulés</p>
              <p className="text-2xl font-bold text-slate-900">{totalIncome.toFixed(2)} € <span className="text-sm font-normal text-slate-500">/ mois</span></p>
            </div>

            <div className="space-y-2">
                {incomes.map((inc, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                            {inc.name}
                        </span>
                        <span className="font-semibold">{totalIncome > 0 ? ((inc.value / totalIncome) * 100).toFixed(1) : 0}%</span>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
               <p className="text-xs text-slate-600 leading-relaxed">
                 Répartition théorique des charges communes basée sur les revenus nets déclarés.
               </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};