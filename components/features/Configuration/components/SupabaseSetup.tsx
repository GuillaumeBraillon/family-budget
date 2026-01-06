import React, { useState } from "react";
import { Database, Key, Hash, ArrowRight, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";

interface SupabaseSetupProps {
  onConfigured: () => void;
}

export const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onConfigured }) => {
  const [projectId, setProjectId] = useState("");
  const [key, setKey] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId && key) {
      localStorage.setItem("supabase_project_id", projectId.trim());
      localStorage.setItem("supabase_key", key.trim());
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-indigo-100 animate-in zoom-in duration-300">
        <CardHeader className="text-center bg-indigo-50/50 py-8 border-b border-indigo-100">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Database className="text-white" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Connexion Supabase</CardTitle>
          <p className="text-sm text-slate-500 mt-2 px-6">Liez l'application à votre propre base de données pour sauvegarder vos finances.</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                <Hash size={14} className="text-indigo-500" /> ID du Projet
              </label>
              <input
                type="text"
                required
                placeholder="Ex: abcdefghijklmnopqrst"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white shadow-sm font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider">
                <Key size={14} className="text-indigo-500" /> Clé API (Publishable / Anon)
              </label>
              <input
                type="password"
                required
                placeholder="Votre clé publique anon"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Info size={12} /> Où trouver ces informations ?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dans Supabase :<br />
                  1. <strong>Project Settings {">"} General</strong> pour le <strong>Project ID</strong>.<br />
                  2. <strong>Project Settings {">"} API</strong> pour la <strong>Publishable key</strong> (anon public).
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-tight">L'URL de votre base de données sera automatiquement générée à partir de l'ID.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
              >
                Valider la configuration
                <ArrowRight size={18} />
              </button>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mt-6 hover:text-indigo-600 transition-colors"
              >
                Ouvrir mon Dashboard Supabase <ExternalLink size={12} />
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
