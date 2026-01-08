import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { UserInfoCard } from "../features/Configuration/components/molecules/UserInfoCard";

interface UserMenuProps {
  userEmail?: string;
  onLogout: () => void;
  session?: Session | null;
}

/**
 * Menu utilisateur affichant l'email connecté et le bouton de déconnexion.
 * Version responsive avec affichage simplifié sur mobile.
 * Clic sur l'avatar/nom affiche les détails du compte.
 */
export const UserMenu: React.FC<UserMenuProps> = ({ userEmail, onLogout, session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
  const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name;

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative flex items-center gap-2 pl-2 border-l border-slate-100 ml-2" ref={menuRef}>
      {/* AVATAR MOBILE */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden focus:outline-none" title="Voir les infos du compte">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-slate-200 hover:border-indigo-400 transition-colors" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <User size={16} />
          </div>
        )}
      </button>

      {/* INFO DESKTOP */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors focus:outline-none group"
        title="Voir les infos du compte"
      >
        {avatarUrl && (
          <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-indigo-400 transition-colors" />
        )}
        <div className="flex flex-col items-end mr-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connecté</span>
          <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">{userName || userEmail?.split("@")[0]}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* BOUTON DÉCONNEXION */}
      <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Se déconnecter">
        <LogOut size={18} />
      </button>

      {/* DROPDOWN AVEC INFOS UTILISATEUR */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <UserInfoCard session={session} />
        </div>
      )}
    </div>
  );
};
