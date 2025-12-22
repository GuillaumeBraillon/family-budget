
import React from 'react';
import { WalletCards, ArrowRight } from 'lucide-react';

interface WelcomeEmptyStateProps {
  onStartConfig: () => void;
}

export const WelcomeEmptyState: React.FC<WelcomeEmptyStateProps> = ({ onStartConfig }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-indigo-50 p-6 rounded-full shadow-lg shadow-indigo-100">
        <WalletCards size={48} className="text-indigo-600" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Bienvenue sur votre Budget</h2>
        <p className="text-slate-500">
          Commencez par configurer les membres de votre foyer et vos comptes bancaires pour utiliser l'application.
        </p>
      </div>
      <button 
        onClick={onStartConfig}
        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
      >
        Commencer la configuration <ArrowRight size={20} />
      </button>
    </div>
  );
};
