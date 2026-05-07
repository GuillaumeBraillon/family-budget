/**
 * @file Hook de scroll automatique vers les erreurs de validation
 * @description Hook réutilisable qui gère le scroll et le focus automatique
 * vers le bloc d'erreurs lorsque des erreurs de validation apparaissent.
 *
 * @pattern DRY
 * Élimine 5 duplications de ce useEffect identique dans :
 * - VariableTransactionForm
 * - TransferForm
 * - ExpenseRulesEditor
 * - IncomeEditor
 * - (Potentiellement autres formulaires)
 *
 * @usage
 * ```tsx
 * const errorBlockRef = useRef<HTMLDivElement>(null);
 * useValidationScroll(validationErrors, errorBlockRef);
 *
 * <ValidationErrorBlock errors={validationErrors} ref={errorBlockRef} />
 * ```
 */
import { useEffect, RefObject } from "react";

/**
 * Hook qui scroll automatiquement vers le bloc d'erreurs lors de l'apparition d'erreurs.
 *
 * @description
 * Simplifie la gestion des erreurs de validation dans les formulaires en :
 * - Détectant l'apparition d'erreurs (length > 0)
 * - Scrollant vers le bloc d'erreurs (smooth behavior)
 * - Mettant le focus sur le bloc pour accessibilité
 *
 * **Comportement :**
 * - S'exécute uniquement quand des erreurs apparaissent
 * - Utilise scrollIntoView avec options pour UX fluide
 * - Focus le bloc (tabindex -1) pour lecteurs d'écran
 * - Ne fait rien si ref null ou pas d'erreurs
 *
 * **Pattern de réutilisation :**
 * ```tsx
 * // Avant (duplication x5)
 * useEffect(() => {
 *   if (validationErrors.length > 0 && errorBlockRef.current) {
 *     errorBlockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
 *     errorBlockRef.current.focus();
 *   }
 * }, [validationErrors]);
 *
 * // Après (DRY)
 * useValidationScroll(validationErrors, errorBlockRef);
 * ```
 *
 * @param {string[]} errors - Liste des erreurs de validation
 * @param {RefObject<HTMLElement>} elementRef - Ref vers le bloc d'erreurs
 *
 * @example
 * ```tsx
 * const MyForm = () => {
 *   const [errors, setErrors] = useState<string[]>([]);
 *   const errorBlockRef = useRef<HTMLDivElement>(null);
 *
 *   useValidationScroll(errors, errorBlockRef);
 *
 *   return (
 *     <form>
 *       <ValidationErrorBlock errors={errors} ref={errorBlockRef} />
 *     </form>
 *   );
 * };
 * ```
 */
export const useValidationScroll = (errors: string[], elementRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    if (errors.length > 0 && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      elementRef.current.focus();
    }
  }, [errors, elementRef]);
};
