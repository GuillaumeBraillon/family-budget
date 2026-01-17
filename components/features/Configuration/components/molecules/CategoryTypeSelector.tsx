import React from "react";

interface CategoryTypeSelectorProps {
  mode: "EXPENSE" | "INCOME";
  onChange: (mode: "EXPENSE" | "INCOME") => void;
}

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="flex justify-center">
      <div className="flex bg-slate-100 rounded-lg">
        <button
          onClick={() => onChange("EXPENSE")}
          className={`h-[30px] px-6 text-sm font-medium rounded-md transition-all flex items-center justify-center ${mode === "EXPENSE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Dépenses
        </button>
        <button
          onClick={() => onChange("INCOME")}
          className={`h-[30px] px-6 text-sm font-medium rounded-md transition-all flex items-center justify-center ${mode === "INCOME" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Revenus
        </button>
      </div>
    </div>
  );
};
