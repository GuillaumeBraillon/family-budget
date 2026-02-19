/**
 * @file Hook de gestion des filtres d'opérations avec persistance
 * @description Centralise toute la logique de filtrage des opérations (dépenses/revenus)
 * avec sauvegarde automatique des préférences dans localStorage. Gère l'initialisation
 * depuis des filtres fournis en props (navigation contextuelle depuis Dashboard).
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion de l'état des filtres (flux, source, statut, tags, comptes, bénéficiaires)
 * - Persistance automatique dans localStorage (clé : `operationsView_filters`)
 * - Initialisation depuis filtres externes (props `initialFilters`)
 * - Réinitialisation aux valeurs par défaut
 *
 * **Persistance :**
 * Les filtres sont sauvegardés automatiquement à chaque modification pour restaurer
 * l'état de filtrage lors du retour sur la vue après navigation.
 *
 * **Navigation contextuelle :**
 * Lorsqu'un utilisateur clique sur une carte du Dashboard (ex: "Dépenses Extra"),
 * les `initialFilters` sont injectés pour afficher immédiatement la vue filtrée.
 *
 * @dependencies
 * - types.ts : OperationFilters
 */
import { useState, useEffect } from "react";
import { OperationFilters } from "../../types";

/**
 * Valeurs par défaut des filtres d'opérations.
 *
 * @description
 * Configuration standard de filtrage privilégiant la visibilité des opérations courantes :
 * - **flux**: "ALL" → Afficher dépenses ET revenus
 * - **source**: "VARIABLE" → Focus sur les transactions variables (suivi réel)
 * - **status**: "REAL" → Opérations pointées uniquement (pas les "en attente")
 * - **nature**: "EXCLUDE" → Exclure les dépenses hors budget (vue budget normal)
 * - **transfer**: "EXCLUDE" → Masquer les virements internes (mouvements entre comptes)
 * - **salary**: "EXCLUDE" → Masquer les salaires (revenus structurels)
 * - **accountIds**: [] → Tous les comptes (pas de filtrage)
 * - **beneficiaryIds**: [] → Tous les bénéficiaires
 * - **includedTagIds**: [] → Pas de filtrage par tags inclus
 * - **excludedTagIds**: [] → Pas de filtrage par tags exclus
 * - **tagPresence**: "ALL" → Afficher avec ou sans tags
 *
 * **Cas d'usage typiques :**
 * - Vue "Budget mensuel" : Voir toutes les dépenses variables réelles
 * - Vue "Suivi Extra" : Changer `nature` à "ONLY" pour voir uniquement hors budget
 * - Vue "Revenus" : Changer `flux` à "INCOME" + `source` à "ALL"
 * - Vue "En attente" : Changer `status` à "WAITING"
 *
 * @constant
 * @type {OperationFilters}
 */
const DEFAULT_FILTERS: OperationFilters = {
  flux: "ALL",
  source: "VARIABLE",
  status: "REAL",
  nature: "EXCLUDE",
  transfer: "EXCLUDE",
  salary: "EXCLUDE",
  accountIds: [],
  beneficiaryIds: [],
  includedTagIds: [],
  excludedTagIds: [],
  tagPresence: "ALL",
};

/**
 * Hook de gestion des filtres d'opérations avec persistance localStorage.
 *
 * @description
 * Gère l'état complet des filtres de la vue Opérations avec trois modes d'initialisation :
 *
 * **1. Initialisation par défaut (premier chargement) :**
 * ```tsx
 * const { filters } = useOperationsFilters();
 * // filters = DEFAULT_FILTERS
 * ```
 *
 * **2. Restauration depuis localStorage :**
 * Si l'utilisateur a déjà filtré les opérations, ses préférences sont restaurées
 * automatiquement au retour sur la vue.
 *
 * **3. Navigation contextuelle (Dashboard → Opérations) :**
 * ```tsx
 * // Depuis Dashboard : Clic sur "Dépenses Extra"
 * onNavigateToPlanner(currentDate, { nature: "ONLY" });
 *
 * // Dans OperationsView :
 * const { filters } = useOperationsFilters({ nature: "ONLY" });
 * // filters.nature sera "ONLY" au chargement initial UNIQUEMENT
 * // Si l'utilisateur revient plus tard, ses filtres personnalisés sont préservés
 * ```
 *
 * **Persistance automatique :**
 * Chaque modification de filtres via `setFilters` déclenche une sauvegarde dans
 * localStorage (clé : `operationsView_filters`). Les préférences survivent aux
 * rechargements de page et changements de navigation.
 *
 * **IMPORTANT - Gestion des initialFilters :**
 * Les `initialFilters` sont appliqués UNIQUEMENT lors du premier montage du composant.
 * Si l'utilisateur quitte la vue puis revient, ses filtres personnalisés sont préservés
 * depuis localStorage, et les `initialFilters` sont ignorés. Cela évite d'écraser
 * les réglages de l'utilisateur à chaque navigation.
 *
 * **Réinitialisation :**
 * ```tsx
 * const { resetFilters } = useOperationsFilters();
 * resetFilters(); // Retour à DEFAULT_FILTERS + suppression localStorage
 * ```
 *
 * **Gestion des erreurs :**
 * Si les données localStorage sont corrompues (JSON invalide), le hook revient
 * automatiquement aux `DEFAULT_FILTERS` sans planter l'application.
 *
 * @param {Partial<OperationFilters>} [initialFilters] - Filtres initiaux pour navigation contextuelle
 * @returns {Object} Interface de gestion des filtres
 * @returns {OperationFilters} filters - État actuel des filtres (reactive)
 * @returns {function(OperationFilters): void} setFilters - Modifier les filtres (+ sauvegarde auto)
 * @returns {function(): void} resetFilters - Réinitialiser aux valeurs par défaut
 *
 * @example
 * ```tsx
 * // Cas 1 : Usage standard
 * const { filters, setFilters } = useOperationsFilters();
 *
 * // Modifier un filtre
 * setFilters({ ...filters, nature: "ONLY" });
 *
 * // Cas 2 : Navigation contextuelle (depuis Dashboard)
 * const { filters } = useOperationsFilters({ nature: "ONLY", flux: "EXPENSE" });
 * // Premier montage : filters = { ...localStorage ou DEFAULT_FILTERS, nature: "ONLY", flux: "EXPENSE" }
 * // Retour ultérieur : filters = localStorage (initialFilters ignorés)
 *
 * // Cas 3 : Réinitialisation
 * const { resetFilters } = useOperationsFilters();
 * <button onClick={resetFilters}>Réinitialiser les filtres</button>
 * ```
 *
 * @workflow
 * 1. **Initialisation (premier render)** :
 *    - Lecture localStorage → Si trouvé, parse JSON
 *    - Si erreur/absent → DEFAULT_FILTERS
 *    - Application de initialFilters par dessus si fourni (une seule fois)
 * 2. **Modifications utilisateur** :
 *    - setFilters(newFilters) → État React + localStorage
 * 3. **Navigation sortante puis retour** :
 *    - Restauration automatique depuis localStorage (initialFilters ignorés)
 * 4. **Réinitialisation** :
 *    - resetFilters() → DEFAULT_FILTERS + clear localStorage
 */
export const useOperationsFilters = (initialFilters?: Partial<OperationFilters>) => {
  // Ref pour tracker si les initialFilters ont déjà été appliqués
  // Initialisation avec restauration depuis localStorage
  const [filters, setFilters] = useState<OperationFilters>(() => {
    const saved = localStorage.getItem("operationsView_filters");
    let baseFilters = DEFAULT_FILTERS;

    if (saved) {
      try {
        baseFilters = JSON.parse(saved);
      } catch {
        // Données corrompues → Retour aux défauts
        baseFilters = DEFAULT_FILTERS;
      }
    }

    // Appliquer initialFilters uniquement au premier montage
    if (initialFilters) {
      return { ...baseFilters, ...initialFilters };
    }

    return baseFilters;
  });

  // SUPPRIMÉ : Le useEffect qui réappliquait les initialFilters à chaque changement
  // Maintenant les initialFilters sont appliqués uniquement dans le useState initial

  // Persistance automatique à chaque modification
  useEffect(() => {
    localStorage.setItem("operationsView_filters", JSON.stringify(filters));
  }, [filters]);

  /**
   * Réinitialise les filtres aux valeurs par défaut.
   *
   * @description
   * Restaure `DEFAULT_FILTERS` et supprime la clé localStorage pour éviter
   * une restauration ultérieure des anciens filtres.
   *
   * **Cas d'usage :**
   * - Bouton "Réinitialiser" dans la FilterBar
   * - Retour à une vue "propre" après des filtres complexes
   * - Debug : vider les préférences stockées
   *
   * @example
   * ```tsx
   * <button onClick={resetFilters} className="text-sm text-indigo-600">
   *   Réinitialiser les filtres
   * </button>
   * ```
   */
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    localStorage.removeItem("operationsView_filters"); // Nettoyage explicite
  };

  return {
    filters,
    setFilters,
    resetFilters,
  };
};
