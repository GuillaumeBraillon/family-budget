import React from "react";
import { Database, ShieldCheck, HardDrive, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/Card";
import { getSupabaseConfig } from "../../../../../services/supabase";

export const DatabaseConnectionCard: React.FC = () => {
  const { projectId, isFromEnv } = getSupabaseConfig();

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          Connexion Base de Données
        </CardTitle>
        <div className="flex items-center gap-2">
          {isFromEnv ? (
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1 border border-indigo-200">
              <ShieldCheck size={10} /> SOURCE : SYSTÈME (.env)
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1 border border-slate-200">
              <HardDrive size={10} /> SOURCE : INCONNUE
            </span>
          )}
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
            <RefreshCw size={10} className="animate-spin-slow" /> CONNECTÉ
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-600 overflow-x-auto">
          <div>Project ID : {projectId || "Non configuré"}</div>
          <div>Mode : {isFromEnv ? "Production (Environment Variables)" : "Développement"}</div>
        </div>
      </CardContent>
    </Card>
  );
};
