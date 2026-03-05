/**
 * @file Hook d'auto-suggestion de catégories basée sur les libellés
 * @description Suggère automatiquement une catégorie et sous-catégorie lors de la saisie
 * d'un libellé, en se basant sur les associations enregistrées dans saved_labels.
 *
 * @architecture
 * **Fonctionnement :**
 * - Appelle la fonction SQL `suggest_category_from_label(p_label_name)`
 * - Retourne { category_id, sub_category_id } si trouvé
 * - Gère le loading state pour feedback UI
 *
 * **Intégration :**
 * Utilisé dans les formulaires de transactions pour pré-remplir automatiquement
 * les catégories quand l'utilisateur saisit un libellé connu.
 *
 * @dependencies
 * - services/supabase : Fonction RPC pour appel SQL
 * - Migration 004 : Fonction SQL suggest_category_from_label
 */
import { useState, useCallback } from "react";
import { supabase } from "../services/supabase";
import { logger } from "../services/logger";

/**
 * Résultat de la suggestion de catégorie.
 */
interface CategorySuggestion {
  category_id: string;
  sub_category_id: string | null;
}

/**
 * Vérifie si une valeur correspond au format attendu d'une suggestion.
 */
const isCategorySuggestion = (value: unknown): value is CategorySuggestion => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as {
    category_id?: unknown;
    sub_category_id?: unknown;
  };

  const hasValidCategoryId = typeof candidate.category_id === "string";
  const hasValidSubCategoryId = typeof candidate.sub_category_id === "string" || candidate.sub_category_id === null || candidate.sub_category_id === undefined;

  return hasValidCategoryId && hasValidSubCategoryId;
};

/**
 * Hook d'auto-suggestion de catégories depuis les libellés sauvegardés.
 *
 * @description
 * Permet de suggérer automatiquement une catégorie et sous-catégorie lors de la saisie
 * d'un libellé dans un formulaire de transaction. Se base sur les associations
 * enregistrées dans la table `saved_labels`.
 *
 * **Workflow :**
 * 1. L'utilisateur saisit ou sélectionne un libellé
 * 2. Le hook appelle `suggest_category_from_label(labelName)`
 * 3. La fonction SQL recherche dans `saved_labels`
 * 4. Retourne l'ID de catégorie et sous-catégorie associés
 * 5. L'UI pré-remplit les champs de catégorie
 *
 * **Optimisation :**
 * - Minimum 3 caractères pour déclencher la recherche
 * - Gestion du loading state pour feedback utilisateur
 * - Erreurs loggées mais ne bloquent pas l'UX
 *
 * @returns {Object} Interface d'auto-suggestion
 * @returns {Function} suggestFromLabel - Fonction pour obtenir suggestion
 * @returns {boolean} isLoading - État de chargement
 *
 * @example
 * ```tsx
 * const { suggestFromLabel, isLoading } = useCategoryAutoSuggest();
 *
 * const handleLabelSelect = async (labelName: string) => {
 *   const suggestion = await suggestFromLabel(labelName);
 *   if (suggestion) {
 *     const cat = categories.find(c => c.id === suggestion.category_id);
 *     if (cat) {
 *       setCategory(cat.name);
 *       if (suggestion.sub_category_id) {
 *         const sub = cat.subCategories.find(sc => sc.id === suggestion.sub_category_id);
 *         if (sub) setSubCategory(sub.name);
 *       }
 *     }
 *   }
 * };
 * ```
 */
export const useCategoryAutoSuggest = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Suggère une catégorie et sous-catégorie depuis un libellé.
   *
   * @description
   * Appelle la fonction SQL `suggest_category_from_label` pour récupérer
   * l'association catégorie/sous-catégorie enregistrée pour ce libellé.
   *
   * **Optimisations :**
   * - Retourne null si libellé < 3 caractères (évite appels inutiles)
   * - Retourne null en cas d'erreur (UX non bloquante)
   * - Log les erreurs pour debug
   *
   * @param {string} labelName - Libellé à rechercher
   * @returns {Promise<CategorySuggestion | null>} Suggestion ou null si non trouvé
   *
   * @example
   * ```tsx
   * const suggestion = await suggestFromLabel('Netflix');
   * // → { category_id: 'cat_loisirs', sub_category_id: 'sub_streaming' }
   * ```
   */
  const suggestFromLabel = useCallback(async (labelName: string): Promise<CategorySuggestion | null> => {
    // Éviter les appels pour des saisies trop courtes
    if (!labelName || labelName.length < 3) {
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error, status } = await supabase.rpc("suggest_category_from_label", {
        p_label_name: labelName,
      });

      // Cas courant: aucune ligne trouvée sur une RPC attendue en objet -> 406
      if (error && status === 406) {
        return null;
      }

      if (error) throw error;

      // Selon la signature SQL/PostgREST, la RPC peut renvoyer un objet ou un tableau
      const suggestion = Array.isArray(data) ? data[0] : data;

      if (isCategorySuggestion(suggestion)) {
        return {
          category_id: suggestion.category_id,
          sub_category_id: suggestion.sub_category_id ?? null,
        };
      }

      return null;
    } catch (err) {
      const error = err as Error;
      logger.error("auto-suggest", "Erreur lors de la suggestion:", {
        label: labelName,
        error: error.message,
      });
      return null; // Erreur non bloquante
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestFromLabel,
    isLoading,
  };
};
