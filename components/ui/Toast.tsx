import React, { useEffect } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
    warning: "bg-amber-600 text-white",
    info: "bg-indigo-600 text-white",
  };

  const icons = {
    success: <Check size={18} />,
    error: <X size={18} />,
    warning: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 ${styles[type]}`} onClick={onClose}>
      <div className="flex items-center gap-2">
        {icons[type]}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};
