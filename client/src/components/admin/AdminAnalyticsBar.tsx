import React from "react";
import { AnalyticsData, TicketCategory } from "../../types";

interface Props {
  analytics: AnalyticsData | null;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const AdminAnalyticsBar: React.FC<Props> = ({ analytics, selectedCategory, onSelectCategory }) => {
  if (!analytics) return null;

  const { overview, categoryBreakdown } = analytics;

  return (
    <div className="space-y-3 font-sans">
      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="admin-analytics-strip">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Queue Total</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{overview.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tickets across catalogue</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Unresolved</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{overview.open + overview.inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {overview.open} open • {overview.inProgress} in progress
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Priority Attention</div>
          <div className="text-xl font-bold text-red-600 mt-1">{overview.criticalCount + overview.highCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {overview.criticalCount} critical • {overview.highCount} high
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Resolved</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{overview.resolved + overview.closed}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {overview.resolved} closed/resolved
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs" data-tour="admin-filter-pills">
        <button
          onClick={() => onSelectCategory("ALL")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All Categories
        </button>
        {categoryBreakdown.map((cat) => (
          <button
            key={cat.category}
            onClick={() => onSelectCategory(cat.category)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === cat.category
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{cat.category}</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded ${
                selectedCategory === cat.category ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
