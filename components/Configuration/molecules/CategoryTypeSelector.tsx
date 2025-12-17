import React from 'react';

interface CategoryTypeSelectorProps {
  mode: 'EXPENSE' | 'INCOME';
  onChange: (mode: 'EXPENSE' | 'INCOME') => void;
}

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => onChange('EXPENSE')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'EXPENSE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          Catégories Dépenses
        </button>
        <button 
          onClick={() => onChange('INCOME')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
        >
          Types de Revenus
        </button>
      </div>
    </div>
  );
};