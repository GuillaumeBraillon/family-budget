
import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, Search, ChevronDown } from 'lucide-react';

interface BaseInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
}

interface TextInputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput: React.FC<TextInputProps> = ({ 
  label, icon: Icon, error, className = '', ...props 
}) => {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <input 
        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
        {...props}
        autoComplete="off"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export const SearchableTextInput: React.FC<TextInputProps & { suggestions?: string[], onSelectSuggestion?: (v: string) => void }> = ({
  suggestions = [], onSelectSuggestion, ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const val = String(props.value || '').toLowerCase();
    setFiltered(val ? suggestions.filter(s => s.toLowerCase().includes(val)) : suggestions);
  }, [props.value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${props.className}`} ref={containerRef}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {props.icon && <props.icon size={12} />} {props.label}
      </label>
      <div className="relative">
        <input 
          className="w-full p-2.5 pr-10 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow"
          {...props}
          onFocus={() => setShowSuggestions(true)}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"><ChevronDown size={16} /></div>
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {filtered.map((s, idx) => (
            <button key={idx} type="button" className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-50 last:border-0 flex items-center gap-2"
              onClick={() => { if (onSelectSuggestion) onSelectSuggestion(s); setShowSuggestions(false); }}>
              <Search size={12} className="text-slate-300" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AmountInput: React.FC<BaseInputProps & React.InputHTMLAttributes<HTMLInputElement> & { color?: 'indigo' | 'emerald' }> = ({ 
  label, icon: Icon, color = 'indigo', ...props 
}) => {
  const focusRing = color === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';
  return (
    <div className={props.className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <div className="relative">
        <input type="number" step="0.01" className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-lg focus:ring-2 outline-none transition-shadow ${focusRing}`} placeholder="0.00" {...props} />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">€</span>
      </div>
    </div>
  );
};

export const SelectInput: React.FC<BaseInputProps & React.SelectHTMLAttributes<HTMLSelectElement> & { color?: 'indigo' | 'emerald' }> = ({ 
  label, icon: Icon, children, color = 'indigo', ...props 
}) => {
  const focusRing = color === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';
  return (
    <div className={props.className}>
      <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <select className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none text-sm transition-shadow ${focusRing}`} {...props}>
        {children}
      </select>
    </div>
  );
};
