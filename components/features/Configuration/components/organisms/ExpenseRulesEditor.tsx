import React, { useState, useEffect, useMemo, useRef } from "react";
import { Trash2, Save } from "lucide-react";
import { ExpenseConfig, CategoryDef, Person, Account, AccountType } from "../../../../../types";
import { CategorySelector } from "../../../../ui/molecules/CategorySelector";
import { TextInput, AmountInput } from "../../../../ui/molecules/FormInputs";
import { AccountSelector, BeneficiarySelector } from "../../../../ui/molecules/SmartSelectors";
import { DataList } from "../../../../ui/molecules/DataList";
import { DataListRow } from "../../../../ui/molecules/DataListRow";
import { ConfirmModal } from "../../../../ui/atoms/ConfirmModal";
import { Modal } from "../../../../ui/Modal";
import { SortOrder } from "../../../../ui/molecules/ListSorter";
import { ValidationErrorBlock } from "../../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../../hooks/useValidationScroll";
import { AdvancedOptionsAccordion } from "../../../../ui/molecules/AdvancedOptionsAccordion";

interface ExpenseRulesEditorProps {
  configs: ExpenseConfig[];
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  onAddConfig: (c: ExpenseConfig) => void;
  onUpdateConfig: (c: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  sortKey: string;
  sortOrder: SortOrder;
}

export const ExpenseRulesEditor: React.FC<ExpenseRulesEditorProps> = ({
  configs,
  categories,
  people,
  accounts,
  onAddConfig,
  onUpdateConfig,
  onDeleteConfig,
  sortKey,
  sortOrder,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers les erreurs de validation
  useValidationScroll(validationErrors, errorBlockRef);

  const defaultAccount = accounts[0]?.id || "";

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Déterminer le bénéficiaire par défaut : priorité au displayOrder
  const defaultBeneficiary = useMemo(() => {
    const sortedByOrder = [...people].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
    if (sortedByOrder.length > 0) return sortedByOrder[0].id;
    return people[0]?.id || "";
  }, [people]);

  const [formData, setFormData] = useState<Partial<Omit<ExpenseConfig, "amount">> & { amount: string | number }>({
    label: "",
    amount: "",
    dayOfMonth: 1,
    accountId: defaultAccount,
    beneficiaryId: defaultBeneficiary,
    category: "",
    subCategory: "",
    isExtra: false,
    startMonth: "",
    endMonth: "",
  });

  const [durationMode, setDurationMode] = useState<"dates" | "duration">("duration");
  const [durationMonths, setDurationMonths] = useState<number>(3);

  useEffect(() => {
    if (formData.isExtra && durationMode === "duration" && formData.startMonth && durationMonths > 0) {
      const [year, month] = formData.startMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + durationMonths - 1);

      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
      const calculatedEnd = `${endYear}-${endMonth}`;

      if (formData.endMonth !== calculatedEnd) {
        const timer = setTimeout(() => {
          setFormData((prev) => ({ ...prev, endMonth: calculatedEnd }));
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.startMonth, durationMonths, durationMode, formData.isExtra, formData.endMonth]);

  const clearForm = () => {
    setFormData({
      label: "",
      amount: "",
      dayOfMonth: 1,
      accountId: accounts[0]?.id || "",
      beneficiaryId: defaultBeneficiary,
      category: "",
      subCategory: "",
      isExtra: false,
      startMonth: "",
      endMonth: "",
    });
    setDurationMode("duration");
    setDurationMonths(3);
    setEditingId(null);
    setIsFormOpen(false);
    setShowDeleteConfirm(false);
    setValidationErrors([]);
  };

  const handleEdit = (config: ExpenseConfig) => {
    setFormData(config);
    setEditingId(config.id);
    setIsFormOpen(true);
    setDurationMode("dates");
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      label: "",
      amount: "",
      dayOfMonth: 1,
      accountId: accounts[0]?.id || "",
      beneficiaryId: people[0]?.id,
      category: "",
      subCategory: "",
      isExtra: false,
      startMonth: currentMonthKey,
      endMonth: "",
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    const errors: string[] = [];
    const amountVal = typeof formData.amount === "string" ? parseFloat(formData.amount.replace(",", ".")) : formData.amount;

    if (!formData.label?.trim()) errors.push("Le libellé est obligatoire");
    if (!amountVal || amountVal <= 0) errors.push("Le montant est obligatoire et doit être positif");
    if (!formData.startMonth || !formData.dayOfMonth) errors.push("La première occurrence est obligatoire");
    if (!formData.category) errors.push("La catégorie est obligatoire");
    if (!formData.accountId) errors.push("Le compte est obligatoire");
    if (!formData.beneficiaryId) errors.push("Le bénéficiaire est obligatoire");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    const finalConfig: ExpenseConfig = {
      id: editingId || Date.now().toString(),
      label: formData.label ?? "",
      amount: amountVal || 0,
      category: formData.category ?? "",
      subCategory: formData.subCategory,
      beneficiaryId: formData.beneficiaryId ?? "",
      accountId: formData.accountId ?? "",
      dayOfMonth: formData.dayOfMonth ?? 1,
      startMonth: formData.startMonth,
      endMonth: formData.endMonth,
      isExtra: formData.isExtra,
    };
    if (editingId) {
      onUpdateConfig(finalConfig);
    } else {
      onAddConfig(finalConfig);
    }
    clearForm();
  };

  const handleDelete = () => {
    if (editingId) {
      onDeleteConfig(editingId);
      clearForm();
    }
  };

  const sortedConfigs = useMemo(() => {
    return [...configs].sort((a, b) => {
      const key = sortKey as keyof ExpenseConfig;
      const res = key === "label" ? a.label.localeCompare(b.label) : (a[key] as number) - (b[key] as number);
      return sortOrder === "asc" ? res : -res;
    });
  }, [configs, sortKey, sortOrder]);

  if (showDeleteConfirm) {
    return (
      <ConfirmModal
        isOpen={true}
        title="Supprimer la règle ?"
        message={`Voulez-vous vraiment supprimer "${formData.label}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <Modal isOpen={isFormOpen} onClose={clearForm} title={editingId ? "Modifier la dépense" : "Nouvelle Dépense Récurrente"}>
        <div className="space-y-2.5">
          <ValidationErrorBlock errors={validationErrors} ref={errorBlockRef} />

          <TextInput
            label="Libellé"
            value={formData.label}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, label: val }));
            }}
            required
          />

          <AmountInput
            label="Montant"
            value={formData.amount}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, amount: val }));
            }}
            required
          />

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
              Première occurrence <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startMonth && formData.dayOfMonth ? `${formData.startMonth}-${String(formData.dayOfMonth).padStart(2, "0")}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [y, m, d] = val.split("-");
                  setFormData((prev) => ({
                    ...prev,
                    dayOfMonth: parseInt(d, 10),
                    startMonth: `${y}-${m}`,
                  }));
                }
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm"
              required
            />
            <p className="text-xs text-slate-400 mt-1">La dépense se répétera chaque mois à ce jour à partir de ce mois.</p>
          </div>

          <AccountSelector
            accounts={accounts}
            value={formData.accountId}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, accountId: val }));
            }}
            filterTypes={[AccountType.CHECKING]}
          />

          <BeneficiarySelector
            people={people}
            value={formData.beneficiaryId}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, beneficiaryId: val }));
            }}
          />

          <CategorySelector
            categories={categories}
            type="EXPENSE"
            selectedCategory={formData.category || ""}
            selectedSubCategory={formData.subCategory || ""}
            onCategoryChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
            onSubCategoryChange={(val) => setFormData((prev) => ({ ...prev, subCategory: val }))}
          />

          <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2.5">
                <input
                  type="checkbox"
                  id="extra"
                  checked={formData.isExtra}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData((prev) => ({ ...prev, isExtra: val }));
                  }}
                  className="h-4 w-4 text-indigo-600 rounded bg-white"
                />
                <label htmlFor="extra" className="text-sm font-bold text-slate-800 cursor-pointer">
                  Dépense temporaire / Exceptionnelle
                </label>
              </div>

              {formData.isExtra && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 text-xs mb-1">
                      <button
                        type="button"
                        onClick={() => setDurationMode("duration")}
                        className={`px-2 py-1 rounded ${durationMode === "duration" ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        Par durée
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMode("dates")}
                        className={`px-2 py-1 rounded ${durationMode === "dates" ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
                      >
                        Par date de fin
                      </button>
                    </div>
                    {durationMode === "duration" ? (
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Durée (Mois)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={durationMonths}
                            onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                          />
                          <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-2 rounded">Fin : {formData.endMonth || "?"}</span>
                        </div>
                      </div>
                    ) : (
                      <TextInput
                        label="Mois de fin"
                        type="month"
                        value={formData.endMonth}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDurationMonths(0);
                          setFormData((prev) => ({ ...prev, endMonth: val }));
                        }}
                        required={formData.isExtra}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </AdvancedOptionsAccordion>

          <div className="flex gap-3 pt-2">
            {editingId && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100">
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleFormSubmit}
              className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> {editingId ? "Mettre à jour" : "Créer la règle"}
            </button>
          </div>
        </div>
      </Modal>

      <DataList title="Modèles de Dépenses" count={configs.length} onAdd={handleAddClick} addButtonLabel="Créer un modèle">
        {sortedConfigs.map((config) => {
          const accountName = accounts.find((a) => a.id === config.accountId)?.name || "Inconnu";
          const beneficiaryName = people.find((p) => p.id === config.beneficiaryId)?.name || "?";
          return (
            <DataListRow
              key={config.id}
              date={{ day: config.dayOfMonth, month: "DU MOIS" }}
              label={config.label}
              amount={config.amount}
              category={config.category}
              subCategory={config.subCategory}
              beneficiary={beneficiaryName}
              accountName={accountName}
              onClick={() => handleEdit(config)}
              badge={config.isExtra ? <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Temp</span> : null}
            />
          );
        })}
      </DataList>
    </div>
  );
};
