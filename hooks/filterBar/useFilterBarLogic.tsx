/**
 * @file Hook de logique métier pour la barre de filtres d'opérations
 * @description Centralise toute la logique de calcul, configuration et handlers
 * des filtres (boutons cycliques, dropdowns multi-sélection, états d'activité).
 * Permet de séparer la logique métier de l'UI pour un composant FilterBar épuré.
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion de l'état `showAllFilters` (affichage filtres avancés)
 * - Configuration des boutons cycliques (Flux, Statut, Source, Extra)
 * - Handlers des dropdowns multi-sélection (Comptes, Salaires, etc.)
 * - Calculs d'activité des filtres (détection changements par rapport au défaut)
 * - Fonction de réinitialisation globale
 *
 * **Boutons cycliques :**
 * Chaque bouton a 3 états possibles qui cyclent dans un ordre défini.
 * La configuration retourne `{ label, icon, color }` selon l'état actuel.
 *
 * **Dropdowns multi-sélection :**
 * - Comptes : [] = tous sélectionnés (optimisation)
 * - Salaires/Virements : États binaires + "Tous"
 * - Bénéficiaires : [] = tous sélectionnés (optimisation)
 *
 * **Détection d'activité :**
 * Compare les valeurs actuelles avec les défauts pour afficher badges/indicateurs.
 * Considère les optimisations ([] = tous vs sélection explicite).
 *
 * @example
 * ```tsx
 * const {
 *   showAllFilters,
 *   setShowAllFilters,
 *   fluxConfig,
 *   cycleFlux,
 *   // ... autres configs
 *   activeFiltersCount,
 *   handleAccountChange,
 *   clear
 * } = useFilterBarLogic(filters, onFilterChange, accounts, people, onReset);
 *
 * return (
 *   <div>
 *     <CyclicFilterButton {...fluxConfig} onClick={cycleFlux} />
 *     <FilterDropdown options={accountOptions} onChange={handleAccountChange} />
 *   </div>
 * );
 * ```
 */
import React, { useState } from "react";
import {
  Star,
  Clock,
  CalendarClock,
  CheckCircle2,
  ArrowRightLeft,
  Briefcase,
  TrendingDown,
  TrendingUp,
  List,
  Circle,
  Wallet,
  Layers,
  ShoppingBag,
  ListFilter,
  Users,
  FolderOpen,
} from "lucide-react";
import { OperationFilters, Account, Person, AccountType, CategoryDef } from "../../types";
import { FilterOption } from "../../components/ui/molecules/FilterDropdown";
import { buildOperationsFilters } from "../../services/financeUtils";

/**
 * Configuration d'un bouton cyclique (label, icône, couleur).
 */
export interface CyclicButtonConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

/**
 * Hook de gestion de la logique métier de la barre de filtres.
 *
 * @param {OperationFilters} filters - État actuel des filtres
 * @param {Function} onFilterChange - Callback de mise à jour des filtres
 * @param {Account[]} accounts - Liste des comptes bancaires
 * @param {Person[]} people - Liste des bénéficiaires/membres
 * @param {CategoryDef[]} categories - Liste des catégories avec sous-catégories
 * @param {Function} [onReset] - Callback optionnel de réinitialisation personnalisée
 * @returns {Object} Configurations, handlers et états pour l'UI
 */
export const useFilterBarLogic = (
  filters: OperationFilters,
  onFilterChange: (filters: OperationFilters) => void,
  accounts: Account[],
  people: Person[],
  categories: CategoryDef[] = [],
  availableCategoryIds: string[] = [],
  availableSubCategoryIds: string[] = [],
  onReset?: () => void
) => {
  const [showAllFilters, setShowAllFilters] = useState(false);

  /**
   * Met à jour une propriété unique des filtres.
   */
  const update = <K extends keyof OperationFilters>(key: K, value: OperationFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  /**
   * Réinitialise tous les filtres aux valeurs par défaut.
   *
   * @description
   * Utilise `onReset` si fourni, sinon applique les défauts standards :
   * - flux: "ALL" (tous les types d'opérations)
   * - source: "VARIABLE" (focus sur les opérations courantes)
   * - status: "REAL" (uniquement les opérations pointées)
   * - extra: "EXCLUDE" (exclure les opérations hors budget)
   * - salary: "EXCLUDE" (exclure les salaires structurels)
   * - Réinitialisation de tous les multi-sélecteurs ([], "ALL")
   */
  const clear = () => {
    if (onReset) {
      onReset();
    } else {
      onFilterChange(buildOperationsFilters({}) as OperationFilters);
    }
  };

  // --- CONFIGURATION DES BOUTONS CYCLIQUES ---

  /**
   * Cycle l'état du filtre Flux dans l'ordre : Tous → Dépenses → Revenus → Remboursements → Tous.
   */
  const cycleFlux = () => {
    const next = filters.flux === "ALL" ? "EXPENSE" : filters.flux === "EXPENSE" ? "INCOME" : filters.flux === "INCOME" ? "REFUND" : "ALL";
    update("flux", next as OperationFilters["flux"]);
  };

  /**
   * Retourne la configuration UI du bouton Flux selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getFluxConfig = (): CyclicButtonConfig => {
    switch (filters.flux) {
      case "EXPENSE":
        return { label: "Dépenses", icon: <TrendingDown size={14} />, color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" };
      case "INCOME":
        return { label: "Revenus", icon: <TrendingUp size={14} />, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" };
      case "REFUND":
        return { label: "Remboursements", icon: <TrendingUp size={14} />, color: "bg-rose-100 text-rose-700 hover:bg-rose-200" };
      default:
        return {
          label: "Flux: Tous",
          icon: <ArrowRightLeft size={14} />,
          color: "bg-slate-100 text-slate-500 hover:bg-slate-200",
        };
    }
  };

  /**
   * Cycle l'état du filtre Statut dans l'ordre : Tous → Réel → En attente → Tous.
   */
  const cycleStatus = () => {
    const next = filters.status === "ALL" ? "REAL" : filters.status === "REAL" ? "WAITING" : "ALL";
    update("status", next);
  };

  /**
   * Retourne la configuration UI du bouton Statut selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getStatusConfig = (): CyclicButtonConfig => {
    switch (filters.status) {
      case "REAL":
        return { label: "Réel (Pointé)", icon: <CheckCircle2 size={14} />, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" };
      case "WAITING":
        return { label: "En attente", icon: <Clock size={14} />, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" };
      default:
        return {
          label: "Statut: Tous",
          icon: <ListFilter size={14} />,
          color: "bg-slate-100 text-slate-500 hover:bg-slate-200",
        };
    }
  };

  /**
   * Cycle l'état du filtre Source dans l'ordre : Variable → Récurrent → Toutes → Variable.
   */
  const cycleSource = () => {
    const next = filters.source === "VARIABLE" ? "RECURRING" : filters.source === "RECURRING" ? "ALL" : "VARIABLE";
    update("source", next);
  };

  /**
   * Retourne la configuration UI du bouton Source selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getSourceConfig = (): CyclicButtonConfig => {
    switch (filters.source) {
      case "RECURRING":
        return { label: "Récurrent", icon: <CalendarClock size={14} />, color: "bg-sky-100 text-sky-700 hover:bg-sky-200" };
      case "VARIABLE":
        return { label: "Variable", icon: <ShoppingBag size={14} />, color: "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200" };
      default:
        return {
          label: "Source: Toutes",
          icon: <List size={14} />,
          color: "bg-slate-100 text-slate-500 hover:bg-slate-200",
        };
    }
  };

  /**
   * Cycle l'état du filtre Extra dans l'ordre : Tout → Standard → Extra → Tout.
   *
   * @description
   * - "ALL" : Affiche toutes les opérations (standard + extra)
   * - "EXCLUDE" : Affiche uniquement les opérations standard (dans le budget)
   * - "ONLY" : Affiche uniquement les opérations extra (hors budget)
   */
  const cycleExtra = () => {
    const next = filters.nature === "ALL" ? "EXCLUDE" : filters.nature === "EXCLUDE" ? "ONLY" : "ALL";
    update("nature", next);
  };

  /**
   * Retourne la configuration UI du bouton Extra selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getExtraConfig = (): CyclicButtonConfig => {
    switch (filters.nature) {
      case "EXCLUDE":
        return { label: "Standard", icon: <Circle size={14} />, color: "bg-slate-200 text-slate-600 hover:bg-slate-300" };
      case "ONLY":
        return { label: "Extras", icon: <Star size={14} />, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" };
      default:
        return {
          label: "Nature: Tout",
          icon: <Layers size={14} />,
          color: "bg-slate-100 text-slate-500 hover:bg-slate-200",
        };
    }
  };

  // --- CONFIGURATION DES DROPDOWNS (Multi-sélection) ---

  /**
   * Options du dropdown Comptes (uniquement les comptes courants).
   */
  const accountOptions: FilterOption[] = accounts.filter((a) => a.type === AccountType.CHECKING).map((a) => ({ id: a.id, label: a.name }));

  /**
   * IDs visuels pour le dropdown Comptes.
   *
   * @description
   * Optimisation : `[]` signifie "tous sélectionnés" en interne,
   * mais visuellement on affiche tous les IDs pour UX cohérente.
   */
  const allAccountIds = accountOptions.map((o) => o.id);
  const visualAccountIds = !filters.isAccountFilterActive && filters.accountIds.length === 0 ? allAccountIds : filters.accountIds;

  const handleAccountChange = (ids: string[]) => {
    if (ids.length === allAccountIds.length) {
      onFilterChange({ ...filters, accountIds: [], isAccountFilterActive: false });
    } else {
      onFilterChange({ ...filters, accountIds: ids, isAccountFilterActive: true });
    }
  };

  /**
   * Options du dropdown Catégories — uniquement celles ayant des opérations ce mois-ci.
   */
  const categoryOptions: FilterOption[] = categories
    .filter((c) => availableCategoryIds.includes(c.id))
    .map((c) => ({
      id: c.id,
      label: c.name,
      icon: <FolderOpen size={14} className="text-slate-400" />,
    }));

  /**
   * IDs visuels pour le dropdown Catégories.
   */
  const allCategoryIds = categoryOptions.map((o) => o.id);
  const visualCategoryIds = !filters.isCategoryFilterActive && filters.includedCategoryIds.length === 0 ? allCategoryIds : filters.includedCategoryIds;

  const handleCategoryChange = (ids: string[]) => {
    if (ids.length === allCategoryIds.length) {
      onFilterChange({ ...filters, includedCategoryIds: [], isCategoryFilterActive: false });
    } else {
      onFilterChange({ ...filters, includedCategoryIds: ids, isCategoryFilterActive: true });
    }
  };

  /**
   * Options du dropdown Sous-Catégories.
   *
   * @description
   * Limité aux sous-catégories des catégories sélectionnées (ou toutes si aucune
   * sélection), et uniquement celles ayant au moins une opération ce mois-ci.
   */
  const parentCatsForSub =
    filters.includedCategoryIds.length > 0
      ? categories.filter((c) => filters.includedCategoryIds.includes(c.id))
      : categories.filter((c) => availableCategoryIds.includes(c.id));

  const subCategoryOptions: FilterOption[] = parentCatsForSub.flatMap((c) =>
    (c.subCategories || [])
      .filter((sc) => availableSubCategoryIds.includes(sc.id))
      .map((sc) => ({
        id: sc.id,
        label: `${sc.name}`,
        icon: <FolderOpen size={14} className="text-slate-400" />,
      }))
  );

  /**
   * IDs visuels pour le dropdown Sous-Catégories.
   */
  const allSubCategoryIds = subCategoryOptions.map((o) => o.id);
  const visualSubCategoryIds =
    !filters.isSubCategoryFilterActive && filters.includedSubCategoryIds.length === 0 ? allSubCategoryIds : filters.includedSubCategoryIds;

  const handleSubCategoryChange = (ids: string[]) => {
    if (ids.length === allSubCategoryIds.length) {
      onFilterChange({ ...filters, includedSubCategoryIds: [], isSubCategoryFilterActive: false });
    } else {
      onFilterChange({ ...filters, includedSubCategoryIds: ids, isSubCategoryFilterActive: true });
    }
  };

  /**
   * Options du dropdown Bénéficiaires avec icône selon type (enfant/adulte).
   */
  const benOptions: FilterOption[] = people.map((p) => ({
    id: p.id,
    label: p.name,
    icon: p.isChild ? <Users size={14} className="text-indigo-400" /> : <Users size={14} className="text-slate-400" />,
  }));

  /**
   * IDs visuels pour le dropdown Bénéficiaires (optimisation similaire aux comptes).
   */
  const allBenIds = benOptions.map((o) => o.id);
  const visualBenIds = !filters.isBeneficiaryFilterActive && filters.beneficiaryIds.length === 0 ? allBenIds : filters.beneficiaryIds;

  const handleBenChange = (ids: string[]) => {
    if (ids.length === allBenIds.length) {
      onFilterChange({ ...filters, beneficiaryIds: [], isBeneficiaryFilterActive: false });
    } else {
      onFilterChange({ ...filters, beneficiaryIds: ids, isBeneficiaryFilterActive: true });
    }
  };

  /**
   * Options du dropdown Salaires (binaire : Autres/Salaires).
   */
  const salaryOptions: FilterOption[] = [
    { id: "OTHER", label: "Autres flux", icon: <Wallet size={14} className="text-slate-400" /> },
    { id: "SALARY", label: "Salaires", icon: <Briefcase size={14} className="text-emerald-600" /> },
  ];

  /**
   * Sélection visuelle actuelle pour le dropdown Salaires.
   */
  const selectedSalary = filters.salary === "ALL" ? ["OTHER", "SALARY"] : filters.salary === "ONLY" ? ["SALARY"] : filters.salary === "NONE" ? [] : ["OTHER"];

  const handleSalaryChange = (ids: string[]) => {
    if (ids.length === 2) update("salary", "ALL");
    else if (ids.length === 0) update("salary", "NONE");
    else if (ids[0] === "SALARY") update("salary", "ONLY");
    else update("salary", "EXCLUDE");
  };

  // --- DÉTECTION D'ACTIVITÉ DES FILTRES ---

  /**
   * Détecte si le filtre Extra est actif (différent du défaut "ALL").
   */
  const isExtraActive = filters.nature !== "ALL";

  /**
   * Détecte si le filtre Salaires est actif (différent du défaut "EXCLUDE").
   */
  const isSalaryActive = filters.salary !== "EXCLUDE";

  /**
   * Détecte si le filtre Source est actif (différent du défaut "ALL").
   */
  const isSourceActive = filters.source !== "ALL";

  /**
   * Détecte si le filtre Flux est actif (différent du défaut "ALL").
   */
  const isFluxActive = filters.flux !== "ALL";

  /**
   * Détecte si le filtre Comptes est actif (sélection explicite).
   */
  const isAccountActive = filters.isAccountFilterActive || filters.accountIds.length > 0;

  /**
   * Détecte si le filtre Catégories est actif (sélection explicite).
   */
  const isCategoryActive = filters.isCategoryFilterActive || filters.includedCategoryIds.length > 0;

  /**
   * Détecte si le filtre Sous-Catégories est actif (sélection explicite).
   */
  const isSubCategoryActive = filters.isSubCategoryFilterActive || filters.includedSubCategoryIds.length > 0;

  /**
   * Détecte si au moins un filtre secondaire (avancé) est actif.
   */
  const hasActiveSecondary = isSalaryActive || isAccountActive || isFluxActive || isCategoryActive || isSubCategoryActive;

  /**
   * Compte total des filtres actifs pour le badge global.
   *
   * @description
   * Inclut les filtres primaires (Flux, Source, Extra, Statut) et l'indicateur
   * de présence de filtres secondaires (compte comme 1 si actifs).
   */
  const activeFiltersCount = [filters.flux !== "ALL", isSourceActive, isExtraActive, filters.status !== "ALL", hasActiveSecondary].filter(Boolean).length;

  /**
   * Détecte si les filtres sont dans leur état par défaut.
   *
   * @description
   * Vérifie si tous les filtres correspondent à l'état initial de l'application :
   * - Flux: Tous
   * - Source: Variable (pas Toutes !)
   * - Statut: Réel/Pointé (pas Tous !)
   * - Nature: Standard (pas Tout !)
   * - Salaires: Exclus
   * - Aucune sélection de comptes/bénéficiaires
   *
   * @returns {boolean} True si filtres par défaut, False si modifiés
   */
  const DEFAULT = buildOperationsFilters({});
  const isDefaultFilters =
    filters.flux === DEFAULT.flux &&
    filters.source === DEFAULT.source &&
    filters.status === DEFAULT.status &&
    filters.nature === DEFAULT.nature &&
    filters.salary === DEFAULT.salary &&
    filters.accountIds.length === 0 &&
    !filters.isAccountFilterActive &&
    filters.beneficiaryIds.length === 0 &&
    !filters.isBeneficiaryFilterActive &&
    filters.includedCategoryIds.length === 0 &&
    !filters.isCategoryFilterActive &&
    filters.includedSubCategoryIds.length === 0 &&
    !filters.isSubCategoryFilterActive;

  return {
    // État UI
    showAllFilters,
    setShowAllFilters,

    // Configurations boutons cycliques
    fluxConfig: getFluxConfig(),
    cycleFlux,
    statusConfig: getStatusConfig(),
    cycleStatus,
    sourceConfig: getSourceConfig(),
    cycleSource,
    extraConfig: getExtraConfig(),
    cycleExtra,

    // Options et handlers dropdowns
    accountOptions,
    visualAccountIds,
    handleAccountChange,
    categoryOptions,
    visualCategoryIds,
    handleCategoryChange,
    subCategoryOptions,
    visualSubCategoryIds,
    handleSubCategoryChange,
    benOptions,
    visualBenIds,
    handleBenChange,
    salaryOptions,
    selectedSalary,
    handleSalaryChange,
    // Indicateurs d'activité
    isExtraActive,
    isSalaryActive,
    isSourceActive,
    isFluxActive,
    isAccountActive,
    isCategoryActive,
    isSubCategoryActive,
    hasActiveSecondary,
    activeFiltersCount,
    isDefaultFilters,

    // Actions globales
    clear,
    update,
  };
};
