"use client";

import Link from "next/link";
import { MetricSummary } from "@/lib/types";
import { DbtMark } from "@/components/Icons";

const TYPE_COLORS: Record<string, string> = {
  SIMPLE: "bg-dbt-orange/15 text-dbt-orange",
  DERIVED: "bg-purple-500/15 text-purple-400",
  CUMULATIVE: "bg-amber-500/15 text-amber-400",
  RATIO: "bg-emerald-500/15 text-emerald-400",
};

interface MetricSidebarProps {
  metrics: MetricSummary[];
  selectedMetric: string | null;
  onSelectMetric: (name: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MetricSidebar({
  metrics, selectedMetric, onSelectMetric, loading, searchQuery, onSearchChange,
}: MetricSidebarProps) {
  const filtered = metrics.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-4">
          <DbtMark size={24} className="rounded-lg" />
          <div>
            <h1 className="text-[13px] font-bold text-foreground leading-tight">Semantic Layer Explorer</h1>
            <p className="text-[9px] text-muted">Powered by dbt Semantic Layer</p>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder-muted focus:outline-none focus:border-dbt-orange/40 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-5 h-5 border-2 border-dbt-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted">Loading metrics...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs">
            {searchQuery ? "No metrics match your search" : "No metrics found"}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((metric) => (
              <button
                key={metric.name}
                onClick={() => onSelectMetric(metric.name)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-100 ${
                  selectedMetric === metric.name
                    ? "bg-dbt-orange/8 border border-dbt-orange/20"
                    : "hover:bg-surface-hover border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-xs text-foreground truncate">{metric.name}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${TYPE_COLORS[metric.type] ?? "bg-gray-500/15 text-gray-400"}`}>
                    {metric.type}
                  </span>
                </div>
                {metric.description && (
                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{metric.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border text-[10px] text-muted flex items-center justify-between">
        <span>{metrics.length} metric{metrics.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <Link href="/asset-explorer" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Assets
          </Link>
          <Link href="/how-it-works" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Docs
          </Link>
        </div>
      </div>
    </aside>
  );
}
