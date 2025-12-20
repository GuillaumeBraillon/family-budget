
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BaseInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  className?: string; // Pour gérer la grille (col-span)
}

interface TextInputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput: React.FC<TextInputProps> = ({ 
  label, icon: Icon, error, className = '', className: _, ...props 
}) => {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <input 
        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
        {...props} 
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

interface AmountInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  color?: 'indigo' | 'emerald';
}

export const AmountInput: React.FC<AmountInputProps> = ({ 
  label, icon: Icon, error, color = 'indigo', className = '', ...props 
}) => {
  const focusRing = color === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';
  
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <div className="relative">
        <input 
          type="number"
          step="0.01"
          className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-lg focus:ring-2 outline-none transition-shadow ${focusRing}`}
          placeholder="0.00"
          {...props} 
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">€</span>
      </div>
    </div>
  );
};

interface SelectInputProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  color?: 'indigo' | 'emerald';
}

export const SelectInput: React.FC<SelectInputProps> = ({ 
  label, icon: Icon, children, color = 'indigo', className = '', ...props 
}) => {
  const focusRing = color === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';

  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <select 
        className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none text-sm transition-shadow ${focusRing}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
