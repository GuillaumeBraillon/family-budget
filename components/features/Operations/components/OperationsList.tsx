import React from "react";
import { PlannedItem, Person, Account, Tag } from "../../../../types";
import { DataList } from "../../../ui/molecules/DataList";
import { DataListRow } from "../../../ui/molecules/DataListRow";
import { SortableRow } from "../../../ui/molecules/SortableRow";
import { ShoppingBag, CalendarClock, Plus, Briefcase, Download } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface OperationsListProps {
  items: PlannedItem[];
  monthShort: string;
  people: Person[];
  accounts: Account[];
  tags: Tag[];
  currentDate: Date;
  onItemClick: (item: PlannedItem) => void;
  onAddClick: () => void;
  onExport?: () => void;
  onReorder?: (item: PlannedItem, oldIndex: number, newIndex: number) => void;
}

export const OperationsList: React.FC<OperationsListProps> = ({
  items,
  monthShort,
  people,
  accounts,
  tags,
  currentDate,
  onItemClick,
  onAddClick,
  onExport,
  onReorder,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && onReorder) {
      const oldIndex = items.findIndex((i) => i.instanceId === active.id);
      const newIndex = items.findIndex((i) => i.instanceId === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const itemToMove = items[oldIndex];
        // On passe simplement les index, le parent calculera la position mathématique
        onReorder(itemToMove, oldIndex, newIndex);
      }
    }
  };

  const getExtraProgress = (item: PlannedItem) => {
    if (!item.isExtra || !item.startMonth || !item.endMonth) return null;
    const start = new Date(item.startMonth + "-01");
    const end = new Date(item.endMonth + "-01");
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const currentMonthIndex = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth()) + 1;
    return { text: `${currentMonthIndex}/${totalMonths}`, isLast: currentMonthIndex === totalMonths };
  };

  const headerActions =
    onExport && items.length > 0 ? (
      <button
        onClick={onExport}
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
        title="Exporter en CSV"
      >
        <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
      </button>
    ) : null;

  return (
    <div className="space-y-4">
      <DataList
        title="Détail des opérations"
        count={items.length}
        onAdd={onAddClick}
        addButtonLabel="Ajouter"
        emptyMessage="Aucune opération ne correspond à vos filtres pour cette période."
        headerActions={headerActions}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.instanceId)} strategy={verticalListSortingStrategy}>
            {items.map((item) => {
              const progress = getExtraProgress(item);
              const person = people.find((p) => p.id === item.beneficiaryId);
              const account = accounts.find((a) => a.id === item.accountId);
              const isVariable = item.source === "VARIABLE";
              const itemTags = item.tagAmounts ? tags.filter((t) => item.tagAmounts?.some((ta) => ta.tagId === t.id)) : [];

              const content = (
                <DataListRow
                  key={item.instanceId} // Key technique
                  date={{ day: item.day, month: monthShort }}
                  label={item.label}
                  amount={item.amount}
                  originalAmount={isVariable ? undefined : item.originalAmount}
                  isIncome={item.type === "INCOME"}
                  category={item.category}
                  subCategory={item.subCategory}
                  beneficiary={person?.name}
                  isChild={person?.isChild}
                  accountName={account?.name}
                  isPaid={!!item.isPaid}
                  onClick={() => onItemClick(item)}
                  comments={item.comments}
                  tags={itemTags}
                  tagAmounts={item.tagAmounts}
                  badge={
                    <div className="flex gap-1 items-center">
                      {isVariable ? (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                          <ShoppingBag size={10} /> Variable
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                          <CalendarClock size={10} /> Récurrent
                        </span>
                      )}

                      {item.isSalary && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                          <Briefcase size={10} /> Salaire
                        </span>
                      )}

                      {item.isExtra &&
                        (progress ? (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              progress.isLast ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            Temp {progress.text}
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">EXTRA</span>
                        ))}
                    </div>
                  }
                />
              );

              if (onReorder) {
                return (
                  <SortableRow key={item.instanceId} id={item.instanceId}>
                    {content}
                  </SortableRow>
                );
              }
              return <div key={item.instanceId}>{content}</div>;
            })}
          </SortableContext>
        </DndContext>
      </DataList>
      {items.length > 0 && (
        <button
          onClick={onAddClick}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
        >
          <Plus size={18} /> Nouvelle opération
        </button>
      )}
    </div>
  );
};
