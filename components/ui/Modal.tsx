import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

/**
 * Molécule de modale standardisée pour toute l'application.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-lg w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`} onClick={(e) => e.stopPropagation()}>
        <div className="px-3 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-3 overflow-y-auto">{children}</div>

        {footer && <div className="px-3 py-3 border-t border-slate-100 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
};
