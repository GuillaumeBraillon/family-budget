import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

interface MobileTooltipProps {
  text: React.ReactNode;
  icon?: React.ReactNode;
  iconSize?: number;
  iconClassName?: string;
  widthClass?: string;
}

export const MobileTooltip: React.FC<MobileTooltipProps> = ({
  text,
  icon,
  iconSize = 14,
  iconClassName = "text-slate-300 hover:text-indigo-500",
  widthClass = "w-56",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [adjustedLeft, setAdjustedLeft] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
      setAdjustedLeft(null);
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const margin = 10;

      // Calcul du débordement
      let newLeft = position.left;
      const halfWidth = rect.width / 2;

      if (newLeft + halfWidth > screenWidth - margin) {
        newLeft = screenWidth - margin - halfWidth;
      } else if (newLeft - halfWidth < margin) {
        newLeft = margin + halfWidth;
      }

      if (newLeft !== position.left) {
        setAdjustedLeft(newLeft);
      }
    }
  }, [isOpen, position.left]);

  const currentLeft = adjustedLeft ?? position.left;
  const arrowOffset = position.left - currentLeft;

  return (
    <>
      <button type="button" onClick={toggle} className={`inline-flex align-middle transition-colors ml-1 ${iconClassName}`}>
        {icon || <Info size={iconSize} />}
      </button>
      {isOpen &&
        createPortal(
          <div className="relative z-[9999]">
            <div
              className="fixed inset-0 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            <div
              ref={tooltipRef}
              className={`fixed ${widthClass} p-2 bg-white border border-slate-300 text-slate-800 text-[10px] rounded-lg shadow-xl animate-in zoom-in-95 fade-in duration-200 normal-case font-normal tracking-normal text-left`}
              style={{
                top: position.top - 6,
                left: currentLeft,
                transform: "translate(-50%, -100%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-1 font-bold border-b border-slate-200 pb-1">
                <span>Détails</span>
                <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setIsOpen(false)} />
              </div>
              {text}
              <div
                className="absolute top-full border-4 border-transparent border-t-white"
                style={{
                  left: "50%",
                  transform: `translateX(calc(-50% + ${arrowOffset}px))`,
                }}
              ></div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
