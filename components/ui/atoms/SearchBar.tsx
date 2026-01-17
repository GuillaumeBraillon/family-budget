import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Rechercher..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus quand on ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fermer si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && !value) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, value]);

  // Si ouvert, afficher l'input complet
  if (isOpen || value) {
    return (
      <div ref={containerRef} className="w-full md:w-auto md:flex-1 md:max-w-xs animate-in fade-in slide-in-from-right-2 duration-200">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer animate-in fade-in zoom-in duration-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Si fermé, afficher juste l'icône
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-center shrink-0"
      title="Rechercher"
    >
      <Search size={18} className="text-slate-400" />
    </button>
  );
};
