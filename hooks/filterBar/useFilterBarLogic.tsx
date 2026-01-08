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
 * - Handlers des dropdowns multi-sélection (Comptes, Tags, Salaires, etc.)
 * - Calculs d'activité des filtres (détection changements par rapport au défaut)
 * - Fonction de réinitialisation globale
 *
 * **Boutons cycliques :**
 * Chaque bouton a 3 états possibles qui cyclent dans un ordre défini.
 * La configuration retourne `{ label, icon, color }` selon l'état actuel.
 *
 * **Dropdowns multi-sélection :**
 * - Comptes : [] = tous sélectionnés (optimisation)
 * - Tags : Tri-state (inclus/exclus/neutre) avec mode présence
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
 * } = useFilterBarLogic(filters, onFilterChange, accounts, people, tags, onReset);
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
} from "lucide-react";
import { OperationFilters, Account, Person, AccountType, Tag as TagType } from "../../types";
import { FilterOption } from "../../components/ui/molecules/FilterDropdown";

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
 * @param {TagType[]} tags - Liste des tags de ventilation
 * @param {Function} [onReset] - Callback optionnel de réinitialisation personnalisée
 * @returns {Object} Configurations, handlers et états pour l'UI
 */
export const useFilterBarLogic = (
  filters: OperationFilters,
  onFilterChange: (filters: OperationFilters) => void,
  accounts: Account[],
  people: Person[],
  tags: TagType[] = [],
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
   * - transfer: "EXCLUDE" (exclure les virements internes)
   * - salary: "EXCLUDE" (exclure les salaires structurels)
   * - Réinitialisation de tous les multi-sélecteurs ([], "ALL")
   */
  const clear = () => {
    if (onReset) {
      onReset();
    } else {
      onFilterChange({
        flux: "ALL",
        source: "VARIABLE",
        status: "REAL",
        extra: "EXCLUDE",
        transfer: "EXCLUDE",
        salary: "EXCLUDE",
        accountIds: [],
        beneficiaryIds: [],
        includedTagIds: [],
        excludedTagIds: [],
        tagPresence: "ALL",
      });
    }
  };

  // --- CONFIGURATION DES BOUTONS CYCLIQUES ---

  /**
   * Cycle l'état du filtre Flux dans l'ordre : Tous → Dépenses → Revenus → Tous.
   */
  const cycleFlux = () => {
    const next = filters.flux === "ALL" ? "EXPENSE" : filters.flux === "EXPENSE" ? "INCOME" : "ALL";
    update("flux", next);
  };

  /**
   * Retourne la configuration UI du bouton Flux selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getFluxConfig = (): CyclicButtonConfig => {
    switch (filters.flux) {
      case "EXPENSE":
        return { label: "Dépenses", icon: <TrendingDown size={14} />, color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" };
      case "INCOME":
        return { label: "Revenus", icon: <TrendingUp size={14} />, color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" };
      default:
        return {
          label: "Flux: Tous",
          icon: <ArrowRightLeft size={14} />,
          color: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
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
        return { label: "Réel (Pointé)", icon: <CheckCircle2 size={14} />, color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" };
      case "WAITING":
        return { label: "En attente", icon: <Clock size={14} />, color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" };
      default:
        return {
          label: "Statut: Tous",
          icon: <ListFilter size={14} />,
          color: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
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
        return { label: "Récurrent", icon: <CalendarClock size={14} />, color: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100" };
      case "VARIABLE":
        return { label: "Variable", icon: <ShoppingBag size={14} />, color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100" };
      default:
        return {
          label: "Source: Toutes",
          icon: <List size={14} />,
          color: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
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
    const next = filters.extra === "ALL" ? "EXCLUDE" : filters.extra === "EXCLUDE" ? "ONLY" : "ALL";
    update("extra", next);
  };

  /**
   * Retourne la configuration UI du bouton Extra selon l'état actuel.
   *
   * @returns {CyclicButtonConfig} Configuration { label, icon, color }
   */
  const getExtraConfig = (): CyclicButtonConfig => {
    switch (filters.extra) {
      case "EXCLUDE":
        return { label: "Standard", icon: <Circle size={14} />, color: "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200" };
      case "ONLY":
        return { label: "Extras", icon: <Star size={14} />, color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" };
      default:
        return {
          label: "Nature: Tout",
          icon: <Layers size={14} />,
          color: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
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
  const visualAccountIds = filters.accountIds.length === 0 ? allAccountIds : filters.accountIds;

  /**
   * Handler du dropdown Comptes.
   *
   * @description
   * - Si tous sélectionnés → Stocke `[]` (optimisation)
   * - Sinon → Stocke la sélection explicite
   */
  const handleAccountChange = (ids: string[]) => {
    if (ids.length === allAccountIds.length) update("accountIds", []);
    else update("accountIds", ids);
  };

  /**
   * Options du dropdown Tags avec couleurs visuelles.
   */
  const tagOptions: FilterOption[] = tags.map((t) => ({
    id: t.id,
    label: t.name,
    color: t.color,
    icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />,
  }));

  /**
   * Handler tri-state des Tags (inclus/exclus/neutre).
   *
   * @param {string} id - ID du tag
   * @param {"INCLUDE" | "EXCLUDE" | null} state - Nouvel état
   *
   * @description
   * - "INCLUDE" : Tag doit être présent (ajoute à `includedTagIds`)
   * - "EXCLUDE" : Tag doit être absent (ajoute à `excludedTagIds`)
   * - null : Neutre (retire des deux listes)
   *
   * **Logique spéciale :** Si on inclut un tag alors que `tagPresence = "WITHOUT_TAGS"`,
   * bascule automatiquement en "WITH_TAGS" pour cohérence.
   */
  const handleTagTriStateChange = (id: string, state: "INCLUDE" | "EXCLUDE" | null) => {
    let newIncluded = [...filters.includedTagIds];
    let newExcluded = [...filters.excludedTagIds];

    newIncluded = newIncluded.filter((tid) => tid !== id);
    newExcluded = newExcluded.filter((tid) => tid !== id);

    if (state === "INCLUDE") {
      newIncluded.push(id);
      if (filters.tagPresence === "WITHOUT_TAGS") update("tagPresence", "WITH_TAGS");
    } else if (state === "EXCLUDE") {
      newExcluded.push(id);
    }

    onFilterChange({
      ...filters,
      includedTagIds: newIncluded,
      excludedTagIds: newExcluded,
    });
  };

  /**
   * Handler du mode de présence des Tags.
   *
   * @param {"ALL" | "WITH_TAGS" | "WITHOUT_TAGS"} mode - Mode de présence
   *
   * @description
   * - "ALL" : Affiche toutes les opérations (avec ou sans tags)
   * - "WITH_TAGS" : Affiche uniquement les opérations taggées
   * - "WITHOUT_TAGS" : Affiche uniquement les opérations non taggées
   *
   * **Nettoyage :** Si passage en "WITHOUT_TAGS", vide `includedTagIds` (incompatible).
   */
  const handleTagPresenceChange = (mode: "ALL" | "WITH_TAGS" | "WITHOUT_TAGS") => {
    onFilterChange({
      ...filters,
      tagPresence: mode,
      includedTagIds: mode === "WITHOUT_TAGS" ? [] : filters.includedTagIds,
    });
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
  const visualBenIds = filters.beneficiaryIds.length === 0 ? allBenIds : filters.beneficiaryIds;

  /**
   * Handler du dropdown Bénéficiaires.
   */
  const handleBenChange = (ids: string[]) => {
    if (ids.length === allBenIds.length) update("beneficiaryIds", []);
    else update("beneficiaryIds", ids);
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
  const selectedSalary = filters.salary === "ALL" ? ["OTHER", "SALARY"] : filters.salary === "ONLY" ? ["SALARY"] : ["OTHER"];

  /**
   * Handler du dropdown Salaires.
   *
   * @description
   * - Tous/Aucun sélectionnés → "ALL"
   * - "SALARY" seul → "ONLY"
   * - "OTHER" seul → "EXCLUDE"
   */
  const handleSalaryChange = (ids: string[]) => {
    if (ids.length === 2 || ids.length === 0) update("salary", "ALL");
    else if (ids[0] === "SALARY") update("salary", "ONLY");
    else update("salary", "EXCLUDE");
  };

  /**
   * Options du dropdown Virements (binaire : Opérations/Virements).
   */
  const transferOptions: FilterOption[] = [
    { id: "STANDARD", label: "Opérations", icon: <Layers size={14} className="text-slate-400" /> },
    { id: "TRANSFER", label: "Virements", icon: <ArrowRightLeft size={14} className="text-indigo-500" /> },
  ];

  /**
   * Sélection visuelle actuelle pour le dropdown Virements.
   */
  const selectedTransfer = filters.transfer === "ALL" ? ["STANDARD", "TRANSFER"] : filters.transfer === "ONLY" ? ["TRANSFER"] : ["STANDARD"];

  /**
   * Handler du dropdown Virements.
   */
  const handleTransferChange = (ids: string[]) => {
    if (ids.length === 2 || ids.length === 0) update("transfer", "ALL");
    else if (ids[0] === "TRANSFER") update("transfer", "ONLY");
    else update("transfer", "EXCLUDE");
  };

  // --- DÉTECTION D'ACTIVITÉ DES FILTRES ---

  /**
   * Détecte si les filtres Tags sont actifs (différents du défaut).
   */
  const isTagsActive = filters.includedTagIds.length > 0 || filters.excludedTagIds.length > 0 || filters.tagPresence !== "ALL";

  /**
   * Détecte si le filtre Extra est actif (différent du défaut "ALL").
   */
  const isExtraActive = filters.extra !== "ALL";

  /**
   * Détecte si le filtre Salaires est actif (différent du défaut "EXCLUDE").
   */
  const isSalaryActive = filters.salary !== "EXCLUDE";

  /**
   * Détecte si le filtre Bénéficiaires est actif (sélection explicite).
   */
  const isBenActive = filters.beneficiaryIds.length > 0;

  /**
   * Détecte si le filtre Source est actif (différent du défaut "ALL").
   */
  const isSourceActive = filters.source !== "ALL";

  /**
   * Détecte si le filtre Virements est actif (différent du défaut "EXCLUDE").
   */
  const isTransferActive = filters.transfer !== "EXCLUDE";

  /**
   * Détecte si le filtre Comptes est actif (sélection explicite).
   */
  const isAccountActive = filters.accountIds.length > 0;

  /**
   * Détecte si au moins un filtre secondaire (avancé) est actif.
   */
  const hasActiveSecondary = isTagsActive || isSalaryActive || isBenActive || isTransferActive || isAccountActive;

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
   * - Virements: Exclus
   * - Salaires: Exclus
   * - Aucune sélection de comptes/bénéficiaires/tags
   *
   * @returns {boolean} True si filtres par défaut, False si modifiés
   */
  const isDefaultFilters =
    filters.flux === "ALL" &&
    filters.source === "VARIABLE" &&
    filters.status === "REAL" &&
    filters.extra === "EXCLUDE" &&
    filters.transfer === "EXCLUDE" &&
    filters.salary === "EXCLUDE" &&
    filters.accountIds.length === 0 &&
    filters.beneficiaryIds.length === 0 &&
    filters.includedTagIds.length === 0 &&
    filters.excludedTagIds.length === 0 &&
    filters.tagPresence === "ALL";

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
    tagOptions,
    handleTagTriStateChange,
    handleTagPresenceChange,
    benOptions,
    visualBenIds,
    handleBenChange,
    salaryOptions,
    selectedSalary,
    handleSalaryChange,
    transferOptions,
    selectedTransfer,
    handleTransferChange,

    // Indicateurs d'activité
    isTagsActive,
    isExtraActive,
    isSalaryActive,
    isBenActive,
    isSourceActive,
    isTransferActive,
    isAccountActive,
    hasActiveSecondary,
    activeFiltersCount,
    isDefaultFilters,

    // Actions globales
    clear,
    update,
  };
};
