/**
 * @file Accordéon pour options avancées des formulaires
 * @description Section repliable pour les champs optionnels/avancés (tags, extra, remboursement, etc.)
 * Améliore la hiérarchie visuelle en mettant en avant les champs essentiels.
 *
 * @architecture
 * **Design Pattern :**
 * - Controlled component (état externe via isOpen/setIsOpen)
 * - Slot pattern (children pour contenu flexible)
 * - Animation smooth avec transition height
 *
 * **Usage :**
 * ```tsx
 * const [showAdvanced, setShowAdvanced] = useState(false);
 *
 * <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
 *   <TagAmountSelector ... />
 *   <Toggle Extra />
 *   <Toggle Remboursement />
 * </AdvancedOptionsAccordion>
 * ```
 */
import React from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface AdvancedOptionsAccordionProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant accordéon pour masquer les options avancées.
 *
 * @description
 * Section repliable qui permet de simplifier l'interface en masquant
 * les champs optionnels/avancés par défaut. Réduit la charge cognitive
 * et met en avant les champs essentiels.
 *
 * **Optimisation automatique :**
 * - Si 1 seul enfant : affiche directement sans accordéon (pas d'économie de place)
 * - Si 2+ enfants : affiche l'accordéon (réduction de la charge cognitive)
 *
 * **Comportement :**
 * - Replié par défaut (isOpen=false recommandé)
 * - Clic sur header toggle l'état
 * - Animation smooth avec transition
 * - Badge indicateur d'état (Masquées/Affichées)
 *
 * **Contenu typique :**
 * - Ventilation par tags (TagAmountSelector)
 * - Toggles Extra/Remboursement/Intérêts/Salaire
 * - Champs rares/avancés
 *
 * @param {boolean} isOpen - État ouvert/fermé
 * @param {function} onToggle - Callback de changement d'état
 * @param {ReactNode} children - Contenu à afficher/masquer
 * @param {string} [className] - Classes CSS additionnelles
 *
 * @example
 * ```tsx
 * // Dans VariableTransactionForm
 * const [showAdvanced, setShowAdvanced] = useState(false);
 *
 * <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
 *   <TagAmountSelector tags={tags} ... />
 *   <ToggleExtra isExtra={isExtra} onChange={setIsExtra} />
 *   <ToggleRefund isRefund={isRefund} onChange={setIsRefund} />
 * </AdvancedOptionsAccordion>
 * ```
 */
export const AdvancedOptionsAccordion: React.FC<AdvancedOptionsAccordionProps> = ({ isOpen, onToggle, children, className = "" }) => {
  // Compter le nombre d'enfants réels (non null/undefined)
  const childCount = React.Children.count(children);

  // Si 1 seul enfant : afficher directement sans accordéon (pas d'économie de place)
  if (childCount <= 1) {
    return <div className={className}>{children}</div>;
  }

  // Si 2+ enfants : afficher avec accordéon
  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
            <Settings size={16} className="text-slate-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Options Avancées</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOpen ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}>
              {isOpen ? "Affichées" : "Masquées"}
            </span>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
      </button>

      {/* Contenu repliable */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="p-4 space-y-3 bg-slate-50/50 border-t border-slate-100">{children}</div>
      </div>
    </div>
  );
};
