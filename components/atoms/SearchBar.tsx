
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Rechercher..." }) => {
  return (
    <div className="flex-1 md:max-w-xs">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder={placeholder} 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
        />
      </div>
    </div>
  );
};
