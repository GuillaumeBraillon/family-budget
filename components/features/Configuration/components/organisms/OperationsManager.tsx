import React, { useState } from "react";
import { ExpenseRulesEditor } from "./ExpenseRulesEditor";
import { IncomeEditor } from "./IncomeEditor";
import { CategoryTypeSelector } from "../molecules/CategoryTypeSelector";
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account } from "../../../../../types";

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

  return (
    <div className="space-y-4">
      <CategoryTypeSelector mode={mode} onChange={setMode} />

      {mode === "EXPENSE" ? (
        <ExpenseRulesEditor
          configs={configs}
          categories={categories}
          people={people}
          accounts={accounts}
          onAddConfig={onAddConfig}
          onUpdateConfig={onUpdateConfig}
          onDeleteConfig={onDeleteConfig}
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
        />
      )}
    </div>
  );
};
