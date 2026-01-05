
import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface StatusToggleProps {
  isWaiting: boolean;
  onChange: (isWaiting: boolean) => void;
  label?: string;
  className?: string;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ 
  isWaiting, 
  onChange, 
  label = "Statut",
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 uppercase block mb-1">{label}</label>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => onChange(false)} // Réel = isWaiting false
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
            !isWaiting 
              ? 'bg-emerald-500 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <CheckCircle2 size={16} /> Réel
        </button>
        <button
          type="button"
          onClick={() => onChange(true)} // Attente = isWaiting true
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
            isWaiting 
              ? 'bg-amber-500 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Clock size={16} /> En attente
        </button>
      </div>
    </div>
  );
};
