"use client";

import Link from "next/link";
import { AssetSummary } from "@/lib/types";
import { DbtMark } from "@/components/Icons";

type AssetFilter = "all" | "model" | "source";

const MAT_COLORS: Record<string, string> = {
  view: "bg-sky-500/15 text-sky-600",
  table: "bg-emerald-500/15 text-emerald-600",
  incremental: "bg-amber-500/15 text-amber-600",
  ephemeral: "bg-purple-500/15 text-purple-600",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  model: (
    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  source: (
    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
};

interface AssetSidebarProps {
  assets: AssetSummary[];
  selectedAsset: string | null;
  onSelectAsset: (uniqueId: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: AssetFilter;
  onFilterChange: (filter: AssetFilter) => void;
}

export default function AssetSidebar({
  assets, selectedAsset, onSelectAsset, loading, searchQuery, onSearchChange, filter, onFilterChange,
}: AssetSidebarProps) {
  const filtered = assets.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.sourceName?.toLowerCase().includes(q) ||
      a.uniqueId.toLowerCase().includes(q)
    );
  });

  const modelCount = assets.filter((a) => a.type === "model").length;
  const sourceCount = assets.filter((a) => a.type === "source").length;

  return (
    <aside className="w-72 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-4">
          <DbtMark size={24} className="rounded-lg" />
          <div>
            <h1 className="text-[13px] font-bold text-foreground leading-tight">Asset Explorer</h1>
            <p className="text-[9px] text-muted">Powered by dbt Discovery API</p>
          </div>
        </div>
        <div className="relative mb-3">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder-muted focus:outline-none focus:border-indigo-400/40 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: "all" as const, label: "All", count: assets.length },
            { key: "model" as const, label: "Models", count: modelCount },
            { key: "source" as const, label: "Sources", count: sourceCount },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              {tab.label} <span className="opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted">Loading assets...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs">
            {searchQuery ? "No assets match your search" : "No assets found"}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((asset) => (
              <button
                key={asset.uniqueId}
                onClick={() => onSelectAsset(asset.uniqueId)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-100 ${
                  selectedAsset === asset.uniqueId
                    ? "bg-indigo-500/8 border border-indigo-500/20"
                    : "hover:bg-surface-hover border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  {TYPE_ICONS[asset.type]}
                  <span className="font-medium text-xs text-foreground truncate">
                    {asset.type === "source" && asset.sourceName
                      ? `${asset.sourceName}.${asset.name}`
                      : asset.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-5">
                  {asset.type === "model" && asset.materializedType && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${MAT_COLORS[asset.materializedType] ?? "bg-gray-500/15 text-gray-400"}`}>
                      {asset.materializedType}
                    </span>
                  )}
                  {asset.type === "source" && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide bg-green-500/15 text-green-600">
                      source
                    </span>
                  )}
                </div>
                {asset.description && (
                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed mt-0.5 ml-5">{asset.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border text-[10px] text-muted flex items-center justify-between">
        <span>{filtered.length} asset{filtered.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
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
