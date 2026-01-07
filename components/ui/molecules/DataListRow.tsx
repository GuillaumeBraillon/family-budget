import React from "react";
import { ChevronRight, Tag as TagIcon, User, Users, CreditCard, Clock, CheckCircle2, Info, RefreshCcw } from "lucide-react";
import { MobileTooltip } from "../MobileTooltip";
import { Tag, TagAmount } from "../../../types";

interface DataListRowProps {
  date?: { day: string | number; month: string };
  icon?: React.ReactNode;
  label: string;
  amount?: number;
  originalAmount?: number;
  isIncome?: boolean;
  category?: string;
  subCategory?: string;
  beneficiary?: string;
  isChild?: boolean;
  accountName?: string;
  isPaid?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  comments?: string;
  tags?: Tag[];
  tagAmounts?: TagAmount[]; // Nouveau: ventilation des montants
}

export const DataListRow: React.FC<DataListRowProps> = ({
  date,
  icon,
  label,
  amount,
  originalAmount,
  isIncome,
  category,
  subCategory,
  beneficiary,
  isChild,
  accountName,
  isPaid,
  onClick,
  badge,
  comments,
  tags = [],
  tagAmounts,
}) => {
  const isPending = isPaid === false;

  // Logique d'affichage : Si c'est un Revenu OU si le montant est négatif (remboursement dans une dépense), c'est Vert.
  // Sinon c'est une dépense classique (Noir).
  // Note: on utilise Math.abs(amount) pour l'affichage du chiffre, mais le signe détermine la couleur.
  const numericAmount = amount ?? 0;
  const isPositiveFlow = isIncome || numericAmount < 0;

  // Détection visuelle remboursement (Dépense négative)
  const isRefund = !isIncome && numericAmount < 0;

  const bgClass = isPending ? "bg-amber-50 border-l-4 border-l-amber-400" : "bg-white hover:bg-slate-50 border-l-4 border-l-transparent";

  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 flex items-center gap-2 sm:gap-4 group transition-all cursor-pointer border-b border-slate-100 last:border-0 ${bgClass}`}
    >
      {/* STATUS INDICATOR */}
      <div className="flex-shrink-0 w-5 sm:w-8 flex items-center justify-center">
        {isPending ? (
          <Clock size={16} className="text-amber-500 animate-pulse sm:w-[18px] sm:h-[18px]" />
        ) : (
          <CheckCircle2 size={16} className="text-emerald-500 sm:w-[18px] sm:h-[18px]" />
        )}
      </div>

      {/* DATE / ICON BOX */}
      {date ? (
        <div
          className={`flex-shrink-0 w-10 sm:w-12 text-center flex flex-col items-center justify-center rounded-lg py-1 sm:py-1.5 border ${
            isPending ? "bg-amber-100 border-amber-200" : "bg-slate-50 border-slate-100"
          }`}
        >
          <span className="text-sm sm:text-lg font-bold block text-slate-700 leading-none">{date.day}</span>
          <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">{date.month}</span>
        </div>
      ) : icon ? (
        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
        </div>
      ) : null}

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
          <span className="font-bold truncate text-slate-900 text-sm sm:text-base">{label}</span>
          {isRefund && (
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
              <RefreshCcw size={10} /> Remboursement
            </span>
          )}
          {badge}
          {comments && (
            <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
              <MobileTooltip text={comments} icon={<Info size={12} className="text-indigo-400 hover:text-indigo-600" />} widthClass="w-48" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 flex-wrap leading-tight">
          {(category || subCategory) && (
            <span className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200/50 truncate max-w-[110px] sm:max-w-none">
              <TagIcon size={10} />
              <span className="sm:hidden">{subCategory || category}</span>
              <span className="hidden sm:inline">
                {category}
                {subCategory && <span className="opacity-70"> &gt; {subCategory}</span>}
              </span>
            </span>
          )}
          {beneficiary && (
            <span className="flex items-center gap-1 text-slate-500 font-medium whitespace-nowrap">
              {isChild ? <User size={10} /> : <Users size={10} />} {beneficiary}
            </span>
          )}
          {accountName && (
            <span className="hidden sm:flex items-center gap-1 text-slate-400 font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
              <CreditCard size={10} /> {accountName}
            </span>
          )}
          {/* TAGS */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag) => {
                const tagAmount = tagAmounts?.find((ta) => ta.tagId === tag.id);
                return (
                  <span
                    key={tag.id}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap flex items-center gap-1"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    {tagAmount && <span className="opacity-90">({tagAmount.amount.toFixed(2)}€)</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AMOUNT & ACTION */}
      <div className="text-right flex items-center gap-1 sm:gap-3">
        {amount !== undefined && (
          <div>
            <div className={`font-black text-sm sm:text-base ${isPositiveFlow ? "text-emerald-600" : "text-slate-900"}`}>
              {isPositiveFlow ? "+" : ""}
              {Math.abs(numericAmount).toFixed(2)} €
            </div>
            {originalAmount !== undefined && Math.abs(numericAmount - originalAmount) > 0.01 && (
              <div className="text-[9px] sm:text-[10px] text-amber-600 font-bold whitespace-nowrap">Prévu: {originalAmount.toFixed(2)}</div>
            )}
          </div>
        )}
        {onClick && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all sm:w-[18px] sm:h-[18px]" />}
      </div>
    </div>
  );
};
