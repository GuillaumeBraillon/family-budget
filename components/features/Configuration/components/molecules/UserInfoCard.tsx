import React from "react";
import { UserCircle, Mail, Calendar, Shield } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface UserInfoCardProps {
  session: Session | null;
}

/**
 * Carte affichant les informations de connexion de l'utilisateur Google.
 */
export const UserInfoCard: React.FC<UserInfoCardProps> = ({ session }) => {
  if (!session || !session.user) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <UserCircle size={18} className="text-indigo-600" />
          Informations de Connexion
        </h3>
        <p className="text-xs text-slate-500">Aucune donnée utilisateur</p>
      </div>
    );
  }

  const { user } = session;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name;
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <UserCircle size={18} className="text-indigo-600" />
        Informations de Connexion
      </h3>

      <div className="space-y-3">
        {/* Avatar & Nom */}
        {(avatarUrl || userName) && (
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            {avatarUrl && <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-slate-200" />}
            {userName && (
              <div>
                <div className="text-xs font-medium text-slate-500">Nom complet</div>
                <div className="text-sm text-slate-900 font-bold">{userName}</div>
              </div>
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex items-start gap-3">
          <Mail size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-slate-500">Email</div>
            <div className="text-sm text-slate-900 font-medium">{user.email || "N/A"}</div>
          </div>
        </div>

        {/* Provider */}
        {user.app_metadata?.provider && (
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-slate-500">Fournisseur</div>
              <div className="text-sm text-slate-900 font-medium capitalize">{user.app_metadata.provider}</div>
            </div>
          </div>
        )}

        {/* Compte créé le */}
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-slate-500">Compte créé le</div>
            <div className="text-sm text-slate-900">{createdAt}</div>
          </div>
        </div>

        {/* Dernière connexion */}
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-slate-500">Dernière connexion</div>
            <div className="text-sm text-slate-900">{lastSignIn}</div>
          </div>
        </div>

        {/* ID Utilisateur (technique) */}
        {user.id && (
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-400 mb-1">ID Utilisateur</div>
            <code className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 break-all block">{user.id}</code>
          </div>
        )}
      </div>
    </div>
  );
};
