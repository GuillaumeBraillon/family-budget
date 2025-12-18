
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeEmptyStateProps {
  onStartConfig: () => void;
}

/**
 * Vue affichée lorsque la base de données ne contient aucune configuration.
 * Guide l'utilisateur vers les premières étapes de paramétrage.
 */
export const WelcomeEmptyState: React.FC<WelcomeEmptyStateProps> = ({ onStartConfig }) => {
  return (
    <div className="mb-12 p-8 bg-white border border-indigo-100 rounded-3xl flex flex-col items-center text-center gap-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-indigo-100 p-5 rounded-full text-indigo-600 shadow-inner">
        <Sparkles size={40} />
      </div>
      <div className="max-w-md">
        <h3 className="text-2xl font-bold text-slate-900">Bienvenue dans votre nouveau gestionnaire !</h3>
        <p className="text-slate-500 mt-3 leading-relaxed">
          Votre espace est prêt, mais il est encore vide. Commencez par définir les <strong>membres de votre foyer</strong> et vos <strong>comptes bancaires</strong> pour activer le tableau de bord.
        </p>
      </div>
      <button 
        onClick={onStartConfig} 
        className="group bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
      >
        Commencer la configuration
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
