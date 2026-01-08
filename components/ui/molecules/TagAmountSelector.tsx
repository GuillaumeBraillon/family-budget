import React, { useState } from "react";
import { Tag as TagIcon, Plus, X, AlertCircle, Star } from "lucide-react";
import { Tag, TagAmount } from "../../../types";

interface TagAmountSelectorProps {
  tags: Tag[];
  totalAmount: number;
  selectedTagAmounts: TagAmount[];
  onTagAmountsChange: (tagAmounts: TagAmount[]) => void;
}

export const TagAmountSelector: React.FC<TagAmountSelectorProps> = ({ tags, totalAmount, selectedTagAmounts, onTagAmountsChange }) => {
  const [showAddTag, setShowAddTag] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");

  // Calculer le montant total affecté et le reste
  const totalAffected = selectedTagAmounts.reduce((sum, ta) => sum + ta.amount, 0);
  const remaining = totalAmount - totalAffected;
  const hasError = remaining < -0.01; // Erreur seulement si on dépasse le total

  // Tags déjà utilisés
  const usedTagIds = selectedTagAmounts.map((ta) => ta.tagId);
  const availableTags = tags.filter((t) => !usedTagIds.includes(t.id));

  const handleAddTag = () => {
    if (!selectedTagId) return;

    const newTagAmount: TagAmount = {
      tagId: selectedTagId,
      amount: remaining > 0 ? remaining : 0,
    };

    onTagAmountsChange([...selectedTagAmounts, newTagAmount]);
    setSelectedTagId("");
    setShowAddTag(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagAmountsChange(selectedTagAmounts.filter((ta) => ta.tagId !== tagId));
  };

  const handleAmountChange = (tagId: string, newAmount: number) => {
    onTagAmountsChange(selectedTagAmounts.map((ta) => (ta.tagId === tagId ? { ...ta, amount: newAmount } : ta)));
  };

  const handleToggleExtra = (tagId: string) => {
    onTagAmountsChange(selectedTagAmounts.map((ta) => (ta.tagId === tagId ? { ...ta, isExtra: !ta.isExtra } : ta)));
  };

  const handleDistributeEqually = () => {
    if (selectedTagAmounts.length === 0) return;
    const amountPerTag = totalAmount / selectedTagAmounts.length;
    onTagAmountsChange(selectedTagAmounts.map((ta) => ({ ...ta, amount: parseFloat(amountPerTag.toFixed(2)) })));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
          <TagIcon size={12} />
          Ventilation par tags
        </label>
        {selectedTagAmounts.length > 1 && (
          <button type="button" onClick={handleDistributeEqually} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            Répartir équitablement
          </button>
        )}
      </div>

      {/* Liste des tags avec montants */}
      {selectedTagAmounts.length > 0 && (
        <div className="space-y-1.5">
          {selectedTagAmounts.map((tagAmount) => {
            const tag = tags.find((t) => t.id === tagAmount.tagId);
            if (!tag) return null;

            return (
              <div key={tag.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }}></div>
                <span className="text-sm text-slate-700 flex-1">{tag.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={tagAmount.amount}
                  onChange={(e) => handleAmountChange(tag.id, parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-sm border border-slate-300 rounded bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">€</span>
                <button
                  type="button"
                  onClick={() => handleToggleExtra(tag.id)}
                  className={`p-1 rounded transition-all ${tagAmount.isExtra ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 hover:text-amber-500"}`}
                  title={tagAmount.isExtra ? "Hors budget" : "Dans le budget"}
                >
                  <Star size={14} fill={tagAmount.isExtra ? "currentColor" : "none"} />
                </button>
                <button type="button" onClick={() => handleRemoveTag(tag.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Résumé montants */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-600">Montant total :</span>
          <span className="font-bold text-slate-900">{totalAmount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Affecté aux tags :</span>
          <span className={`font-bold ${hasError ? "text-amber-600" : "text-emerald-600"}`}>{totalAffected.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1">
          <span className="text-slate-600">{remaining > 0.01 ? "Sans tag (reste) :" : "Reste à ventiler :"}</span>
          <span className={`font-bold ${remaining < -0.01 ? "text-rose-600" : remaining > 0.01 ? "text-blue-600" : "text-emerald-600"}`}>
            {remaining.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Alerte si dépassement */}
      {hasError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-700">La somme des montants affectés dépasse le montant total de l'opération.</p>
        </div>
      )}

      {/* Bouton ajouter tag */}
      {!showAddTag && availableTags.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAddTag(true)}
          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Ajouter un tag
        </button>
      )}

      {/* Sélecteur de tag */}
      {showAddTag && (
        <div className="flex gap-2">
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            autoFocus
          >
            <option value="">Sélectionner un tag</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!selectedTagId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setShowAddTag(false)}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
