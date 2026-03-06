"use client";

import { useMemo, useState } from "react";
import { SemanticLayerDimension } from "@/lib/types";

interface DimensionsPanelProps {
  dimensions: SemanticLayerDimension[];
  metricName: string;
}

export default function DimensionsPanel({ dimensions, metricName }: DimensionsPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  const timeDimensions = useMemo(
    () => dimensions.filter((d) => d.type?.toLowerCase().includes("time")),
    [dimensions]
  );

  const categoricalDimensions = useMemo(
    () => dimensions.filter((d) => !d.type?.toLowerCase().includes("time")),
    [dimensions]
  );

  const filterDims = (dims: SemanticLayerDimension[]) =>
    dims.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase())
    );

  const filteredTime = filterDims(timeDimensions);
  const filteredCategorical = filterDims(categoricalDimensions);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Dimensions</h3>
        <p className="text-xs text-muted">
          Available group-bys for <span className="text-dbt-orange font-medium">{metricName}</span>
        </p>
      </div>

      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Filter dimensions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder-muted focus:outline-none focus:border-dbt-orange/40 transition-colors"
        />
      </div>

      {filteredTime.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Time ({filteredTime.length})
            </span>
          </div>
          <div className="space-y-1">
            {filteredTime.map((dim) => (
              <DimensionItem key={dim.name} dim={dim} expanded={expandedDim === dim.name} onToggle={() => setExpandedDim(expandedDim === dim.name ? null : dim.name)} />
            ))}
          </div>
        </div>
      )}

      {filteredCategorical.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Categorical ({filteredCategorical.length})
            </span>
          </div>
          <div className="space-y-1">
            {filteredCategorical.map((dim) => (
              <DimensionItem key={dim.name} dim={dim} expanded={expandedDim === dim.name} onToggle={() => setExpandedDim(expandedDim === dim.name ? null : dim.name)} />
            ))}
          </div>
        </div>
      )}

      {filteredTime.length === 0 && filteredCategorical.length === 0 && (
        <div className="text-center py-8 text-sm text-muted">
          {search ? "No dimensions match your filter." : "No dimensions available."}
        </div>
      )}
    </div>
  );
}

function DimensionItem({ dim, expanded, onToggle }: { dim: SemanticLayerDimension; expanded: boolean; onToggle: () => void }) {
  const isTime = dim.type?.toLowerCase().includes("time");

  return (
    <div className="bg-surface-hover/50 rounded-lg border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-hover transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{dim.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${isTime ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"}`}>
            {dim.type}
          </span>
        </div>
        <svg className={`w-3 h-3 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-border px-3 py-2 text-xs space-y-2">
          {dim.description && <p className="text-muted">{dim.description}</p>}
          {dim.queryableGranularities?.length > 0 && (
            <div>
              <span className="text-[10px] text-muted uppercase">Granularities:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {dim.queryableGranularities.map((g) => (
                  <span key={g} className="text-[10px] px-1.5 py-0.5 bg-background rounded border border-border text-foreground">{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
