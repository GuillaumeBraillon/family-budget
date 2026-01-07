/**
 * @file Hook des actions CRUD avec gestion automatique du rechargement
 * @description Centralise toutes les actions de création/modification/suppression des entités
 * budgétaires avec un pattern HOF (Higher-Order Function) pour le rechargement automatique
 * des données après chaque mutation.
 *
 * @architecture
 * **Principes appliqués :**
 * - **Composition fonctionnelle** : `wrapCrudWithReload` comme HOF
 * - **DRY (Don't Repeat Yourself)** : Logique de reload factorisée
 * - **Error handling centralisé** : Gestion uniforme des erreurs DB
 * - **Logging structuré** : Traçabilité complète des opérations
 *
 * **Pattern wrapper :**
 * ```
 * API Function → wrapCrudWithReload → Decorated Function
 *    ↓                    ↓                    ↓
 * apiUpsertConfig → [log + reload] → upsertConfig (exposé)
 * ```
 *
 * @dependencies
 * - services/api : Toutes les fonctions CRUD Supabase
 * - services/logger : Traçage des opérations
 * - services/errorFormatter : Formatage des erreurs DB
 */
import { logger } from "../../services/logger";
import { formatDatabaseError } from "../../services/errorFormatter";
import {
  apiToggleUserAuthorization,
  apiUpdateUserNotes,
  apiDeleteAuthorizedUser,
  apiUpsertConfig,
  apiDeleteConfig,
  apiUpsertIncome,
  apiDeleteIncome,
  apiUpsertCategory,
  apiDeleteCategory,
  apiUpsertPerson,
  apiDeletePerson,
  apiUpsertAccount,
  apiDeleteAccount,
  apiUpdateSettings,
  apiUpsertLabel,
  apiDeleteLabel,
  apiImportLabels,
  apiImportVirLabels,
  apiUpsertTag,
  apiDeleteTag,
} from "../../services/api";

/**
 * Hook des actions CRUD avec rechargement automatique.
 *
 * @description
 * Fournit toutes les actions CRUD nécessaires pour manipuler les entités budgétaires.
 * Chaque action est wrappée par `wrapCrudWithReload` pour :
 * - Logger l'opération (début/fin/erreur)
 * - Recharger silencieusement les données après succès
 * - Gérer les erreurs de manière centralisée
 *
 * **Avantages du pattern HOF :**
 * - Code DRY : logique de reload écrite une seule fois
 * - Testabilité : chaque fonction API peut être testée isolément
 * - Maintenabilité : ajout de nouvelles actions trivial
 *
 * @param {Function} loadData - Fonction de rechargement des données (mode silencieux)
 * @param {Function} setErrorMessage - Setter pour afficher les erreurs à l'utilisateur
 *
 * @returns {Object} Actions CRUD wrappées
 * @returns {Function} toggleUserAuthorization - Activer/désactiver un utilisateur
 * @returns {Function} updateUserNotes - Modifier les notes d'un utilisateur
 * @returns {Function} deleteAuthorizedUser - Supprimer un utilisateur autorisé
 * @returns {Function} upsertConfig - Créer/modifier une dépense récurrente
 * @returns {Function} deleteConfig - Supprimer une dépense récurrente
 * @returns {Function} upsertIncome - Créer/modifier un revenu récurrent
 * @returns {Function} deleteIncome - Supprimer un revenu récurrent
 * @returns {Function} upsertCategory - Créer/modifier une catégorie
 * @returns {Function} deleteCategory - Supprimer une catégorie
 * @returns {Function} upsertPerson - Créer/modifier une personne
 * @returns {Function} deletePerson - Supprimer une personne
 * @returns {Function} upsertAccount - Créer/modifier un compte
 * @returns {Function} deleteAccount - Supprimer un compte
 * @returns {Function} upsertLabel - Créer/modifier un libellé sauvegardé
 * @returns {Function} deleteLabel - Supprimer un libellé
 * @returns {Function} importLabels - Importer les libellés CB depuis paid_items
 * @returns {Function} importVirLabels - Importer les libellés VIR depuis paid_items
 * @returns {Function} upsertTag - Créer/modifier un tag
 * @returns {Function} deleteTag - Supprimer un tag
 *
 * @example
 * ```tsx
 * const actions = useBudgetActions(loadData, setErrorMessage);
 *
 * // Créer une nouvelle dépense récurrente
 * await actions.upsertConfig({
 *   id: 'exp_new',
 *   label: 'Loyer',
 *   amount: 800,
 *   // ... autres champs
 * });
 * // → API call + reload automatique + error handling
 *
 * // Supprimer une catégorie
 * await actions.deleteCategory('cat_123');
 * // → API call + reload automatique + error handling
 * ```
 */
export const useBudgetActions = (loadData: (silent?: boolean) => Promise<void>, setErrorMessage: (message: string | null) => void) => {
  /**
   * Wrapper HOF pour les opérations CRUD avec rechargement automatique.
   *
   * @description
   * Pattern de composition fonctionnelle qui décore une fonction API avec :
   * 1. **Logging structuré** : Trace début/fin/erreur avec contexte
   * 2. **Rechargement automatique** : `loadData(true)` en mode silencieux après succès
   * 3. **Error handling centralisé** : Formatage + affichage des erreurs DB
   * 4. **Retour uniforme** : Format `{ data, error }` comme Supabase
   *
   * **Workflow :**
   * ```
   * 1. Log opération démarrée (avec args)
   * 2. Exécution fonction API
   * 3. Log résultat API
   * 4. Vérification erreur (throw si res.error)
   * 5. Rechargement silencieux loadData(true)
   * 6. Log succès
   * 7. Retour résultat
   *    OU
   * 8. Catch erreur → Format → Set error message → Retour { error }
   * ```
   *
   * **Pourquoi HOF plutôt que middleware ?**
   * - Plus simple à comprendre (pas de chaîne de responsabilité)
   * - Composable facilement (on peut ajouter d'autres wrappers)
   * - TypeScript-friendly (préserve les types)
   *
   * @param {Function} fn - Fonction API à wrapper (ex: apiUpsertConfig)
   * @returns {Function} Fonction wrappée avec reload automatique
   *
   * @example
   * ```tsx
   * // Wrapper une fonction API
   * const wrappedUpsert = wrapCrudWithReload(apiUpsertConfig);
   *
   * // Utilisation transparente
   * await wrappedUpsert(config);
   * // → apiUpsertConfig(config) + reload + error handling
   * ```
   */
  const wrapCrudWithReload =
    (fn: (...args: any[]) => Promise<any>) =>
    async (...args: any[]) => {
      logger.log("🔧 wrapCrudWithReload: Opération en cours", {
        functionName: fn.name,
        argsCount: args.length,
      });

      try {
        // Exécution de la fonction API
        const res = await fn(...args);
        logger.log("🔧 wrapCrudWithReload: Résultat API", {
          hasError: !!res?.error,
          hasData: !!res?.data,
        });

        // Vérification du résultat
        if (res && res.error) throw res.error;

        // Rechargement silencieux des données
        logger.log("🔧 wrapCrudWithReload: Appel de loadData...");
        await loadData(true);
        logger.log("🔧 wrapCrudWithReload: loadData terminé");

        return res;
      } catch (err: any) {
        // Gestion centralisée des erreurs
        logger.error("❌ wrapCrudWithReload: Erreur", {
          message: err.message,
          code: err.code,
          details: err.details,
        });

        // Formatage pour l'utilisateur
        const userMessage = formatDatabaseError(err.message || "Erreur lors de l'opération");
        setErrorMessage(userMessage);

        return { error: err };
      }
    };

  // Exposition des actions wrappées
  return {
    // Utilisateurs autorisés
    toggleUserAuthorization: wrapCrudWithReload(apiToggleUserAuthorization),
    updateUserNotes: wrapCrudWithReload(apiUpdateUserNotes),
    deleteAuthorizedUser: wrapCrudWithReload(apiDeleteAuthorizedUser),

    // Dépenses récurrentes
    upsertConfig: wrapCrudWithReload(apiUpsertConfig),
    deleteConfig: wrapCrudWithReload(apiDeleteConfig),

    // Revenus récurrents
    upsertIncome: wrapCrudWithReload(apiUpsertIncome),
    deleteIncome: wrapCrudWithReload(apiDeleteIncome),

    // Catégories
    upsertCategory: wrapCrudWithReload(apiUpsertCategory),
    deleteCategory: wrapCrudWithReload(apiDeleteCategory),

    // Personnes
    upsertPerson: wrapCrudWithReload(apiUpsertPerson),
    deletePerson: wrapCrudWithReload(apiDeletePerson),

    // Comptes
    upsertAccount: wrapCrudWithReload(apiUpsertAccount),
    deleteAccount: wrapCrudWithReload(apiDeleteAccount),

    // Libellés
    upsertLabel: wrapCrudWithReload(apiUpsertLabel),
    deleteLabel: wrapCrudWithReload(apiDeleteLabel),
    importLabels: wrapCrudWithReload(apiImportLabels),
    importVirLabels: wrapCrudWithReload(apiImportVirLabels),

    // Tags
    upsertTag: wrapCrudWithReload(apiUpsertTag),
    deleteTag: wrapCrudWithReload(apiDeleteTag),
  };
};
