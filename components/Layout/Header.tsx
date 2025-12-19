
import React from 'react';
import { WalletCards, LayoutDashboard, CalendarCheck, Settings, PiggyBank } from 'lucide-react';

type ViewState = 'dashboard' | 'planner' | 'savings' | 'config';

interface HeaderProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

/**
 * Composant de navigation principal.
 * Affiche le logo et les onglets de navigation avec un style responsive.
 */
export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => onViewChange('dashboard')}
        >
          <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <WalletCards className="text-white h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold">Budget <span className="text-indigo-600">Famille</span></h1>
        </div>
        
        <nav className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <NavBtn 
            active={currentView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')} 
            icon={<LayoutDashboard size={16}/>} 
            label="Dashboard" 
          />
          <NavBtn 
            active={currentView === 'planner'} 
            onClick={() => onViewChange('planner')} 
            icon={<CalendarCheck size={16}/>} 
            label="Échéancier" 
          />
          <NavBtn 
            active={currentView === 'savings'} 
            onClick={() => onViewChange('savings')} 
            icon={<PiggyBank size={16}/>} 
            label="Épargne" 
          />
          <NavBtn 
            active={currentView === 'config'} 
            onClick={() => onViewChange('config')} 
            icon={<Settings size={16}/>} 
            label="Paramètres" 
          />
        </nav>
      </div>
    </header>
  );
};

/**
 * Bouton de navigation individuel.
 */
const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
      active 
        ? 'bg-white text-indigo-600 shadow-sm' 
        : 'text-slate-500 hover:text-slate-900'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
