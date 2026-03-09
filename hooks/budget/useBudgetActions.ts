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
import type { Account } from "../../types";
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
  apiUpdateSettings as _apiUpdateSettings,
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
export const useBudgetActions = (
  loadData: (silent?: boolean) => Promise<void>,
  setErrorMessage: (message: string) => void,
  onUpsertAccountCallback?: (account: Account) => void
) => {
  /**
   * HOF pour wrapper les fonctions CRUD avec logging et rechargement.
   *
   * @param {Function} apiFunction - Fonction API à wrapper (ex: apiUpsertConfig)
   * @param {string} operationName - Nom de l'opération pour les logs (ex: "Upsert Config")
   * @param {boolean} [reloadOnSuccess=true] - Recharger les données après succès
   * @returns {Function} Fonction wrappée
   */
  type ApiResult = { data?: unknown; error?: unknown };

  const wrapCrudWithReload = <T extends (...args: unknown[]) => Promise<ApiResult>>(apiFunction: T, operationName: string, reloadOnSuccess = true) => {
    return (async (...args: Parameters<T>): Promise<{ data: unknown; error: unknown }> => {
      try {
        const result = await apiFunction(...args);
        if (result.error) {
          const rawMessage =
            typeof result.error === "string" ? result.error : ((result.error as { message?: string } | null | undefined)?.message ?? "Erreur base de données");
          const formattedError = formatDatabaseError(rawMessage);
          setErrorMessage(formattedError);
          return { data: null, error: new Error(formattedError) };
        }
        if (reloadOnSuccess) {
          await loadData(true);
        }

        // Appel du callback spécifique pour upsertAccount
        const maybeData = (result as ApiResult).data;
        if (operationName === "Upsert Account" && onUpsertAccountCallback && Array.isArray(maybeData) && maybeData.length > 0) {
          onUpsertAccountCallback(maybeData[0] as Account);
        }

        // Important: conserver la forme de retour originale (ex: { count } pour imports)
        return result as unknown as { data: unknown; error: unknown };
      } catch (err) {
        const error = err as Error;
        const formattedError = `Erreur inconnue lors de l'opération ${operationName}: ${error.message}`;
        setErrorMessage(formattedError);
        return { data: null, error };
      }
    }) as T;
  };

  // Wrapper toutes les actions CRUD
  const upsertConfig = wrapCrudWithReload(apiUpsertConfig, "Upsert Config");
  const deleteConfig = wrapCrudWithReload(apiDeleteConfig, "Delete Config");
  const upsertIncome = wrapCrudWithReload(apiUpsertIncome, "Upsert Income");
  const deleteIncome = wrapCrudWithReload(apiDeleteIncome, "Delete Income");
  const upsertCategory = wrapCrudWithReload(apiUpsertCategory, "Upsert Category");
  const deleteCategory = wrapCrudWithReload(apiDeleteCategory, "Delete Category");
  const upsertPerson = wrapCrudWithReload(apiUpsertPerson, "Upsert Person");
  const deletePerson = wrapCrudWithReload(apiDeletePerson, "Delete Person");
  const upsertAccount = wrapCrudWithReload(apiUpsertAccount, "Upsert Account");
  const deleteAccount = wrapCrudWithReload(apiDeleteAccount, "Delete Account");
  const upsertLabel = wrapCrudWithReload(apiUpsertLabel, "Upsert Label");
  const deleteLabel = wrapCrudWithReload(apiDeleteLabel, "Delete Label");
  const importLabels = wrapCrudWithReload(apiImportLabels, "Import Labels");
  const importVirLabels = wrapCrudWithReload(apiImportVirLabels, "Import VIR Labels");
  const upsertTag = wrapCrudWithReload(apiUpsertTag, "Upsert Tag");
  const deleteTag = wrapCrudWithReload(apiDeleteTag, "Delete Tag");

  return {
    // Utilisateurs autorisés
    toggleUserAuthorization: wrapCrudWithReload(apiToggleUserAuthorization, "Toggle User Authorization"),
    updateUserNotes: wrapCrudWithReload(apiUpdateUserNotes, "Update User Notes"),
    deleteAuthorizedUser: wrapCrudWithReload(apiDeleteAuthorizedUser, "Delete Authorized User"),

    // Dépenses récurrentes
    upsertConfig,
    deleteConfig,

    // Revenus récurrents
    upsertIncome,
    deleteIncome,

    // Catégories
    upsertCategory,
    deleteCategory,

    // Personnes
    upsertPerson,
    deletePerson,

    // Comptes
    upsertAccount,
    deleteAccount,

    // Libellés
    upsertLabel,
    deleteLabel,
    importLabels,
    importVirLabels,

    // Tags
    upsertTag,
    deleteTag,
  };
};
