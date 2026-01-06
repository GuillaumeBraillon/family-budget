import React, { useState } from "react";
import { Trash2, Database } from "lucide-react";

/**
 * Composant de gestion du localStorage (cache et préférences utilisateur).
 * Permet de réinitialiser les préférences sans perdre la connexion Supabase.
 */
export const LocalStorageManager: React.FC = () => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearLocalStorage = () => {
    // Préserver uniquement la connexion Supabase
    const supabaseProjectId = localStorage.getItem("SUPABASE_PROJECT_ID");
    const supabaseAnonKey = localStorage.getItem("SUPABASE_ANON_KEY");

    localStorage.clear();

    if (supabaseProjectId) localStorage.setItem("SUPABASE_PROJECT_ID", supabaseProjectId);
    if (supabaseAnonKey) localStorage.setItem("SUPABASE_ANON_KEY", supabaseAnonKey);

    setShowClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-slate-100 p-2 rounded-lg">
          <Database size={20} className="text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900">Données locales (Cache)</h3>
          <p className="text-xs text-slate-500 mt-1">Vos préférences d'affichage sont enregistrées localement dans votre navigateur (filtres, tri, etc.)</p>
        </div>
      </div>

      {!showClearConfirm ? (
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 justify-center"
        >
          <Trash2 size={14} />
          Réinitialiser les préférences
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <h4 className="text-sm font-bold text-amber-900 mb-2">Confirmer la réinitialisation</h4>
          <p className="text-xs text-amber-800 mb-4">
            Cela va supprimer tous vos filtres sauvegardés, préférences de tri et cache local. Vos données en base ne seront pas affectées.
          </p>
          <div className="flex gap-2">
            <button onClick={clearLocalStorage} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors">
              Confirmer
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
