import React from 'react';
import { Card } from '../../ui/Card';

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  border?: string;
  children?: React.ReactNode;
  hideAmount?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, amount, icon, border = '', children, hideAmount 
}) => (
  <Card className={`p-5 flex flex-col justify-between ${border}`}>
    <div>
      <p className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1 tracking-wider">
        {icon}{title}
      </p>
      {!hideAmount && <h3 className="text-2xl font-bold text-slate-900 mt-1">{amount.toFixed(2)} €</h3>}
    </div>
    {children}
  </Card>
);