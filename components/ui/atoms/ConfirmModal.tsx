
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full overflow-hidden">
         <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-red-600">
            <AlertCircle size={24} />
            <h3 className="font-semibold text-slate-900">{title}</h3>
         </div>
         <div className="p-6">
            <div className="text-slate-600 mb-6 text-sm">{message}</div>
            <div className="flex gap-3 justify-end">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 text-sm"
                >
                    Annuler
                </button>
                <button 
                    onClick={onConfirm} 
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm text-sm"
                >
                    Supprimer
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};
