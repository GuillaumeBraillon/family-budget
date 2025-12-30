
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, CheckSquare, Square, PlusCircle, MinusCircle, Circle } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  selectedValues: string[]; // IDs sélectionnés (Utilisé pour le mode standard)
  onChange: (newValues: string[]) => void; // Standard change
  
  // Tri-State Props
  triStateMode?: boolean;
  includedValues?: string[];
  excludedValues?: string[];
  onTriStateChange?: (id: string, state: 'INCLUDE' | 'EXCLUDE' | null) => void;

  onClear?: () => void;
  onSelectAll?: () => void;
  color?: 'indigo' | 'emerald' | 'amber' | 'slate';
  headerContent?: React.ReactNode; 
  singleSelect?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  triStateMode = false,
  includedValues = [],
  excludedValues = [],
  onTriStateChange,
  onClear,
  onSelectAll,
  color = 'indigo',
  headerContent,
  singleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // La fermeture est gérée principalement par le backdrop transparent du portal
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const menuWidth = 256; 
        const margin = 8;

        let left = rect.left;
        if (left + menuWidth > screenWidth - margin) {
            left = screenWidth - menuWidth - margin;
        }
        if (left < margin) {
            left = margin;
        }

        setMenuPos({
            top: rect.bottom + 4 + window.scrollY,
            left: left + window.scrollX
        });
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (id: string) => {
    if (triStateMode && onTriStateChange) {
        // Cycle : Neutral -> Include -> Exclude -> Neutral
        const isIncluded = includedValues.includes(id);
        const isExcluded = excludedValues.includes(id);

        if (!isIncluded && !isExcluded) {
            onTriStateChange(id, 'INCLUDE');
        } else if (isIncluded) {
            onTriStateChange(id, 'EXCLUDE');
        } else {
            onTriStateChange(id, null);
        }
    } else {
        // Mode Standard
        if (singleSelect) {
            onChange([id]);
            setIsOpen(false);
        } else {
            const newValues = selectedValues.includes(id)
            ? selectedValues.filter(v => v !== id)
            : [...selectedValues, id];
            onChange(newValues);
        }
    }
  };

  // Calcul du label affiché sur le bouton
  const getButtonLabel = () => {
    if (triStateMode) {
        const count = includedValues.length + excludedValues.length;
        if (count === 0) return label;
        if (count === 1 && includedValues.length === 1) {
             const opt = options.find(o => o.id === includedValues[0]);
             return opt ? opt.label : label;
        }
        return `${label} (${count})`;
    }

    if (selectedValues.length === 0) return label;
    
    if (singleSelect) {
        const selected = options.find(o => o.id === selectedValues[0]);
        return selected ? selected.label : label;
    }

    if (selectedValues.length === options.length) return `${label} (${options.length})`;
    
    if (selectedValues.length === 1) {
        const selected = options.find(o => o.id === selectedValues[0]);
        return selected ? selected.label : `${label} (1)`;
    }
    
    return `${label} (${selectedValues.length})`;
  };

  const isActive = triStateMode ? (includedValues.length > 0 || excludedValues.length > 0) : selectedValues.length > 0;
  
  let activeBtnClass = '';
  let activeTextClass = '';
  
  switch(color) {
      case 'emerald': 
        activeBtnClass = 'bg-emerald-50 border-emerald-200 text-emerald-700'; 
        activeTextClass = 'text-emerald-600';
        break;
      case 'amber': 
        activeBtnClass = 'bg-amber-50 border-amber-200 text-amber-700'; 
        activeTextClass = 'text-amber-600';
        break;
      default: 
        activeBtnClass = 'bg-indigo-50 border-indigo-200 text-indigo-700';
        activeTextClass = 'text-indigo-600';
        break;
  }

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        <button
          type="button"
          onClick={toggleOpen}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm whitespace-nowrap ${
            isActive 
              ? activeBtnClass 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <span className={isActive ? activeTextClass : 'text-slate-400'}>
              {icon}
          </span>
          <span>{getButtonLabel()}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
        </button>
      </div>

      {isOpen && menuPos && createPortal(
        <div className="absolute z-[9999] top-0 left-0 w-full h-full">
            <div 
                className="fixed inset-0 bg-transparent" 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            />
            
            <div 
                className="absolute w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[400px]"
                style={{ 
                    top: menuPos.top, 
                    left: menuPos.left,
                    transformOrigin: 'top left' 
                }}
                onClick={(e) => e.stopPropagation()} 
            >
                
                {(headerContent || (!singleSelect && (onSelectAll || onClear))) && (
                    <div className="p-2 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm space-y-2 flex-shrink-0 z-10">
                        {headerContent}
                        
                        {!singleSelect && (onSelectAll || onClear) && (
                            <div className="flex gap-2">
                                {onSelectAll && (
                                    <button onClick={onSelectAll} className="flex-1 py-1.5 px-2 text-[10px] font-bold bg-white border border-slate-200 rounded text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                        Tout cocher
                                    </button>
                                )}
                                {onClear && (
                                    <button onClick={onClear} className="flex-1 py-1.5 px-2 text-[10px] font-bold bg-white border border-slate-200 rounded text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors">
                                        Effacer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="overflow-y-auto p-1 custom-scrollbar bg-white">
                    {options.map(opt => {
                        let isSelected = false;
                        let state: 'NEUTRAL' | 'INCLUDE' | 'EXCLUDE' = 'NEUTRAL';

                        if (triStateMode) {
                            if (includedValues.includes(opt.id)) state = 'INCLUDE';
                            else if (excludedValues.includes(opt.id)) state = 'EXCLUDE';
                        } else {
                            isSelected = selectedValues.includes(opt.id);
                        }

                        let rowBg = 'hover:bg-slate-50';
                        if (state === 'INCLUDE') rowBg = 'bg-emerald-50 hover:bg-emerald-100';
                        if (state === 'EXCLUDE') rowBg = 'bg-rose-50 hover:bg-rose-100';
                        if (!triStateMode && isSelected) rowBg = 'bg-slate-50';

                        return (
                            <div 
                                key={opt.id}
                                onClick={() => handleOptionClick(opt.id)}
                                className={`relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs group transition-colors mb-0.5 ${rowBg}`}
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="flex-shrink-0">
                                        {triStateMode ? (
                                            state === 'INCLUDE' ? <PlusCircle size={16} className="text-emerald-600 fill-emerald-100" /> :
                                            state === 'EXCLUDE' ? <MinusCircle size={16} className="text-rose-600 fill-rose-100" /> :
                                            <Circle size={16} className="text-slate-300" />
                                        ) : (
                                            singleSelect ? (
                                                isSelected ? <CheckCircleRadio /> : <CircleRadio />
                                            ) : (
                                                isSelected ? <CheckSquare size={16} className={activeTextClass} /> : <Square size={16} className="text-slate-300" />
                                            )
                                        )}
                                    </div>
                                    <span className={`truncate font-medium ${state !== 'NEUTRAL' || isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {opt.label}
                                    </span>
                                </div>
                                {opt.icon && <span className="text-slate-400 scale-75">{opt.icon}</span>}

                                {triStateMode && state !== 'NEUTRAL' && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ml-2 ${
                                        state === 'INCLUDE' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                                    }`}>
                                        {state === 'INCLUDE' ? 'Inclu' : 'Exclu'}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    {options.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-400 italic">
                            Aucune option disponible
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

const CheckCircleRadio = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
const CircleRadio = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
        <circle cx="12" cy="12" r="10"></circle>
    </svg>
);
