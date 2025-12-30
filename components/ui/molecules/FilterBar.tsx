
import React from 'react';
import { Filter, Star, Clock, CalendarClock, CheckCircle2, ArrowRightLeft, Briefcase, Tag, Ban, ListFilter, TrendingDown, TrendingUp, CreditCard, Users, List, RefreshCw, Circle, Wallet, Layers, ShoppingBag } from 'lucide-react';
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
        salary: 'ALL',
        accountIds: [],
        beneficiaryIds: [],
        // Reset Tags
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: 'ALL'
    });
  };

  // --- CONFIGURATION DES OPTIONS ---

  // 1. FLUX
  const fluxOptions: FilterOption[] = [
      { id: 'EXPENSE', label: 'Dépenses', icon: <TrendingDown size={14} className="text-indigo-500" /> },
      { id: 'INCOME', label: 'Revenus', icon: <TrendingUp size={14} className="text-emerald-500" /> }
  ];
  const selectedFlux = filters.flux === 'ALL' ? ['EXPENSE', 'INCOME'] : (filters.flux ? [filters.flux] : []);
  const handleFluxChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('flux', 'ALL');
      else update('flux', ids[0]);
  };

  // 2. COMPTES
  const accountOptions: FilterOption[] = accounts
    .filter(a => a.type === AccountType.CHECKING)
    .map(a => ({ id: a.id, label: a.name }));
  const allAccountIds = accountOptions.map(o => o.id);
  // État visuel : Si vide en base (Tout), on coche tout visuellement
  const visualAccountIds = filters.accountIds.length === 0 ? allAccountIds : filters.accountIds;
  const handleAccountChange = (ids: string[]) => {
      // Si l'utilisateur coche tout, on repasse en mode "ALL" (tableau vide)
      if (ids.length === allAccountIds.length) update('accountIds', []);
      else update('accountIds', ids);
  };

  // 3. TAGS
  const tagOptions: FilterOption[] = tags.map(t => ({ 
      id: t.id, 
      label: t.name, 
      color: t.color,
      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} /> 
  }));

  const handleTagTriStateChange = (id: string, state: 'INCLUDE' | 'EXCLUDE' | null) => {
      let newIncluded = [...filters.includedTagIds];
      let newExcluded = [...filters.excludedTagIds];

      // Nettoyage préalable
      newIncluded = newIncluded.filter(tid => tid !== id);
      newExcluded = newExcluded.filter(tid => tid !== id);

      if (state === 'INCLUDE') {
          newIncluded.push(id);
          // Si on inclut explicitement un tag, on bascule probablement en mode "Avec Tag" implicitement si on était en "Sans Tag"
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
          // Optionnel : Reset des sélections individuelles si on passe en mode "Sans Tags" ?
          // Non, on garde la sélection en mémoire, mais le filtrage global prendra le dessus
          includedTagIds: mode === 'WITHOUT_TAGS' ? [] : filters.includedTagIds
      });
  };

  // 4. STATUT
  const statusOptions: FilterOption[] = [
      { id: 'REAL', label: 'Réel (Pointé)', icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
      { id: 'WAITING', label: 'En attente', icon: <Clock size={14} className="text-amber-500" /> }
  ];
  const selectedStatus = filters.status === 'ALL' ? ['REAL', 'WAITING'] : [filters.status];
  const handleStatusChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('status', 'ALL');
      else update('status', ids[0]);
  };

  // 5. BÉNÉFICIAIRES
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

  // 6. SOURCE
  const sourceOptions: FilterOption[] = [
      { id: 'RECURRING', label: 'Récurrent', icon: <CalendarClock size={14} /> },
      { id: 'VARIABLE', label: 'Variable', icon: <ShoppingBag size={14} /> }
  ];
  const selectedSource = filters.source === 'ALL' ? ['RECURRING', 'VARIABLE'] : [filters.source];
  const handleSourceChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('source', 'ALL');
      else update('source', ids[0]);
  };

  // 7. NATURE (Extras)
  const natureOptions: FilterOption[] = [
      { id: 'STANDARD', label: 'Standard', icon: <Circle size={14} className="text-slate-400" /> },
      { id: 'EXTRA', label: 'Extra', icon: <Star size={14} className="text-amber-500" /> }
  ];
  // Logic: ALL = Standard + Extra, ONLY = Extra, EXCLUDE = Standard
  const selectedNature = filters.extra === 'ALL' ? ['STANDARD', 'EXTRA'] : (filters.extra === 'ONLY' ? ['EXTRA'] : ['STANDARD']);
  const handleNatureChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('extra', 'ALL');
      else if (ids[0] === 'EXTRA') update('extra', 'ONLY');
      else update('extra', 'EXCLUDE');
  };

  // 8. SALAIRES
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

  // 9. VIREMENTS
  const transferOptions: FilterOption[] = [
      { id: 'STANDARD', label: 'Opérations', icon: <Layers size={14} className="text-slate-400" /> },
      { id: 'TRANSFER', label: 'Virements', icon: <ArrowRightLeft size={14} className="text-indigo-500" /> }
  ];
  // Logic: Default is EXCLUDE (Standard only). ALL = Standard + Transfer. ONLY = Transfer.
  const selectedTransfer = filters.transfer === 'ALL' ? ['STANDARD', 'TRANSFER'] : (filters.transfer === 'ONLY' ? ['TRANSFER'] : ['STANDARD']);
  const handleTransferChange = (ids: string[]) => {
      if (ids.length === 2 || ids.length === 0) update('transfer', 'ALL');
      else if (ids[0] === 'TRANSFER') update('transfer', 'ONLY');
      else update('transfer', 'EXCLUDE');
  };

  const activeFiltersCount = [
    filters.flux !== 'ALL',
    filters.source !== 'ALL',
    filters.status !== 'ALL',
    filters.extra !== 'ALL',
    filters.transfer !== 'EXCLUDE',
    filters.salary !== 'ALL',
    filters.accountIds.length > 0,
    filters.beneficiaryIds.length > 0,
    filters.includedTagIds.length > 0,
    filters.excludedTagIds.length > 0,
    filters.tagPresence !== 'ALL'
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
        {/* BARRE PRINCIPALE */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient-right">
            
            {/* Indicateur de filtre */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 flex-shrink-0">
                <Filter size={14} /> 
                <span className="hidden sm:inline">Filtres</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
                        {activeFiltersCount}
                    </span>
                )}
            </div>

            {/* FLUX */}
            {!hiddenFilters.includes('flux') && (
                <FilterDropdown 
                    label="Flux"
                    icon={<ArrowRightLeft size={14} />}
                    options={fluxOptions}
                    selectedValues={selectedFlux}
                    onChange={handleFluxChange}
                    onSelectAll={() => update('flux', 'ALL')}
                />
            )}

            {/* COMPTES */}
            {!hiddenFilters.includes('accounts') && (
                <FilterDropdown 
                    label="Comptes"
                    icon={<CreditCard size={14} />}
                    options={accountOptions}
                    selectedValues={visualAccountIds}
                    onChange={handleAccountChange}
                    onSelectAll={() => update('accountIds', [])} // [] = Tout
                    onSolo={(id) => update('accountIds', [id])}
                />
            )}

            {/* STATUT */}
            {!hiddenFilters.includes('status') && (
                <FilterDropdown 
                    label="Statut"
                    icon={<CheckCircle2 size={14} />}
                    options={statusOptions}
                    selectedValues={selectedStatus}
                    onChange={handleStatusChange}
                    onSelectAll={() => update('status', 'ALL')}
                    color="emerald"
                />
            )}

            {/* TAGS (NOUVEAU) */}
            {!hiddenFilters.includes('tags') && tags.length > 0 && (
                <FilterDropdown 
                    label="Tags"
                    icon={<Tag size={14} />}
                    options={tagOptions}
                    selectedValues={[]} // Non utilisé en mode Tri-State
                    onChange={() => {}} // Non utilisé
                    triStateMode={true}
                    includedValues={filters.includedTagIds}
                    excludedValues={filters.excludedTagIds}
                    onTriStateChange={handleTagTriStateChange}
                    onClear={() => onFilterChange({ ...filters, includedTagIds: [], excludedTagIds: [], tagPresence: 'ALL' })}
                    headerContent={
                        <div className="flex bg-slate-100 p-0.5 rounded-lg mb-2">
                            <button 
                                onClick={() => handleTagPresenceChange('ALL')}
                                className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                            >
                                Tous
                            </button>
                            <button 
                                onClick={() => handleTagPresenceChange('WITH_TAGS')}
                                className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'WITH_TAGS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                Avec Tags
                            </button>
                            <button 
                                onClick={() => handleTagPresenceChange('WITHOUT_TAGS')}
                                className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${filters.tagPresence === 'WITHOUT_TAGS' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                Sans Tags
                            </button>
                        </div>
                    }
                />
            )}

            {/* NATURE (EXTRAS) */}
            {!hiddenFilters.includes('extra') && (
                <FilterDropdown 
                    label="Nature"
                    icon={<Star size={14} />}
                    options={natureOptions}
                    selectedValues={selectedNature}
                    onChange={handleNatureChange}
                    onSelectAll={() => update('extra', 'ALL')}
                    color="amber"
                />
            )}

            {/* SALAIRES */}
            {!hiddenFilters.includes('salary') && (
                <FilterDropdown 
                    label="Type"
                    icon={<Briefcase size={14} />}
                    options={salaryOptions}
                    selectedValues={selectedSalary}
                    onChange={handleSalaryChange}
                    onSelectAll={() => update('salary', 'ALL')}
                    color="emerald"
                />
            )}

            {/* BÉNÉFICIAIRES */}
            {!hiddenFilters.includes('beneficiaries') && (
                <FilterDropdown 
                    label="Bénéficiaires"
                    icon={<Users size={14} />}
                    options={benOptions}
                    selectedValues={visualBenIds}
                    onChange={handleBenChange}
                    onSelectAll={() => update('beneficiaryIds', [])} // [] = Tout
                    onSolo={(id) => update('beneficiaryIds', [id])}
                />
            )}

            {/* SOURCE */}
            {!hiddenFilters.includes('source') && (
                <FilterDropdown 
                    label="Source"
                    icon={<List size={14} />}
                    options={sourceOptions}
                    selectedValues={selectedSource}
                    onChange={handleSourceChange}
                    onSelectAll={() => update('source', 'ALL')}
                />
            )}

            {/* VIREMENTS */}
            {!hiddenFilters.includes('transfer') && (
                <FilterDropdown 
                    label="Ops."
                    icon={<ArrowRightLeft size={14} />}
                    options={transferOptions}
                    selectedValues={selectedTransfer}
                    onChange={handleTransferChange}
                    onSelectAll={() => update('transfer', 'ALL')}
                    color="slate"
                />
            )}

            {/* BOUTON RESET */}
            {activeFiltersCount > 0 && (
                <button 
                    onClick={clear}
                    className="ml-auto text-[10px] font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 uppercase transition-colors whitespace-nowrap bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:border-rose-200"
                >
                    <RefreshCw size={12} /> <span className="hidden sm:inline">Réinitialiser</span>
                </button>
            )}
        </div>
    </div>
  );
};
