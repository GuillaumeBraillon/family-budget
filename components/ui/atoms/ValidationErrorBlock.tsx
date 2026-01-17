/**
 * @file Bloc d'erreurs de validation réutilisable
 * @description Composant générique pour afficher les erreurs de validation de formulaire
 * avec design unifié et support du focus automatique.
 *
 * @design
 * - Style cohérent avec le design system (rose-50, rose-200, rose-700)
 * - Support ref pour scroll automatique
 * - Tabindex -1 pour focus programmatique
 * - Animation fade-in + slide-in
 *
 * @usage
 * ```tsx
 * const errorBlockRef = useRef<HTMLDivElement>(null);
 *
 * // Dans useEffect
 * useValidationScroll(validationErrors, errorBlockRef);
 *
 * // Dans JSX
 * <ValidationErrorBlock
 *   errors={validationErrors}
 *   ref={errorBlockRef}
 * />
 * ```
 */
import { forwardRef } from "react";

interface ValidationErrorBlockProps {
  errors: string[];
  className?: string;
}

/**
 * Bloc d'affichage des erreurs de validation.
 *
 * @description
 * Composant réutilisable qui affiche une liste d'erreurs de validation avec :
 * - Design unifié (fond rose, bordure, liste à puces)
 * - Support ref pour scroll automatique via useValidationScroll
 * - Animation d'apparition fluide
 * - Focus automatique pour accessibilité
 *
 * **Pattern DRY :**
 * Élimine 5 duplications de ce bloc dans :
 * - VariableTransactionForm
 * - TransferForm
 * - ExpenseRulesEditor
 * - IncomeEditor
 * - (Potentiellement autres formulaires)
 *
 * @example
 * ```tsx
 * // Simple usage
 * <ValidationErrorBlock errors={["Libellé requis", "Montant invalide"]} />
 *
 * // Avec ref pour scroll
 * const ref = useRef<HTMLDivElement>(null);
 * <ValidationErrorBlock errors={errors} ref={ref} />
 * ```
 */
export const ValidationErrorBlock = forwardRef<HTMLDivElement, ValidationErrorBlockProps>(({ errors, className = "" }, ref) => {
  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`bg-rose-50 border border-rose-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 outline-none focus:ring-2 focus:ring-rose-300 ${className}`}
    >
      <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Champs manquants :</p>
      <ul className="text-xs text-rose-600 space-y-0.5 list-disc list-inside">
        {errors.map((error, idx) => (
          <li key={idx}>{error}</li>
        ))}
      </ul>
    </div>
  );
});

ValidationErrorBlock.displayName = "ValidationErrorBlock";
