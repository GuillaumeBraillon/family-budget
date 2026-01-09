/**
 * @file Wrapper de champ de formulaire réutilisable
 * @description Composant générique pour afficher un label + input avec style cohérent.
 * Élimine la duplication du composant FormField défini localement dans PlannerModals.
 *
 * @design
 * - Label uppercase, small, medium weight, slate-500
 * - Espacement vertical minimal (space-y-1)
 * - Support children pour flexibilité maximale
 *
 * @usage
 * ```tsx
 * <FormField label="Libellé">
 *   <input type="text" ... />
 * </FormField>
 *
 * <FormField label="Compte">
 *   <select ...>...</select>
 * </FormField>
 * ```
 */
import React, { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

/**
 * Wrapper générique pour champ de formulaire avec label.
 *
 * @description
 * Composant simple mais essentiel pour maintenir la cohérence visuelle
 * des formulaires. Fournit un label standardisé au-dessus de n'importe
 * quel type d'input (text, number, select, custom component).
 *
 * **Pattern de réutilisation :**
 * - Actuellement défini localement dans PlannerModals
 * - Peut être utilisé dans tous les formulaires
 * - Remplace les `<div><label>...</label>{children}</div>` répétés
 *
 * **Design System :**
 * - Label : `text-xs font-medium text-slate-500 uppercase`
 * - Container : `space-y-1` (espacement minimal 4px)
 * - Support required indicator optionnel
 *
 * @param {string} label - Texte du label (sera uppercase)
 * @param {ReactNode} children - Input ou composant de champ
 * @param {string} [className] - Classes CSS additionnelles pour le container
 * @param {boolean} [required] - Si true, affiche un astérisque rouge
 *
 * @example
 * ```tsx
 * // Input texte simple
 * <FormField label="Libellé" required>
 *   <input type="text" value={label} onChange={...} />
 * </FormField>
 *
 * // Select
 * <FormField label="Compte">
 *   <select value={accountId} onChange={...}>
 *     <option value="1">Compte courant</option>
 *   </select>
 * </FormField>
 *
 * // Composant custom
 * <FormField label="Catégorie">
 *   <CategorySelector ... />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({ label, children, className = "", required = false }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-slate-500 uppercase block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
};
