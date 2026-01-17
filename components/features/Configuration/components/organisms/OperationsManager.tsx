import React, { useState } from "react";
import { ExpenseRulesEditor } from "./ExpenseRulesEditor";
import { IncomeEditor } from "./IncomeEditor";
import { CategoryTypeSelector } from "../molecules/CategoryTypeSelector";
import { ListSorter } from "../../../../ui/molecules/ListSorter";
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account } from "../../../../../types";
import { SortOrder } from "../../../../../types";
import { InfoBox } from "@/components/ui/InfoBox";
import { CalendarRange } from "lucide-react";

interface OperationsManagerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  onAddConfig: (c: ExpenseConfig) => void;
  onUpdateConfig: (c: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome: (i: IncomeConfig) => void;
  onUpdateIncome: (i: IncomeConfig) => void;
  onDeleteIncome: (id: string) => void;
}

export const OperationsManager: React.FC<OperationsManagerProps> = ({
  configs,
  incomeConfigs,
  categories,
  people,
  accounts,
  onAddConfig,
  onUpdateConfig,
  onDeleteConfig,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
}) => {
  const [mode, setMode] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [sortKey, setSortKey] = useState<string>("dayOfMonth");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sortOptions = [
    { key: "dayOfMonth", label: "Date" },
    { key: "label", label: "Libellé" },
    { key: "amount", label: "Montant" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <CategoryTypeSelector mode={mode} onChange={setMode} />
          <ListSorter
            options={sortOptions}
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSortChange={(k, o) => {
              setSortKey(k);
              setSortOrder(o);
            }}
          />
        </div>
      </div>
      <InfoBox
        title="Opérations Récurrentes"
        description="Définissez vos revenus mensuels (salaires, aides) et dépenses fixes (loyer, abonnements). Génère automatiquement l'échéancier mensuel."
        icon={<CalendarRange size={18} />}
      />
      {mode === "EXPENSE" ? (
        <ExpenseRulesEditor
          configs={configs}
          categories={categories}
          people={people}
          accounts={accounts}
          onAddConfig={onAddConfig}
          onUpdateConfig={onUpdateConfig}
          onDeleteConfig={onDeleteConfig}
          sortKey={sortKey}
          sortOrder={sortOrder}
        />
      ) : (
        <IncomeEditor
          incomeConfigs={incomeConfigs}
          people={people}
          categories={categories}
          accounts={accounts}
          onAddIncome={onAddIncome}
          onUpdateIncome={onUpdateIncome}
          onDeleteIncome={onDeleteIncome}
          sortKey={sortKey}
          sortOrder={sortOrder}
        />
      )}
    </div>
  );
};
