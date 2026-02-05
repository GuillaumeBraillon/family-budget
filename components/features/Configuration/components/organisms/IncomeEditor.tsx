import React, { useState, useEffect, useMemo, useRef } from "react";
import { Trash2, Save, Briefcase } from "lucide-react";
import { IncomeConfig, CategoryDef, Person, Account, AccountType } from "../../../../../types";
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

interface IncomeEditorProps {
  incomeConfigs: IncomeConfig[];
  people: Person[];
  categories: CategoryDef[];
  accounts: Account[];
  onAddIncome: (i: IncomeConfig) => void;
  onUpdateIncome: (i: IncomeConfig) => void;
  onDeleteIncome: (id: string) => void;
  sortKey: string;
  sortOrder: SortOrder;
}

export const IncomeEditor: React.FC<IncomeEditorProps> = ({
  incomeConfigs,
  people,
  categories,
  accounts,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
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

  const [formData, setFormData] = useState<Partial<Omit<IncomeConfig, "amount">> & { amount: string | number }>({
    label: "",
    amount: "",
    dayOfMonth: 1,
    accountId: defaultAccount,
    beneficiaryId: people.find((p) => p.name === "Famille")?.id || people[0]?.id,
    category: "",
    subCategory: "",
    isExtra: false,
    isSalary: false,
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
        setFormData((prev) => ({ ...prev, endMonth: calculatedEnd }));
      }
    }
  }, [formData.startMonth, durationMonths, durationMode, formData.isExtra, formData.endMonth]);

  const clearForm = () => {
    setFormData({
      label: "",
      amount: "",
      dayOfMonth: 1,
      accountId: accounts[0]?.id || "",
      beneficiaryId: people.find((p) => p.name === "Famille")?.id || people[0]?.id,
      category: "",
      subCategory: "",
      isExtra: false,
      isSalary: false,
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

  const handleEdit = (inc: IncomeConfig) => {
    setFormData(inc);
    setEditingId(inc.id);
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
      isSalary: false,
      startMonth: "",
      endMonth: "",
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    const errors: string[] = [];
    const amountVal = typeof formData.amount === "string" ? parseFloat(formData.amount.replace(",", ".")) : formData.amount;

    if (!formData.label?.trim()) errors.push("Le libellé est obligatoire");
    if (!amountVal || amountVal <= 0) errors.push("Le montant est obligatoire et doit être positif");
    if (!formData.dayOfMonth || formData.dayOfMonth < 1 || formData.dayOfMonth > 31) errors.push("Le jour du mois doit être entre 1 et 31");
    if (!formData.category) errors.push("La catégorie est obligatoire");
    if (!formData.accountId) errors.push("Le compte est obligatoire");
    if (!formData.beneficiaryId) errors.push("Le bénéficiaire est obligatoire");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    const final: IncomeConfig = {
      id: editingId || Date.now().toString(),
      label: formData.label,
      amount: amountVal || 0,
      accountId: formData.accountId,
      beneficiaryId: formData.beneficiaryId,
      dayOfMonth: formData.dayOfMonth,
      category: formData.category,
      subCategory: formData.subCategory,
      isExtra: formData.isExtra,
      isSalary: formData.isSalary,
      startMonth: formData.startMonth,
      endMonth: formData.endMonth,
    };
    editingId ? onUpdateIncome(final) : onAddIncome(final);
    clearForm();
  };

  const handleDelete = () => {
    if (editingId) {
      onDeleteIncome(editingId);
      clearForm();
    }
  };

  const sortedIncomes = useMemo(() => {
    return [...incomeConfigs].sort((a, b) => {
      let res = 0;
      if (sortKey === "label") {
        res = a.label.localeCompare(b.label);
      } else {
        res = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortOrder === "asc" ? res : -res;
    });
  }, [incomeConfigs, sortKey, sortOrder]);

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
      <Modal isOpen={isFormOpen} onClose={clearForm} title={editingId ? "Modifier le revenu" : "Nouveau Revenu Récurrent"}>
        <div className="space-y-2.5">
          <ValidationErrorBlock errors={validationErrors} ref={errorBlockRef} />

          <TextInput
            label="Libellé"
            value={formData.label}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, label: val }));
            }}
            placeholder="Ex: Salaire mensuel, CAF..."
            required
          />

          <AmountInput
            label="Montant"
            value={formData.amount}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, amount: val }));
            }}
            color="emerald"
            required
          />

          <TextInput
            label="Jour du mois"
            type="number"
            min={1}
            max={31}
            value={formData.dayOfMonth}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setFormData((prev) => ({ ...prev, dayOfMonth: isNaN(val) ? 1 : val }));
            }}
            required
          />

          <AccountSelector
            accounts={accounts}
            value={formData.accountId}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, accountId: val }));
            }}
            color="emerald"
            filterTypes={[AccountType.CHECKING]}
          />

          <BeneficiarySelector
            people={people}
            value={formData.beneficiaryId}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, beneficiaryId: val }));
            }}
            color="emerald"
          />

          <CategorySelector
            categories={categories}
            type="INCOME"
            selectedCategory={formData.category || ""}
            selectedSubCategory={formData.subCategory || ""}
            onCategoryChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
            onSubCategoryChange={(val) => setFormData((prev) => ({ ...prev, subCategory: val }))}
          />

          <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="salary"
                  checked={formData.isSalary}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData((prev) => ({ ...prev, isSalary: val }));
                  }}
                  className="h-5 w-5 text-emerald-600 rounded bg-white border-slate-300 focus:ring-emerald-500"
                />
                <div className="flex flex-col">
                  <label htmlFor="salary" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                    <Briefcase size={14} /> Revenu Structurel / Salaire
                  </label>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Finance le budget mensuel global. Exclu des statistiques "Revenus" de la période pour ne pas fausser le reste à vivre.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 pt-2.5">
                <input
                  type="checkbox"
                  id="extra"
                  checked={formData.isExtra}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData((prev) => ({ ...prev, isExtra: val }));
                  }}
                  className="h-5 w-5 text-emerald-600 rounded bg-white border-slate-300 focus:ring-emerald-500"
                />
                <div className="flex flex-col">
                  <label htmlFor="extra" className="text-sm font-bold text-slate-800 cursor-pointer">
                    Revenu Exceptionnel / Temporaire
                  </label>
                  <span className="text-[10px] text-slate-500 leading-tight">Revenu ponctuel qui ne se reproduira pas indéfiniment.</span>
                </div>
              </div>

              {formData.isExtra && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-slate-200">
                  <TextInput
                    label="Mois de début"
                    type="month"
                    value={formData.startMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, startMonth: val }));
                    }}
                    required={formData.isExtra}
                  />

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
              className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <Save size={18} /> Sauvegarder
            </button>
          </div>
        </div>
      </Modal>

      <DataList title="Modèles de Revenus" count={incomeConfigs.length} onAdd={handleAddClick} addButtonLabel="Créer un modèle">
        {sortedIncomes.map((inc) => {
          const accountName = accounts.find((a) => a.id === inc.accountId)?.name || "Compte Inconnu";
          const beneficiaryName = people.find((p) => p.id === inc.beneficiaryId)?.name || "?";
          return (
            <DataListRow
              key={inc.id}
              date={{ day: inc.dayOfMonth, month: "DU MOIS" }}
              label={inc.label}
              amount={inc.amount}
              isIncome={true}
              category={inc.category}
              subCategory={inc.subCategory}
              beneficiary={beneficiaryName}
              accountName={accountName}
              onClick={() => handleEdit(inc)}
              badge={
                <div className="flex gap-1">
                  {inc.isSalary && <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">Salaire</span>}
                  {inc.isExtra && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Temp</span>}
                </div>
              }
            />
          );
        })}
      </DataList>
    </div>
  );
};
