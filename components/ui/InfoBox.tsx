
import React from 'react';
import { Info } from 'lucide-react';

interface InfoBoxProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ title, description, icon, className = "" }) => {
  return (
    <div className={`bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 ${className}`}>
      <div className="text-indigo-600 mt-0.5 flex-shrink-0">
        {icon || <Info size={18} />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-indigo-900">{title}</h4>
        <p className="text-xs text-indigo-700 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
};
