"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DbtMark } from "@/components/Icons";
import {
  MetricSummary,
  MetricLineageResponse,
  NamingMode,
} from "@/lib/types";

const LineageGraph = dynamic(() => import("@/components/LineageGraph"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});
const ColumnLineageGraph = dynamic(() => import("@/components/ColumnLineageGraph"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

type TabView = "object" | "column" | "output";

interface DimensionOption {
  name: string;
  description: string | null;
  type: string;
  queryableGranularities: string[];
}

interface QueryResult {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
  sql: string;
}

// ─── Metric Picker ──────────────────────────────────────────────────────────

function MetricPicker({
  metrics,
  selected,
  onSelect,
  loading,
}: {
  metrics: MetricSummary[];
  selected: string | null;
  onSelect: (name: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = metrics.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
  );

  const TYPE_COLORS: Record<string, string> = {
    SIMPLE: "bg-dbt-orange/15 text-dbt-orange",
    DERIVED: "bg-purple-500/15 text-purple-500",
    CUMULATIVE: "bg-amber-500/15 text-amber-500",
    RATIO: "bg-emerald-500/15 text-emerald-500",
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">Metric</label>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-background text-left transition-colors hover:border-indigo-300 focus:outline-none focus:border-indigo-400"
      >
        {loading ? (
          <span className="text-xs text-muted">Loading metrics...</span>
        ) : selected ? (
          <span className="text-xs font-medium text-foreground">{selected}</span>
        ) : (
          <span className="text-xs text-muted">Select a metric...</span>
        )}
        <svg className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              autoFocus
              placeholder="Search metrics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted">No metrics found</div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.name}
                  onClick={() => { onSelect(m.name); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-surface-hover transition-colors flex items-center justify-between ${
                    selected === m.name ? "bg-indigo-500/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground truncate">{m.name}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${TYPE_COLORS[m.type] ?? "bg-gray-500/15 text-gray-400"}`}>
                        {m.type}
                      </span>
                    </div>
                    {m.description && <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{m.description}</p>}
                  </div>
                  {selected === m.name && (
                    <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dimension Picker ───────────────────────────────────────────────────────

function DimensionPicker({
  dimensions,
  selected,
  grains,
  onToggle,
  onGrainChange,
  loading,
}: {
  dimensions: DimensionOption[];
  selected: Set<string>;
  grains: Map<string, string>;
  onToggle: (name: string) => void;
  onGrainChange: (name: string, grain: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div>
        <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">Dimensions</label>
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted">Loading dimensions...</span>
        </div>
      </div>
    );
  }

  if (dimensions.length === 0) return null;

  return (
    <div>
      <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 block">
        Dimensions &middot; Group By
      </label>
      <div className="flex flex-wrap gap-2">
        {dimensions.map((dim) => {
          const isSelected = selected.has(dim.name);
          const isTime = dim.type?.toLowerCase() === "time";
          return (
            <div key={dim.name} className="flex items-center gap-0">
              <button
                onClick={() => onToggle(dim.name)}
                className={`text-[11px] font-medium px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-surface-hover text-muted hover:text-foreground border border-border"
                } ${isTime && isSelected ? "rounded-l-lg" : "rounded-lg"}`}
              >
                {!isSelected && <span className="text-[10px] opacity-60">+</span>}
                {dim.name.replace(/^metric_time__|^/, "").replace(/__/g, " ")}
                {isTime && <span className="text-[9px] opacity-70">⏱</span>}
              </button>
              {isTime && isSelected && dim.queryableGranularities.length > 0 && (
                <select
                  value={grains.get(dim.name) ?? dim.queryableGranularities[0]}
                  onChange={(e) => onGrainChange(dim.name, e.target.value)}
                  className="text-[10px] font-medium px-2 py-1.5 bg-indigo-600 text-white rounded-r-lg border-l border-indigo-400/30 focus:outline-none cursor-pointer appearance-none"
                  style={{ minWidth: 60 }}
                >
                  {dim.queryableGranularities.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sample Output Table ────────────────────────────────────────────────────

function SampleOutputTable({
  result,
  loading,
  error,
  onRun,
  hasSelections,
}: {
  result: QueryResult | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  hasSelections: boolean;
}) {
  const [showSql, setShowSql] = useState(false);

  if (!hasSelections) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <p className="text-xs text-muted">Select a metric to preview sample output</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted">Running query against Semantic Layer...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-xs text-red-500 mb-3">{error}</p>
          <button onClick={onRun} className="text-[11px] px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={onRun}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Run Query &middot; 5 rows
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {result.rows.length} row{result.rows.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] text-muted">{result.columns.length} columns</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            {showSql ? "Hide SQL" : "View SQL"}
          </button>
          <button
            onClick={onRun}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            Re-run
          </button>
        </div>
      </div>

      {/* SQL */}
      {showSql && result.sql && (
        <pre className="text-[11px] font-mono bg-slate-50 border border-border rounded-lg p-4 mb-3 overflow-x-auto text-slate-600 leading-relaxed max-h-40">
          {result.sql}
        </pre>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {result.columns.map((col) => (
                  <th key={col.name} className="text-left px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                    <div>{col.name}</div>
                    <div className="text-[9px] font-normal text-muted mt-0.5">{col.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                  {result.columns.map((col) => (
                    <td key={col.name} className="px-4 py-2.5 text-foreground whitespace-nowrap font-mono text-[11px]">
                      {row[col.name] != null ? String(row[col.name]) : <span className="text-slate-300 italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function QueryLabPage() {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const [dimensions, setDimensions] = useState<DimensionOption[]>([]);
  const [dimensionsLoading, setDimensionsLoading] = useState(false);
  const [selectedDimensions, setSelectedDimensions] = useState<Set<string>>(new Set());
  const [grains, setGrains] = useState<Map<string, string>>(new Map());

  const [lineageData, setLineageData] = useState<MetricLineageResponse | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);

  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>("object");
  const [namingMode, setNamingMode] = useState<NamingMode>("dbt");

  const prevMetricRef = useRef<string | null>(null);

  // Load metrics
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/metrics");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMetrics(data.metrics ?? []);
      } catch (err) {
        console.error("Failed to load metrics:", err);
      } finally {
        setMetricsLoading(false);
      }
    })();
  }, []);

  // When metric changes, fetch dimensions + lineage
  const handleSelectMetric = useCallback(async (name: string) => {
    if (name === prevMetricRef.current) return;
    prevMetricRef.current = name;

    setSelectedMetric(name);
    setDimensions([]);
    setSelectedDimensions(new Set());
    setGrains(new Map());
    setQueryResult(null);
    setQueryError(null);
    setDimensionsLoading(true);
    setLineageLoading(true);
    setLineageData(null);

    try {
      const res = await fetch(`/api/metrics/${encodeURIComponent(name)}/lineage`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLineageData(data);

      const dims: DimensionOption[] = (data.dimensions ?? []).map(
        (d: { name: string; description?: string; type: string; queryableGranularities?: string[] }) => ({
          name: d.name,
          description: d.description ?? null,
          type: d.type ?? "categorical",
          queryableGranularities: d.queryableGranularities ?? [],
        })
      );
      setDimensions(dims);
    } catch (err) {
      console.error("Failed to load metric data:", err);
    } finally {
      setLineageLoading(false);
      setDimensionsLoading(false);
    }
  }, []);

  const handleToggleDimension = useCallback((name: string) => {
    setSelectedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setQueryResult(null);
    setQueryError(null);
  }, []);

  const handleGrainChange = useCallback((name: string, grain: string) => {
    setGrains((prev) => {
      const next = new Map(prev);
      next.set(name, grain);
      return next;
    });
    setQueryResult(null);
    setQueryError(null);
  }, []);

  // Refresh lineage
  const handleRefreshLineage = useCallback(async () => {
    if (!selectedMetric) return;
    setLineageLoading(true);
    try {
      const res = await fetch(`/api/metrics/${encodeURIComponent(selectedMetric)}/lineage`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLineageData(data);
    } catch (err) {
      console.error("Failed to refresh lineage:", err);
    } finally {
      setLineageLoading(false);
    }
  }, [selectedMetric]);

  // Execute SL query
  const handleRunQuery = useCallback(async () => {
    if (!selectedMetric) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    const groupBy = Array.from(selectedDimensions).map((name) => {
      const dim = dimensions.find((d) => d.name === name);
      const isTime = dim?.type?.toLowerCase() === "time";
      const entry: { name: string; grain?: string } = { name };
      if (isTime) {
        entry.grain = grains.get(name) ?? dim?.queryableGranularities[0] ?? "DAY";
      }
      return entry;
    });

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: [selectedMetric], groupBy, limit: 5 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQueryResult(data);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setQueryLoading(false);
    }
  }, [selectedMetric, selectedDimensions, dimensions, grains]);

  const tabs: { key: TabView; label: string; icon: React.ReactNode }[] = [
    {
      key: "object",
      label: "Object Lineage",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
    {
      key: "column",
      label: "Column Lineage",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
      ),
    },
    {
      key: "output",
      label: "Sample Output",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-surface px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <div className="w-px h-5 bg-border" />
          <DbtMark size={18} className="rounded" />
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">Query Lab</h1>
            <p className="text-[9px] text-muted">Build & preview Semantic Layer queries</p>
          </div>
        </div>

        {selectedMetric && (
          <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
            <button
              onClick={() => setNamingMode("dbt")}
              className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium ${
                namingMode === "dbt" ? "bg-indigo-500 text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              dbt Names
            </button>
            <button
              onClick={() => setNamingMode("table")}
              className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium ${
                namingMode === "table" ? "bg-indigo-500 text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              Table Names
            </button>
          </div>
        )}
      </header>

      {/* Query Builder */}
      <div className="border-b border-border bg-surface px-5 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 items-start">
            <MetricPicker
              metrics={metrics}
              selected={selectedMetric}
              onSelect={handleSelectMetric}
              loading={metricsLoading}
            />
            <DimensionPicker
              dimensions={dimensions}
              selected={selectedDimensions}
              grains={grains}
              onToggle={handleToggleDimension}
              onGrainChange={handleGrainChange}
              loading={dimensionsLoading}
            />
          </div>

          {/* Query summary */}
          {selectedMetric && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-muted">Query:</span>
              <code className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                SELECT {selectedDimensions.size > 0 ? Array.from(selectedDimensions).join(", ") + ", " : ""}{selectedMetric}
              </code>
              {selectedDimensions.size > 0 && (
                <code className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                  GROUP BY {Array.from(selectedDimensions).join(", ")}
                </code>
              )}
              <code className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                LIMIT 5
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Results area */}
      {selectedMetric ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-border bg-surface px-5 flex-shrink-0">
            <div className="flex items-center justify-between -mb-px">
              <div className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`text-[11px] font-medium px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-muted hover:text-foreground hover:border-slate-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefreshLineage}
                disabled={lineageLoading}
                className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors flex items-center gap-1.5 mb-px disabled:opacity-50"
              >
                <svg className={`w-3 h-3 ${lineageLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {lineageLoading ? "Refreshing..." : "Refresh Lineage"}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === "object" && (
              lineageLoading ? (
                <div className="flex items-center justify-center h-full gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted">Building lineage...</span>
                </div>
              ) : lineageData ? (
                <LineageGraph
                  lineageNodes={lineageData.nodes}
                  lineageEdges={lineageData.edges}
                  namingMode={namingMode}
                  onNodeClick={() => {}}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted">Select a metric to view lineage</p>
                </div>
              )
            )}

            {activeTab === "column" && (
              lineageLoading ? (
                <div className="flex items-center justify-center h-full gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted">Building column lineage...</span>
                </div>
              ) : lineageData ? (
                <ColumnLineageGraph
                  data={lineageData.columnLineage}
                  metricName={lineageData.metric.name}
                  namingMode={namingMode}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted">Select a metric to view column lineage</p>
                </div>
              )
            )}

            {activeTab === "output" && (
              <SampleOutputTable
                result={queryResult}
                loading={queryLoading}
                error={queryError}
                onRun={handleRunQuery}
                hasSelections={!!selectedMetric}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-foreground mb-2">Build a Query</h2>
            <p className="text-xs text-muted leading-relaxed">
              Select a metric above to get started. Pick dimensions to group by, then explore
              the lineage or preview a 5-row sample output from the Semantic Layer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
