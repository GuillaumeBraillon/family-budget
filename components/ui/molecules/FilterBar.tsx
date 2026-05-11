/**
 * @file Barre de filtres d'opérations refactorisée (Atomic Design)
 * @description Composant orchestrateur épuré qui compose les filtres primaires
 * (boutons cycliques), filtres secondaires (dropdowns) et logique métier déléguée
 * au hook `useFilterBarLogic`. Architecture modulaire avec composants atomiques.
 *
 * @architecture
 * **REFACTORISATION PHASE 5 :**
 * - Logique métier → `useFilterBarLogic` (450L)
 * - Boutons cycliques → `CyclicFilterButton` (atom réutilisable)
 * - Header → `FilterBarHeader` (molecule)
 * - Composant → Pure orchestration UI (80L, -81% vs original 431L)
 *
 * **Responsabilités restantes :**
 * - Layout et structure visuelle
 * - Composition des atoms et molecules
 * - Gestion de la visibilité conditionnelle (hiddenFilters)
 * - Rendu des dropdowns avec configurations du hook
 *
 * **Délégations :**
 * - État et handlers → `useFilterBarLogic`
 * - Configuration boutons → Hook
 * - Logique d'activité → Hook
 * - Calculs de sélection → Hook
 *
 * @example
 * ```tsx
 * <FilterBar
 *   filters={filters}
 *   onFilterChange={setFilters}
 *   accounts={accounts}
 *   people={people}
 *   tags={tags}
 *   hiddenFilters={["salary", "transfer"]}
 *   onReset={resetFilters}
 * />
 * ```
 */
import React from "react";
import { Tag } from "lucide-react";
import { OperationFilters, Account, Person, Tag as TagType, CategoryDef } from "../../../types";
import { FilterDropdown } from "./FilterDropdown";
import { CyclicFilterButton } from "../atoms/CyclicFilterButton";
import { ListSorter } from "./ListSorter";
import { useFilterBarLogic } from "../../../hooks/filterBar";

interface FilterBarProps {
  /** État actuel des filtres */
  filters: OperationFilters;
  /** Callback de mise à jour des filtres */
  onFilterChange: (filters: OperationFilters) => void;
  /** Liste des comptes bancaires */
  accounts: Account[];
  /** Liste des bénéficiaires/membres */
  people: Person[];
  /** Liste des tags de ventilation */
  tags?: TagType[];
  /** Liste des catégories */
  categories?: CategoryDef[];
  /** IDs des catégories utilisées ce mois-ci (source de vérité pour le dropdown) */
  availableCategoryIds?: string[];
  /** IDs des sous-catégories utilisées ce mois-ci */
  availableSubCategoryIds?: string[];
  /** Filtres à masquer (pour contextes spécifiques) */
  hiddenFilters?: ("flux" | "source" | "status" | "nature" | "salary" | "accounts" | "beneficiaries" | "tags" | "categories" | "subCategories")[];
  /** Callback optionnel de réinitialisation personnalisée */
  onReset?: () => void;
  /** Options de tri disponibles */
  sortOptions?: { key: string; label: string }[];
  /** Clé de tri actuelle */
  sortKey?: string;
  /** Ordre de tri actuel */
  sortOrder?: "asc" | "desc";
  /** Callback de changement de tri */
  onSortChange?: (key: string, order: "asc" | "desc") => void;
  /** Indique si on peut changer l'ordre de tri (false en mode manuel) */
  canToggleOrder?: boolean;
}

/**
 * Barre de filtres refactorisée avec composants atomiques.
 *
 * @description
 * Version simplifiée de FilterBar utilisant le hook `useFilterBarLogic` pour
 * toute la logique métier et des composants atomiques réutilisables pour l'UI.
 *
 * **Structure :**
 * 1. Header avec compteurs et actions (FilterBarHeader)
 * 2. Boutons cycliques (CyclicFilterButton x4)
 * 3. Panneau repliable de filtres avancés (dropdowns)
 *
 * **Filtres Primaires :**
 * - Bénéficiaires (multi-sélection)
 * - Source : Variable / Récurrent / Toutes
 * - Statut : Tous / Réel / En attente
 * - Nature : Tout / Standard / Extra
 *
 * **Filtres Secondaires (repliables) :**
 * - Flux : Tous / Dépenses / Revenus
 * - Comptes (multi-sélection)
 * - Tags (tri-state avec mode présence)
 * - Salaires (binaire)
 * - Virements (binaire)
 *
 * **Optimisations :**
 * - Hook mémoïsé évite recalculs inutiles
 * - Composants atomiques réutilisables
 * - Affichage conditionnel intelligent (hasActiveSecondary)
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  accounts,
  people,
  tags = [],
  categories = [],
  availableCategoryIds = [],
  availableSubCategoryIds = [],
  hiddenFilters = [],
  onReset,
  sortOptions,
  sortKey,
  sortOrder,
  onSortChange,
  canToggleOrder = true,
}) => {
  // Logique métier déléguée au hook
  const {
    showAllFilters,
    setShowAllFilters,
    fluxConfig,
    cycleFlux,
    statusConfig,
    cycleStatus,
    sourceConfig,
    cycleSource,
    extraConfig,
    cycleExtra,
    accountOptions,
    visualAccountIds,
    handleAccountChange,
    categoryOptions,
    visualCategoryIds,
    handleCategoryChange,
    subCategoryOptions,
    visualSubCategoryIds,
    handleSubCategoryChange,
    tagOptions,
    handleTagTriStateChange,
    handleTagPresenceChange,
    benOptions,
    visualBenIds,
    handleBenChange,
    salaryOptions,
    selectedSalary,
    handleSalaryChange,
    hasActiveSecondary,
    isDefaultFilters,
    clear,
    update,
    activeFiltersCount,
  } = useFilterBarLogic(filters, onFilterChange, accounts, people, tags, categories, availableCategoryIds, availableSubCategoryIds, onReset);

  return (
    <div className="flex flex-col gap-1">
      {/* HEADER + FILTRES PRIMAIRES */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* FILTRES PRIMAIRES - ordre personnalisé */}
          {!hiddenFilters.includes("source") && <CyclicFilterButton {...sourceConfig} onClick={cycleSource} />}
          {!hiddenFilters.includes("status") && <CyclicFilterButton {...statusConfig} onClick={cycleStatus} />}
          {!hiddenFilters.includes("nature") && <CyclicFilterButton {...extraConfig} onClick={cycleExtra} />}
          {!hiddenFilters.includes("flux") && <CyclicFilterButton {...fluxConfig} onClick={cycleFlux} />}

          {!hiddenFilters.includes("categories") && categoryOptions.length > 0 && (
            <FilterDropdown
              label="Catégories"
              icon={<Tag size={14} />}
              options={categoryOptions}
              selectedValues={visualCategoryIds}
              onChange={handleCategoryChange}
              onSelectAll={() => handleCategoryChange(categoryOptions.map((o) => o.id))}
            />
          )}

          {!hiddenFilters.includes("subCategories") && subCategoryOptions.length > 0 && (
            <FilterDropdown
              label="Sous-Cat."
              icon={<Tag size={14} />}
              options={subCategoryOptions}
              selectedValues={visualSubCategoryIds}
              onChange={handleSubCategoryChange}
              onSelectAll={() => handleSubCategoryChange(subCategoryOptions.map((o) => o.id))}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-indigo-50 rounded-full">{hasActiveSecondary ? `${activeFiltersCount} actifs` : ""}</span>

          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className={`h-[30px] px-3 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showAllFilters
                ? "bg-slate-800 text-white border-slate-800"
                : hasActiveSecondary
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {showAllFilters ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span className="hidden sm:inline">Fermer</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="9" x2="20" y2="9"></line>
                  <line x1="4" y1="15" x2="20" y2="15"></line>
                  <line x1="10" y1="3" x2="8" y2="21"></line>
                  <line x1="16" y1="3" x2="14" y2="21"></line>
                </svg>
                <span className="hidden sm:inline">Plus de filtres</span>
                {hasActiveSecondary && <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5"></span>}
              </>
            )}
          </button>

          <button
            onClick={clear}
            disabled={isDefaultFilters}
            className={`h-[30px] px-3 rounded-lg border text-[10px] font-black uppercase transition-colors flex items-center gap-1 ${
              isDefaultFilters
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-rose-100 bg-rose-50 text-rose-500 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
            }`}
            title={isDefaultFilters ? "Filtres déjà par défaut" : "Réinitialiser aux filtres par défaut"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>

          {/* SECTION TRI (à droite) */}
          {sortOptions && sortKey && sortOrder && onSortChange && (
            <ListSorter options={sortOptions} currentSort={sortKey} currentOrder={sortOrder} onSortChange={onSortChange} canToggleOrder={canToggleOrder} />
          )}
        </div>
      </div>

      {/* FILTRES SECONDAIRES (Repliables) */}
      {(showAllFilters || hasActiveSecondary) && (
        <div
          className={`flex flex-wrap items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-1 duration-200 ${
            !showAllFilters ? "hidden sm:flex" : ""
          }`}
        >
          <span className="text-[9px] font-bold text-slate-500 uppercase mr-1">Avancé :</span>

          {!hiddenFilters.includes("beneficiaries") && (
            <FilterDropdown
              label="Bénéficiaires"
              icon={<Tag size={14} />}
              options={benOptions}
              selectedValues={visualBenIds}
              onChange={handleBenChange}
              onSelectAll={() => handleBenChange(benOptions.map((o) => o.id))}
            />
          )}

          {!hiddenFilters.includes("accounts") && (
            <FilterDropdown
              label="Comptes"
              icon={<Tag size={14} />}
              options={accountOptions}
              selectedValues={visualAccountIds}
              onChange={handleAccountChange}
              onSelectAll={() => handleAccountChange(accountOptions.map((o) => o.id))}
            />
          )}

          {!hiddenFilters.includes("salary") && (
            <FilterDropdown
              label="Autres flux"
              icon={<Tag size={14} />}
              options={salaryOptions}
              selectedValues={selectedSalary}
              onChange={handleSalaryChange}
              onSelectAll={() => update("salary", "ALL")}
              color="emerald"
            />
          )}

          {!hiddenFilters.includes("tags") && tags.length > 0 && (
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
              onClear={() => onFilterChange({ ...filters, includedTagIds: [], excludedTagIds: [], tagPresence: "ALL" })}
              headerContent={
                <div className="flex bg-slate-100 p-0.5 rounded-lg mb-2">
                  <button
                    onClick={() => handleTagPresenceChange("ALL")}
                    className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${
                      filters.tagPresence === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => handleTagPresenceChange("WITH_TAGS")}
                    className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${
                      filters.tagPresence === "WITH_TAGS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Avec
                  </button>
                  <button
                    onClick={() => handleTagPresenceChange("WITHOUT_TAGS")}
                    className={`flex-1 py-1 rounded text-[9px] font-bold text-center transition-all ${
                      filters.tagPresence === "WITHOUT_TAGS" ? "bg-white text-rose-600 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Sans
                  </button>
                </div>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};
