import React from "react";
import { ConfigTab } from "../../../../../hooks/useConfigurationUI";
import { Settings2, Users, CreditCard, Tag, List, CalendarRange, Bookmark, Shield } from "lucide-react";

interface ConfigurationTabsProps {
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
}

interface TabGroup {
  label: string;
  tabs: { id: ConfigTab; label: string; icon: React.ReactNode }[];
}

export const ConfigurationTabs: React.FC<ConfigurationTabsProps> = ({ activeTab, onTabChange }) => {
  const groups: TabGroup[] = [
    {
      label: "Configuration",
      tabs: [
        { id: "general", label: "Général", icon: <Settings2 size={14} /> },
        { id: "operations", label: "Opérations", icon: <CalendarRange size={14} /> },
        { id: "categories", label: "Catégories", icon: <Tag size={14} /> },
        { id: "labels", label: "Libellés", icon: <List size={14} /> },
        { id: "tags", label: "Tags", icon: <Bookmark size={14} /> },
        { id: "accounts", label: "Comptes", icon: <CreditCard size={14} /> },
        { id: "family", label: "Bénéficiaires", icon: <Users size={14} /> },
        { id: "users", label: "Utilisateurs", icon: <Shield size={14} /> },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{group.label}</h4>
            <div className="flex flex-wrap gap-2">
              {group.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    activeTab === tab.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-b border-slate-200 opacity-60"></div>
    </div>
  );
};
