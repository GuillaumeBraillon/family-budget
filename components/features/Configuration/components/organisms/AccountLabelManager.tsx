import React, { useState } from "react";
import { Trash2, Save, Tag, DownloadCloud, Search, Check, Info, TrendingDown, TrendingUp, ArrowRightLeft, PiggyBank, CreditCard } from "lucide-react";
import { SavedLabel, AccountType, CategoryDef } from "../../../../../types";
import { ConfirmModal } from "../../../../ui/atoms/ConfirmModal";
import { DataList } from "../../../../ui/molecules/DataList";
import { DataListRow } from "../../../../ui/molecules/DataListRow";
import { Modal } from "../../../../ui/Modal";
import { TextInput } from "../../../../ui/molecules/FormInputs";
import { CategorySelector } from "../../../../ui/molecules/CategorySelector";
import { AdvancedOptionsAccordion } from "../../../../ui/molecules/AdvancedOptionsAccordion";

interface AccountLabelManagerProps {
  labels: SavedLabel[];
  categories: CategoryDef[];
  onUpsertLabel: (l: SavedLabel) => void;
  onDeleteLabel: (id: string) => void;
  onImportLabels?: () => Promise<{ count?: number; error?: Error }> | void;
  onImportVirLabels?: () => Promise<{ count?: number; error?: Error }> | void;
}

// Utilisation directe des types pour les onglets
type ManagerTab = AccountType;

export const AccountLabelManager: React.FC<AccountLabelManagerProps> = ({
  labels,
  categories,
  onUpsertLabel,
  onDeleteLabel,
  onImportLabels,
  onImportVirLabels,
}) => {
  const [currentTab, setCurrentTab] = useState<ManagerTab>(AccountType.CHECKING);
  const [isExpenseMode, setIsExpenseMode] = useState(true); // Utilisé uniquement pour l'onglet CHECKING

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<SavedLabel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Catégorie et sous-catégorie pour auto-suggestion
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // Search & Feedback
  const [searchQuery, setSearchQuery] = useState("");
  const [importStatus, setImportStatus] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);

  // LOGIQUE DE FILTRAGE
  const filteredList = labels
    .filter((l) => {
      if (currentTab === AccountType.CHECKING) {
        return l.type === AccountType.CHECKING && l.isExpense === isExpenseMode;
      }
      // Pour les autres types (EPARGNE, VIREMENT), on prend tout le type sans distinction isExpense
      return l.type === currentTab;
    })
    .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const resetForm = () => {
    setName("");
    setCategory("");
    setSubCategory("");
    setEditingLabel(null);
    setIsModalOpen(false);
    setDeleteConfirm(null);
    setShowAdvanced(false);
  };

  const handleAddClick = () => {
    setEditingLabel(null);
    setName("");
    setCategory("");
    setSubCategory("");
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (label: SavedLabel) => {
    setEditingLabel(label);
    setName(label.name);

    // Charger catégorie/sous-catégorie si présentes
    if (label.categoryId) {
      const cat = categories.find((c) => c.id === label.categoryId);
      if (cat) {
        setCategory(cat.name);
        if (label.subCategoryId) {
          const sub = cat.subCategories.find((sc) => sc.id === label.subCategoryId);
          if (sub) setSubCategory(sub.name);
        }
      }
    }

    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = () => {
    if (!name.trim()) return;

    let newId = `lbl_${Date.now()}`;
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      newId = crypto.randomUUID();
    }

    // DÉTERMINATION DU TYPE ET DU FLAG IS_EXPENSE
    const targetType = currentTab;

    // Pour checking, on suit le mode expense/income. Pour le reste, peu importe (true par défaut)
    const targetIsExpense = currentTab === AccountType.CHECKING ? isExpenseMode : true;

    // RÉSOLUTION DES IDs DE CATÉGORIE/SOUS-CATÉGORIE
    let categoryId: string | undefined;
    let subCategoryId: string | undefined;

    if (category) {
      const cat = categories.find((c) => c.name === category);
      if (cat) {
        categoryId = cat.id;
        if (subCategory) {
          const sub = cat.subCategories.find((sc) => sc.name === subCategory);
          if (sub) subCategoryId = sub.id;
        }
      }
    }

    const label: SavedLabel = {
      id: editingLabel ? editingLabel.id : newId,
      name: name.trim(),
      type: targetType,
      isExpense: targetIsExpense,
      categoryId,
      subCategoryId,
    };
    onUpsertLabel(label);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDeleteLabel(deleteConfirm.id);
      clearForm();
    }
  };

  const runImport = async (importFn: () => Promise<{ count?: number; error?: Error }> | void, sourceName: string) => {
    const result = await importFn();

    if (result && typeof result.count === "number") {
      if (result.count > 0) {
        setImportStatus({
          type: "success",
          message: `${result.count} libellé${result.count > 1 ? "s" : ""} (${sourceName}) importé${result.count > 1 ? "s" : ""}.`,
        });
      } else {
        setImportStatus({ type: "info", message: `Aucun nouveau libellé ${sourceName} à importer.` });
      }
    } else if (result && result.error) {
      setImportStatus({ type: "error", message: "Erreur lors de l'import." });
    }

    setTimeout(() => setImportStatus(null), 4000);
  };

  const getPlaceholder = () => {
    if (currentTab === AccountType.TRANSFER) return "Ex: Épargne, Remboursement, Apport...";
    if (currentTab === AccountType.SAVINGS) return "Ex: Intérêts annuels, Prime...";
    return "Ex: Courses, Carrefour, EDF...";
  };

  const getListTitle = () => {
    if (currentTab === AccountType.TRANSFER) return "Motifs de Virement";
    if (currentTab === AccountType.SAVINGS) return "Libellés Épargne";
    return `Opérations Courantes (${isExpenseMode ? "Débits" : "Crédits"})`;
  };

  const getIconColor = () => {
    if (currentTab === AccountType.TRANSFER) return "text-indigo-500";
    if (currentTab === AccountType.SAVINGS) return "text-emerald-500";
    return isExpenseMode ? "text-indigo-500" : "text-emerald-500";
  };

  return (
    <div className="space-y-4">
      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingLabel ? "Modifier le libellé" : "Ajouter un libellé"}>
        <div className="space-y-4">
          <TextInput label="Libellé" value={name} onChange={(e) => setName(e.target.value)} placeholder={getPlaceholder()} required autoFocus />

          <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
            <div className="space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Associez une catégorie à ce libellé pour activer l'auto-suggestion lors de la saisie d'opérations variables.
              </p>
              <CategorySelector
                categories={categories}
                type={isExpenseMode ? "EXPENSE" : "INCOME"}
                selectedCategory={category}
                selectedSubCategory={subCategory}
                onCategoryChange={setCategory}
                onSubCategoryChange={setSubCategory}
              />
            </div>
          </AdvancedOptionsAccordion>

          <div className="flex gap-3 pt-2">
            {editingLabel && (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ id: editingLabel.id, name: editingLabel.name })}
                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleFormSubmit}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> {editingLabel ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Supprimer le libellé ?"
        message={
          <span>
            Voulez-vous vraiment supprimer le libellé <strong>{deleteConfirm?.name}</strong> ?
          </span>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* NAVIGATION DES ONGLETS */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setCurrentTab(AccountType.CHECKING)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              currentTab === AccountType.CHECKING ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CreditCard size={14} /> Courant
          </button>
          <button
            onClick={() => setCurrentTab(AccountType.TRANSFER)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              currentTab === AccountType.TRANSFER ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowRightLeft size={14} /> Virements
          </button>
          <button
            onClick={() => setCurrentTab(AccountType.SAVINGS)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              currentTab === AccountType.SAVINGS ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <PiggyBank size={14} /> Épargne
          </button>
        </div>
      </div>

      {/* SOUS-MENU POUR LES COMPTES COURANTS UNIQUEMENT */}
      {currentTab === AccountType.CHECKING && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-center">
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsExpenseMode(true)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                  isExpenseMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingDown size={14} /> Dépenses (Débits)
              </button>
              <button
                onClick={() => setIsExpenseMode(false)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
                  !isExpenseMode ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp size={14} /> Revenus (Crédits)
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-2">
            {importStatus && (
              <div
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  importStatus.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : importStatus.type === "info"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {importStatus.type === "success" && <Check size={14} />}
                {importStatus.type === "info" && <Info size={14} />}
                {importStatus.message}
              </div>
            )}
            <div className="flex gap-2">
              {isExpenseMode && onImportLabels && (
                <button
                  onClick={() => runImport(onImportLabels!, "CB")}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                  title="Importer les libellés 'CB %' depuis l'historique"
                >
                  <DownloadCloud size={14} /> Import (CB)
                </button>
              )}
              {!isExpenseMode && onImportVirLabels && (
                <button
                  onClick={() => runImport(onImportVirLabels!, "VIR")}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                  title="Importer les libellés 'VIR %' depuis l'historique"
                >
                  <DownloadCloud size={14} /> Import (VIR)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre de Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un libellé..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
        />
      </div>

      <DataList
        title={getListTitle()}
        count={filteredList.length}
        onAdd={handleAddClick}
        addButtonLabel="Ajouter un libellé"
        emptyMessage={searchQuery ? "Aucun libellé ne correspond à votre recherche." : "Aucun libellé défini pour cette section."}
      >
        {filteredList.map((label) => (
          <DataListRow key={label.id} icon={<Tag size={20} className={getIconColor()} />} label={label.name} onClick={() => handleEditClick(label)} />
        ))}
      </DataList>
    </div>
  );
};
