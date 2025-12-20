
import React from 'react';
import { AccountType } from '../../../types';

interface LabelTypeSelectorProps {
  type: AccountType;
  onChange: (type: AccountType) => void;
}

export const LabelTypeSelector: React.FC<LabelTypeSelectorProps> = ({ type, onChange }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => onChange(AccountType.CHECKING)}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${type === AccountType.CHECKING ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Comptes Courants
        </button>
        <button 
          onClick={() => onChange(AccountType.SAVINGS)}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${type === AccountType.SAVINGS ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Comptes Épargne
        </button>
      </div>
    </div>
  );
};
