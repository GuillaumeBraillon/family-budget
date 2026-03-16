import React from "react";
import { Plus, Calendar } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useBudget } from "../../../hooks/useBudget";

interface DataListProps {
  title: string;
  count?: number;
  onAdd?: () => void;
  addButtonLabel?: string;
  children: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export const DataList: React.FC<DataListProps> = ({
  title,
  count,
  onAdd,
  addButtonLabel = "Ajouter",
  children,
  emptyMessage = "Aucun élément.",
  className = "",
  headerActions,
}) => {
  const { user } = useAuth();
  const { authorizedUsers } = useBudget();
  const currentEmail = user?.email;
  const isAdmin = !!authorizedUsers.find((u) => u.email === currentEmail && !!u.isAdmin);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-between items-center flex-shrink-0">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          {title}
          {count !== undefined && <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{count}</span>}
        </h2>
        <div className="flex items-center gap-2">
          {headerActions}
          {onAdd && isAdmin && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={14} /> {addButtonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Suppression de divide-y pour éviter les conflits de bordures sur les enfants */}
      <div className="overflow-y-auto">
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
              <Calendar size={24} className="text-slate-300" />
            </div>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
