import React, { useState } from "react";
import { Trash2, Save, Tag, DownloadCloud, Search, Check, Info, TrendingDown, TrendingUp, ArrowRightLeft, PiggyBank, CreditCard, List } from "lucide-react";
import { SavedLabel, AccountType, CategoryDef, Account, Person } from "../../../../../types";
import { ConfirmModal } from "../../../../ui/atoms/ConfirmModal";
import { DataList } from "../../../../ui/molecules/DataList";
import { DataListRow } from "../../../../ui/molecules/DataListRow";
import { Modal } from "../../../../ui/Modal";
import { TextInput } from "../../../../ui/molecules/FormInputs";
import { CategorySelector } from "../../../../ui/molecules/CategorySelector";
import { AccountSelector, BeneficiarySelector } from "../../../../ui/molecules/SmartSelectors";
import { AdvancedOptionsAccordion } from "../../../../ui/molecules/AdvancedOptionsAccordion";
import { InfoBox } from "../../../../ui/InfoBox";

interface AccountLabelManagerProps {
  labels: SavedLabel[];
  categories: CategoryDef[];
  accounts: Account[];
  people: Person[];
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
  accounts,
  people,
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
  const [accountId, setAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");

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
    setAccountId("");
    setBeneficiaryId("");
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
    setAccountId("");
    setBeneficiaryId("");
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

    // Charger compte si présent
    if (label.accountId) {
      setAccountId(label.accountId);
    }

    // Charger bénéficiaire si présent
    if (label.beneficiaryId) {
      setBeneficiaryId(label.beneficiaryId);
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
      accountId: accountId || undefined,
      beneficiaryId: beneficiaryId || undefined,
    };
    onUpsertLabel(label);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDeleteLabel(deleteConfirm.id);
      resetForm();
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
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
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

              <div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  Associez un compte et/ou un bénéficiaire pour pré-remplir ces champs lors de la saisie.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <AccountSelector
                    label="Compte suggéré"
                    accounts={accounts}
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    color="indigo"
                    filterTypes={[AccountType.CHECKING]}
                    allowEmpty={true}
                  />
                  <BeneficiarySelector
                    label="Bénéficiaire suggéré"
                    people={people}
                    value={beneficiaryId}
                    onChange={(e) => setBeneficiaryId(e.target.value)}
                    color="indigo"
                    allowEmpty={true}
                  />
                </div>
              </div>
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

      {/* BARRE DE NAVIGATION HARMONISÉE */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => setCurrentTab(AccountType.CHECKING)}
              className={`h-[30px] flex items-center justify-center gap-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                currentTab === AccountType.CHECKING ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CreditCard size={14} /> Courant
            </button>
            <button
              onClick={() => setCurrentTab(AccountType.TRANSFER)}
              className={`h-[30px] flex items-center justify-center gap-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                currentTab === AccountType.TRANSFER ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowRightLeft size={14} /> Virements
            </button>
            <button
              onClick={() => setCurrentTab(AccountType.SAVINGS)}
              className={`h-[30px] flex items-center justify-center gap-2 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                currentTab === AccountType.SAVINGS ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <PiggyBank size={14} /> Épargne
            </button>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm active:scale-95"
          >
            <Tag size={18} /> Nouveau
          </button>
        </div>
      </div>

      <InfoBox
        title="Libellés & Autocomplétion"
        description="Gérez vos libellés pré-enregistrés pour accélérer la saisie des opérations variables (courses, essence, restaurants, etc.)."
        icon={<List size={18} />}
      />

      {/* SOUS-MENU POUR LES COMPTES COURANTS UNIQUEMENT */}
      {currentTab === AccountType.CHECKING && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex bg-slate-50 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsExpenseMode(true)}
                className={`h-[30px] px-4 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                  isExpenseMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingDown size={14} /> Dépenses (Débits)
              </button>
              <button
                onClick={() => setIsExpenseMode(false)}
                className={`h-[30px] px-4 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                  !isExpenseMode ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp size={14} /> Revenus (Crédits)
              </button>
            </div>

            <div className="flex gap-2">
              {isExpenseMode && onImportLabels && (
                <button
                  onClick={() => runImport(onImportLabels!, "CB")}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                  title="Importer les libellés 'CB %' depuis l'historique"
                >
                  <DownloadCloud size={14} /> Import (CB)
                </button>
              )}
              {!isExpenseMode && onImportVirLabels && (
                <button
                  onClick={() => runImport(onImportVirLabels!, "VIR")}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                  title="Importer les libellés 'VIR %' depuis l'historique"
                >
                  <DownloadCloud size={14} /> Import (VIR)
                </button>
              )}
            </div>
          </div>

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
        emptyMessage={searchQuery ? "Aucun libellé ne correspond à votre recherche." : "Aucun libellé défini pour cette section."}
      >
        {filteredList.map((label) => {
          // Résoudre les noms de catégorie et sous-catégorie à partir des IDs
          let categoryName: string | undefined;
          let subCategoryName: string | undefined;

          if (label.categoryId) {
            const cat = categories.find((c) => c.id === label.categoryId);
            if (cat) {
              categoryName = cat.name;
              if (label.subCategoryId) {
                const sub = cat.subCategories.find((sc) => sc.id === label.subCategoryId);
                if (sub) subCategoryName = sub.name;
              }
            }
          }

          // Résoudre les noms de compte et bénéficiaire à partir des IDs
          const accountName = label.accountId ? accounts.find((a) => a.id === label.accountId)?.name : undefined;
          const beneficiaryName = label.beneficiaryId ? people.find((p) => p.id === label.beneficiaryId)?.name : undefined;

          return (
            <DataListRow
              key={label.id}
              icon={<Tag size={20} className={getIconColor()} />}
              label={label.name}
              category={categoryName}
              subCategory={subCategoryName}
              account={accountName}
              beneficiary={beneficiaryName}
              onClick={() => handleEditClick(label)}
            />
          );
        })}
      </DataList>
    </div>
  );
};
