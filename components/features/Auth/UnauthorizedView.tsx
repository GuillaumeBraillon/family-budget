import React from "react";
import { ShieldX, Mail, LogOut } from "lucide-react";

interface UnauthorizedViewProps {
  userEmail?: string;
  onLogout: () => void;
}

/**
 * Vue affichée lorsqu'un utilisateur non autorisé tente d'accéder à l'application.
 */
export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({ userEmail, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center border border-rose-100 animate-in zoom-in duration-300">
        <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
          <ShieldX size={40} />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">Accès Refusé</h2>

        <p className="text-slate-600 mb-6 leading-relaxed">
          Vous êtes connecté avec <span className="font-semibold text-slate-900">{userEmail}</span>, mais cet email n'est pas autorisé à accéder à cette
          application.
        </p>

        <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
          <div className="flex items-start gap-3 text-left">
            <Mail size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-1">Comment obtenir l'accès ?</p>
              <p>Contactez l'administrateur de l'application pour qu'il ajoute votre email à la liste des utilisateurs autorisés.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};
