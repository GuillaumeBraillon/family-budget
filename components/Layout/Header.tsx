import React from "react";
import { WalletCards, Download } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { UserMenu } from "./UserMenu";
import { NAV_ITEMS, ViewState } from "../../constants/navigation";

interface HeaderProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  onLogout: () => void;
  userEmail?: string;
  session?: Session | null;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onLogout, userEmail, session }) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <>
      {/* HEADER DESKTOP & MOBILE TITLE */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onViewChange("dashboard")}>
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <WalletCards className="text-white h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
              Budget <span className="text-indigo-600">Famille</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* BOUTON PWA INSTALL */}
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors animate-in fade-in slide-in-from-top-2"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Installer</span>
              </button>
            )}

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex bg-slate-100 p-1 rounded-xl">
              {NAV_ITEMS.map((item) => (
                <NavBtn
                  key={item.id}
                  active={currentView === item.id}
                  onClick={() => onViewChange(item.id)}
                  icon={<item.icon size={16} />}
                  label={item.label}
                />
              ))}
            </nav>

            {/* USER & LOGOUT */}
            <UserMenu userEmail={userEmail} onLogout={onLogout} session={session} />
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16 px-1">
          {NAV_ITEMS.map((item) => (
            <MobileNavBtn
              key={item.id}
              active={currentView === item.id}
              onClick={() => onViewChange(item.id)}
              icon={<item.icon size={20} />}
              label={item.label}
            />
          ))}
        </div>
      </nav>
    </>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-3 lg:px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
      active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all active:scale-95 ${
      active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    <div className={`p-1 rounded-full transition-colors duration-300 ${active ? "bg-indigo-50 translate-y-[-2px]" : ""}`}>{icon}</div>
    <span className={`text-[9px] font-bold leading-none ${active ? "text-indigo-600" : "text-slate-400"}`}>{label === "Opérations" ? "Opés" : label}</span>
  </button>
);
