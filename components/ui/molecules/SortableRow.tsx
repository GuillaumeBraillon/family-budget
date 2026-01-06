import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableRowProps {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant générique pour rendre une ligne triable avec drag & drop.
 * Utilisé dans OperationsList et TransfersView.
 */
export const SortableRow: React.FC<SortableRowProps> = ({ id, disabled, children, className = "" }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center bg-white border-b border-slate-100 last:border-0 relative ${className}`}>
      {!disabled && (
        <div {...attributes} {...listeners} className="px-2 py-4 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 touch-none">
          <GripVertical size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
