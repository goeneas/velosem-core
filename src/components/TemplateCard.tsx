
import React from 'react';
import { TemplateSection } from '../types';

interface TemplateCardProps {
  template: TemplateSection;
  isActive: boolean;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border-2 group ${
        isActive 
          ? 'bg-white border-[#f14924] shadow-xl shadow-[#f14924]/10 ring-4 ring-[#f14924]/5' 
          : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
         <h3 className={`font-bold text-[12px] uppercase tracking-tight ${isActive ? 'text-[#0F172A]' : 'text-slate-500 group-hover:text-slate-700'}`}>
          {template.name}
        </h3>
        {isActive && (
          <div className="w-1.5 h-1.5 bg-[#f14924] rounded-full"></div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
        {template.description}
      </p>
    </button>
  );
};

export default TemplateCard;
