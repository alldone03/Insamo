import React from 'react';
import { Info } from 'lucide-react';

/**
 * Small hover/click info icon that reveals an explanatory card.
 * Used to explain what a stat/metric actually means and how it's computed,
 * without cluttering the main UI with permanent paragraphs of text.
 */
const InfoPopover = ({ title, children, align = 'dropdown-end' }) => {
  return (
    <div className={`dropdown dropdown-hover ${align}`}>
      <button
        type="button"
        tabIndex={0}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full opacity-50 hover:opacity-100 hover:text-info transition-opacity align-middle"
        aria-label={title ? `Info: ${title}` : 'Info'}
      >
        <Info size={14} />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-[100] card card-compact w-72 p-3 shadow-xl bg-base-100 border border-base-200 text-left normal-case"
      >
        {title && <h4 className="font-black text-[11px] uppercase tracking-wide mb-1 text-base-content">{title}</h4>}
        <div className="text-[11px] leading-relaxed font-normal text-base-content/80 space-y-1">{children}</div>
      </div>
    </div>
  );
};

export default InfoPopover;
