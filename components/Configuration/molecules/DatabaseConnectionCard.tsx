
import React, { useState } from 'react';
import { Database, LogOut, RefreshCw, Hash, Key, AlertTriangle, X, Check, ShieldCheck, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { getSupabaseConfig } from '../../../services/supabase';

interface DatabaseConnectionCardProps {
  onReset: () => void;
}

export const DatabaseConnectionCard: React.FC<DatabaseConnectionCardProps> = ({ onReset }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { projectId, isFromEnv } = getSupabaseConfig();

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          Connexion Base de Données
        </CardTitle>
        {!showConfirm && (
          <div className="flex items-center gap-2">
            {isFromEnv ? (
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1 border border-indigo-200">
                <ShieldCheck size={10} /> SOURCE : SYSTÈME (.env)
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1 border border-slate-200">
                <HardDrive size={10} /> SOURCE : NAVIGATEUR
              </span>
            )}
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
              <RefreshCw size={10} className="animate-spin-slow" /> CONNECTÉ
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {showConfirm ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in zoom-in duration-200">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">Réinitialiser la connexion ?</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Cette action supprimera vos identifiants locaux. {isFromEnv && "Note : Les variables d'environnement (.env) resteront prioritaires si elles sont présentes."}
                </p>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={onReset}
                    className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-amber-700 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} /> Confirmer
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 bg-white border border-amber-200 text-amber-700 py-2 rounded-lg text-xs font-bold hover:bg-amber-50 flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Hash size={12} /> Project ID
                </label>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
                  {projectId || 'Non défini'}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Key size={12} /> Clé API (Anon)
                </label>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-400">
                  ••••••••••••••••••••••••••••••
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50">
              <h4 className="text-xs font-bold text-indigo-900 mb-2">Origine de la configuration</h4>
              <p className="text-[11px] text-indigo-700 leading-relaxed mb-4">
                {isFromEnv 
                  ? "Les réglages sont verrouillés par le fichier de configuration système (.env). Pour les modifier, éditez vos variables d'environnement sur votre serveur ou fichier local."
                  : "Les réglages sont stockés localement dans votre navigateur (LocalStorage). Vous pouvez les réinitialiser pour changer de projet Supabase via l'écran d'accueil."}
              </p>
              {!isFromEnv && (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <LogOut size={14} />
                  Réinitialiser la connexion
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
