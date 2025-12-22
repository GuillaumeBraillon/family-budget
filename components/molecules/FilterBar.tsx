
import React, { useState } from 'react';
import { Filter, X, ShoppingBag, Star, Clock, CalendarClock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { OperationFilters, Account, Person, AccountType } from '../../types';

interface FilterBarProps {
  filters: OperationFilters;
  onFilterChange: (filters: OperationFilters) => void;
  accounts: Account[];
  people: Person[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, accounts, people }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMulti = (key: 'accountIds' | 'beneficiaryIds', value: string) => {
    const current = filters[key];
    const next = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
    onFilterChange({ ...filters, [key]: next });
  };

  const toggleFlux = (type: 'EXPENSE' | 'INCOME') => {
      const nextValue = filters.flux === type ? 'ALL' : type;
      onFilterChange({ ...filters, flux: nextValue });
  };

  const toggleSource = (source: 'RECURRING' | 'VARIABLE') => {
      const nextValue = filters.source === source ? 'ALL' : source;
      onFilterChange({ ...filters, source: nextValue });
  };

  const toggleStatus = (status: 'REAL' | 'WAITING') => {
      const nextValue = filters.status === status ? 'ALL' : status;
      onFilterChange({ ...filters, status: nextValue });
  };

  const toggleExtras = () => {
      const nextValue = filters.extra === 'ONLY' ? 'ALL' : 'ONLY';
      onFilterChange({ ...filters, extra: nextValue });
  };

  const clear = () => {
    onFilterChange({
        flux: 'ALL',
        source: 'ALL',
        status: 'ALL',
        extra: 'ALL',
        accountIds: [],
        beneficiaryIds: []
    });
  };

  const activeFiltersCount = [
    filters.flux !== 'ALL',
    filters.source !== 'ALL',
    filters.status !== 'ALL',
    filters.extra !== 'ALL',
    filters.accountIds.length > 0,
    filters.beneficiaryIds.length > 0
  ].filter(Boolean).length;

  const checkingAccounts = accounts.filter(acc => acc.type === AccountType.CHECKING);

  return (
    <div className="flex flex-col gap-3">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                <Filter size={14} /> Filtres d'analyse
              </div>
              {activeFiltersCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                    {activeFiltersCount}
                </span>
              )}
          </div>
          <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); clear(); }}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 uppercase transition-colors"
                >
                    <X size={12} /> Effacer
                </button>
              )}
              <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
          </div>
      </div>

      {isExpanded && (
        <div className="flex flex-wrap gap-3 pb-2 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
            {/* FLUX - EXCLUSIF */}
            <FilterGroup label="Flux">
                <FilterChip 
                    label="Dépenses" 
                    active={filters.flux === 'EXPENSE'} 
                    onClick={() => toggleFlux('EXPENSE')} 
                    color="indigo"
                />
                <FilterChip 
                    label="Revenus" 
                    active={filters.flux === 'INCOME'} 
                    onClick={() => toggleFlux('INCOME')} 
                    color="emerald"
                />
            </FilterGroup>

            {/* SOURCE - EXCLUSIF */}
            <FilterGroup label="Source">
                <FilterChip 
                    label="Récurrent" 
                    icon={<CalendarClock size={10} />}
                    active={filters.source === 'RECURRING'} 
                    onClick={() => toggleSource('RECURRING')} 
                    color="indigo"
                />
                <FilterChip 
                    label="Variable" 
                    icon={<ShoppingBag size={10} />}
                    active={filters.source === 'VARIABLE'} 
                    onClick={() => toggleSource('VARIABLE')} 
                    color="indigo"
                />
            </FilterGroup>

            {/* ÉTAT - EXCLUSIF */}
            <FilterGroup label="État">
                <FilterChip 
                    label="Réel" 
                    icon={<CheckCircle2 size={10} />}
                    active={filters.status === 'REAL'} 
                    onClick={() => toggleStatus('REAL')} 
                    color="emerald"
                />
                <FilterChip 
                    label="Attente" 
                    icon={<Clock size={10} />}
                    active={filters.status === 'WAITING'} 
                    onClick={() => toggleStatus('WAITING')} 
                    color="amber"
                />
            </FilterGroup>

            {/* OPTIONS - BINAIRES */}
            <FilterGroup label="Options">
                <FilterChip 
                    label="Extras" 
                    icon={<Star size={10} />}
                    active={filters.extra === 'ONLY'} 
                    onClick={toggleExtras} 
                    color="amber"
                />
            </FilterGroup>

            {/* COMPTES - MULTI-SELECT */}
            <FilterGroup label="Comptes">
                {checkingAccounts.map(acc => (
                    <FilterChip 
                        key={acc.id}
                        label={acc.name} 
                        active={filters.accountIds.includes(acc.id)} 
                        onClick={() => toggleMulti('accountIds', acc.id)} 
                    />
                ))}
            </FilterGroup>

            {/* BÉNÉFICIAIRES - MULTI-SELECT */}
            <FilterGroup label="Bénéficiaires">
                {people.map(p => (
                    <FilterChip 
                        key={p.id}
                        label={p.name} 
                        active={filters.beneficiaryIds.includes(p.id)} 
                        onClick={() => toggleMulti('beneficiaryIds', p.id)} 
                    />
                ))}
            </FilterGroup>
        </div>
      )}
    </div>
  );
};

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
        <span className="text-[9px] font-black text-slate-400 uppercase px-1.5 border-r border-slate-200">{label}</span>
        <div className="flex gap-1">
            {children}
        </div>
    </div>
);

const FilterChip: React.FC<{ 
    label: string; 
    active: boolean; 
    onClick: () => void; 
    color?: 'indigo' | 'emerald' | 'amber';
    icon?: React.ReactNode;
}> = ({ label, active, onClick, color = 'indigo', icon }) => {
    let activeClass = '';
    switch(color) {
        case 'emerald': activeClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm'; break;
        case 'amber': activeClass = 'bg-amber-500 text-white border-amber-500 shadow-sm'; break;
        default: activeClass = 'bg-indigo-600 text-white border-indigo-600 shadow-sm';
    }
    
    const inactiveClass = 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700';

    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1.5 ${active ? activeClass : inactiveClass}`}
        >
            {icon}
            {label}
        </button>
    );
};
