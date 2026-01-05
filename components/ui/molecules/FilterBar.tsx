
import React, { useState } from 'react';
import { Filter, Star, Clock, CalendarClock, CheckCircle2, ArrowRightLeft, Briefcase, Tag, Ban, ListFilter, TrendingDown, TrendingUp, CreditCard, Users, List, RefreshCw, Circle, Wallet, Layers, ShoppingBag, Plus, SlidersHorizontal, X } from 'lucide-react';
import { OperationFilters, Account, Person, AccountType, Tag as TagType } from '../../../types';
import { FilterDropdown, FilterOption } from './FilterDropdown';

interface FilterBarProps {
  filters: OperationFilters;
  onFilterChange: (filters: OperationFilters) => void;
  accounts: Account[];
  people: Person[];
  tags?: TagType[];
  hiddenFilters?: ('flux' | 'source' | 'status' | 'extra' | 'transfer' | 'salary' | 'accounts' | 'beneficiaries' | 'tags')[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, accounts, people, tags = [], hiddenFilters = [] }) => {
  const [showAllFilters, setShowAllFilters] = useState(false);

  const update = (key: keyof OperationFilters, value: any) => {
      onFilterChange({ ...filters, [key]: value });
  };

  const clear = () => {
    onFilterChange({
        flux: 'ALL',
        source: 'ALL',
        status: 'ALL',
        extra: 'ALL',
        transfer: 'EXCLUDE',
        salary: 'EXCLUDE', // Remet à EXCLUDE pour masquer par défaut
        accountIds: [],
        beneficiaryIds: [],
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: 'ALL'
    });
  };

  // --- CONFIGURATION DES BOUTONS CYCLIQUES ---

  // 1. FLUX (Cycle: Tous -> Dépenses -> Revenus)
  const cycleFlux = () => {
      const next = filters.flux === 'ALL' ? 'EXPENSE' 
                 : filters.flux === 'EXPENSE' ? 'INCOME' 
                 : 'ALL';
      update('flux', next);
  };

  const getFluxConfig = () => {
      switch(filters.flux) {
          case 'EXPENSE': return { label: 'Dépenses', icon: <TrendingDown size={14} />, color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' };
          case 'INCOME': return { label: 'Revenus', icon: <TrendingUp size={14} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' };
          default: return { label: 'Flux: Tous', icon: <ArrowRightLeft size={14} />, color: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300' };
      }
  };
  const fluxConfig = getFluxConfig();

  // 2. STATUT (Cycle: Tous -> Réel -> En attente)
  const cycleStatus = () => {
      const next = filters.status === 'ALL' ? 'REAL' 
                 : filters.status === 'REAL' ? 'WAITING' 
                 : 'ALL';
      update('status', next);
  };

  const getStatusConfig = () => {
      switch (filters.status) {
          case 'REAL': return { label: 'Réel (Pointé)', icon: <CheckCircle2 size={14} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' };
          case 'WAITING': return { label: 'En attente', icon: <Clock size={14} />, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' };
          default: return { label: 'Statut: Tous', icon: <ListFilter size={14} />, color: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300' };
      }
  };
  const statusConfig = getStatusConfig();

  // 3. SOURCE (Cycle: Variable -> Récurrent -> Toutes)
  const cycleSource = () => {
      const next = filters.source === 'VARIABLE' ? 'RECURRING'
                 : filters.source === 'RECURRING' ? 'ALL'
                 : 'VARIABLE';
      update('source', next);
  };

  const getSourceConfig = () => {
      switch(filters.source) {
          case 'RECURRING': return { label: 'Récurrent', icon: <CalendarClock size={14} />, color: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' };
          case 'VARIABLE': return { label: 'Variable', icon: <ShoppingBag size={14} />, color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100' };
          default: return { label: 'Source: Toutes', icon: <List size={14} />, color: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300' };
      }
  };
  const sourceConfig = getSourceConfig();

  // 4. NATURE / EXTRA (Cycle: Tout -> Standard -> Extra)
  const cycleExtra = () => {
      const next = filters.extra === 'ALL' ? 'EXCLUDE' 
                 : filters.extra === 'EXCLUDE' ? 'ONLY' 
                 : 'ALL';
      update('extra', next);
  };

  const getExtraConfig = () => {
      switch(filters.extra) {
          case 'EXCLUDE': return { label: 'Standard', icon: <Circle size={14} />, color: 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' };
          case 'ONLY': return { label: 'Extras', icon: <Star size={14} />, color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' };
          default: return { label: 'Nature: Tout', icon: <Layers size={14} />, color: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300' };
      }
  };
  const extraConfig = getExtraConfig();

  // --- CONFIGURATION DES DROPDOWNS (Multi-sélection) ---

  // COMPTES
  const accountOptions: FilterOption[] = accounts
    .filter(a => a.type === AccountType.CHECKING)
    .map(a => ({ id: a.id, label: a.name }));
  const allAccountIds = accountOptions.map(o => o.id);
  const visualAccountIds = filters.accountIds.length === 0 ? allAccountIds : filters.accountIds;
  const handleAccountChange = (ids: string[]) => {
      if (ids.length === allAccountIds.length) update('accountIds', []);
      else update('accountIds', ids);
  };

  // TAGS
  const tagOptions: FilterOption[] = tags.map(t => ({ 
      id: t.id, 
      label: t.name, 
      color: t.color,
      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} /> 
  }));

  const handleTagTriStateChange = (id: string, state: 'INCLUDE' | 'EXCLUDE' | null) => {
      let newIncluded = [...filters.includedTagIds];
      let newExcluded = [...filters.excludedTagIds];

      newIncluded = newIncluded.filter(tid => tid !== id);
      newExcluded = newExcluded.filter(tid => tid !== id);

      if (state === 'INCLUDE') {
          newIncluded.push(id);
          if (filters.tagPresence === 'WITHOUT_TAGS') update('tagPresence', 'WITH_TAGS');
      } else if (state === 'EXCLUDE') {
          newExcluded.push(id);
      }

      onFilterChange({
          ...filters,
          includedTagIds: newIncluded,
          excludedTagIds: newExcluded
      });
  };

  const handleTagPresenceChange = (mode: 'ALL' | 'WITH_TAGS' | 'WITHOUT_TAGS') => {
      onFilterChange({
          ...filters,
          tagPresence: mode,
          includedTagIds: mode === 'WITHOUT_TAGS' ? [] : filters.includedTagIds
      });
  };

  // BÉNÉFICIAIRES
  const benOptions: FilterOption[] = people.map(p => ({ 
      id: p.id, 
      label: p.name, 
      icon: p.isChild ? <Users size={14} className="text-indigo-400" /> : <Users size={14} className="text-slate-400" />
  }));
  const allBenIds = benOptions.map(o => o.id);
  const visualBenIds = filters.beneficiaryIds.length === 0 ? allBenIds : filters.beneficiaryIds;
  const handleBenChange = (ids: string[]) => {
      if (ids.length === allBenIds.length) update('beneficiaryIds', []);
      else update('beneficiaryIds', ids);
  };

  // SALAIRES
  const salaryOptions: FilterOption[] = [
      { id: 'OTHER', label: 'Autres flux', icon: <Wallet size={14} className="text-slate-400" /> },
      { id: 'SALARY', label: 'Salaires', icon: <Briefcase size={14} className="text-emerald-600" /> }
  ];
  const selectedSalary = filters.salary === 'ALL' ? ['OTHER', 'SALARY'] : (filters.salary === 'ONLY' ? ['SALARY'] : ['OTHER']);
  const handleSalaryChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('salary', 'ALL');
      else if (ids[0] === 'SALARY') update('salary', 'ONLY');
      else update('salary', 'EXCLUDE');
  };

  // VIREMENTS
  const transferOptions: FilterOption[] = [
      { id: 'STANDARD', label: 'Opérations', icon: <Layers size={14} className="text-slate-400" /> },
      { id: 'TRANSFER', label: 'Virements', icon: <ArrowRightLeft size={14} className="text-indigo-500" /> }
  ];
  const selectedTransfer = filters.transfer === 'ALL' ? ['STANDARD', 'TRANSFER'] : (filters.transfer === 'ONLY' ? ['TRANSFER'] : ['STANDARD']);
  const handleTransferChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('transfer', 'ALL');
      else if (ids[0] === 'TRANSFER') update('transfer', 'ONLY');
      else update('transfer', 'EXCLUDE');
  };

  // --- LOGIQUE D'ACTIVITÉ ---
  const isTagsActive = filters.includedTagIds.length > 0 || filters.excludedTagIds.length > 0 || filters.tagPresence !== 'ALL';
  const isExtraActive = filters.extra !== 'ALL';
  const isSalaryActive = filters.salary !== 'EXCLUDE'; // Défaut EXCLUDE
  const isBenActive = filters.beneficiaryIds.length > 0;
  const isSourceActive = filters.source !== 'ALL';
  const isTransferActive = filters.transfer !== 'EXCLUDE'; // Défaut EXCLUDE
  const isAccountActive = filters.accountIds.length > 0;

  const hasActiveSecondary = isTagsActive || isSalaryActive || isBenActive || isTransferActive || isAccountActive;
  
  // Total des filtres actifs pour le badge global
  const activeFiltersCount = [
    filters.flux !== 'ALL',
    isSourceActive,
    isExtraActive,
    filters.status !== 'ALL',
    hasActiveSecondary
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
        {/* HEADER BAR AVEC WRAP */}
        <div className="flex flex-wrap items-center gap-2">
            
            {/* LABEL FILTRES */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 flex-shrink-0 h-8">
                <Filter size={14} /> 
                <span className="hidden sm:inline">Filtres</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
                        !
                    </span>
                )}
            </div>

            {/* FILTRES PRIMAIRES (Boutons Cycliques) */}
            
            {!hiddenFilters.includes('flux') && (
                <button
                    onClick={cycleFlux}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm whitespace-nowrap ${fluxConfig.color}`}
                >
                    {fluxConfig.icon}
                    {fluxConfig.label}
                </button>
            )}

            {(!hiddenFilters.includes('source')) && (
                <button
                    onClick={cycleSource}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm whitespace-nowrap ${sourceConfig.color}`}
                >
                    {sourceConfig.icon}
                    {sourceConfig.label}
                </button>
            )}

            {(!hiddenFilters.includes('extra')) && (
                <button
                    onClick={cycleExtra}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm whitespace-nowrap ${extraConfig.color}`}
                >
                    {extraConfig.icon}
                    {extraConfig.label}
                </button>
            )}

            {!hiddenFilters.includes('status') && (
                <button
                    onClick={cycleStatus}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm whitespace-nowrap ${statusConfig.color}`}
                >
                    {statusConfig.icon}
                    {statusConfig.label}
                </button>
            )}

            {/* BOUTON TOGGLE "PLUS DE FILTRES" */}
            <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className={`h-[30px] px-3 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    showAllFilters 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : (hasActiveSecondary ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')
                }`}
            >
                {showAllFilters ? <X size={14} /> : <SlidersHorizontal size={14} />}
                <span className="hidden sm:inline">{showAllFilters ? 'Fermer' : 'Plus de filtres'}</span>
                {!showAllFilters && hasActiveSecondary && <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5"></span>}
            </button>

            {/* BOUTON RESET (Si filtres actifs) */}
            {(activeFiltersCount > 0 || hasActiveSecondary) && (
                <button 
                    onClick={clear}
                    className="ml-auto sm:ml-0 h-[30px] px-3 rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:text-rose-700 hover:border-rose-200 text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                    title="Réinitialiser tous les filtres"
                >
                    <RefreshCw size={12} /> <span className="hidden sm:inline">Reset</span>
                </button>
            )}
        </div>

        {/* FILTRES SECONDAIRES (Repliables) */}
        {(showAllFilters || hasActiveSecondary) && (
            <div className={`flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-1 duration-200 ${!showAllFilters ? 'hidden sm:flex' : ''}`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Avancé :</span>
                
                {/* COMPTES (Dropdown) */}
                {!hiddenFilters.includes('accounts') && (showAllFilters || isAccountActive) && (
                    <FilterDropdown 
                        label="Comptes"
                        icon={<CreditCard size={14} />}
                        options={accountOptions}
                        selectedValues={visualAccountIds}
                        onChange={handleAccountChange}
                        onSelectAll={() => update('accountIds', [])}
                    />
                )}

                {/* TAGS (Dropdown) */}
                {(!hiddenFilters.includes('tags') && tags.length > 0) && (showAllFilters || isTagsActive) && (
                    <FilterDropdown 
                        label="Tags"
                        icon={<Tag size={14} />}
                        options={tagOptions}
                        selectedValues={[]} 
                        onChange={() => {}} 
                        triStateMode={true}
                        includedValues={filters.includedTagIds}
                        excludedValues={filters.excludedTagIds}
                        onTriStateChange={handleTagTriStateChange}
                        onClear={() => onFilterChange({ ...filters, includedTagIds: [], excludedTagIds: [], tagPresence: 'ALL' })}
                        headerContent={
                            <div className="flex bg-slate-100 p-0.5 rounded-lg mb-2">
                                <button onClick={() => handleTagPresenceChange('ALL')} className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Tous</button>
                                <button onClick={() => handleTagPresenceChange('WITH_TAGS')} className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'WITH_TAGS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Avec</button>
                                <button onClick={() => handleTagPresenceChange('WITHOUT_TAGS')} className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'WITHOUT_TAGS' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Sans</button>
                            </div>
                        }
                    />
                )}

                {/* SALAIRES (Dropdown) */}
                {(!hiddenFilters.includes('salary')) && (showAllFilters || isSalaryActive) && (
                    <FilterDropdown 
                        label="Salaires"
                        icon={<Briefcase size={14} />}
                        options={salaryOptions}
                        selectedValues={selectedSalary}
                        onChange={handleSalaryChange}
                        onSelectAll={() => update('salary', 'ALL')} 
                        color="emerald"
                    />
                )}

                {/* BÉNÉFICIAIRES (Dropdown) */}
                {(!hiddenFilters.includes('beneficiaries')) && (showAllFilters || isBenActive) && (
                    <FilterDropdown 
                        label="Bénéficiaires"
                        icon={<Users size={14} />}
                        options={benOptions}
                        selectedValues={visualBenIds}
                        onChange={handleBenChange}
                        onSelectAll={() => update('beneficiaryIds', [])}
                    />
                )}

                {/* VIREMENTS (Dropdown) */}
                {(!hiddenFilters.includes('transfer')) && (showAllFilters || isTransferActive) && (
                    <FilterDropdown 
                        label="Virements"
                        icon={<ArrowRightLeft size={14} />}
                        options={transferOptions}
                        selectedValues={selectedTransfer}
                        onChange={handleTransferChange}
                        onSelectAll={() => update('transfer', 'ALL')}
                        color="slate"
                    />
                )}
            </div>
        )}
    </div>
  );
};
