"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DbtMark } from "@/components/Icons";
import AssetSidebar from "@/components/AssetSidebar";
import {
  AssetSummary,
  AssetLineageResponse,
  LineageNode,
  NamingMode,
  getDisplayName,
  getTableSubtitle,
  isSigmaUrl,
} from "@/lib/types";
import { SigmaLogo } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";

const LineageGraph = dynamic(() => import("@/components/LineageGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});


type RightPanel = "details" | null;
type LineageView = "object" | "columns";
type AssetFilter = "all" | "model" | "source";

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-600",
    error: "bg-red-500/15 text-red-500",
    fail: "bg-red-500/15 text-red-500",
    warn: "bg-amber-500/15 text-amber-600",
    pass: "bg-emerald-500/15 text-emerald-600",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[status.toLowerCase()] ?? "bg-gray-500/15 text-gray-500"}`}>
      {status}
    </span>
  );
}

function NodeDetailPanel({ node, namingMode }: { node: LineageNode; namingMode: NamingMode }) {
  const displayName = getDisplayName(node, namingMode);
  const subtitle = getTableSubtitle(node, namingMode);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate">{displayName}</h3>
        <span className="text-[9px] uppercase tracking-wider text-muted bg-surface-hover px-2 py-1 rounded-md font-medium flex-shrink-0">
          {node.type.replace("_", " ")}
        </span>
      </div>

      {node.description && <p className="text-xs text-muted leading-relaxed">{node.description}</p>}

      {node.type === "exposure" && (
        <div className="space-y-2">
          {node.url && (
            <div className="flex items-center gap-2 text-xs">
              {isSigmaUrl(node.url) && <SigmaLogo size={14} className="rounded" />}
              <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 underline truncate">
                {node.url}
              </a>
            </div>
          )}
          {node.ownerName && (
            <div className="text-xs"><span className="text-muted">Owner:</span> <span className="text-foreground">{node.ownerName}</span></div>
          )}
        </div>
      )}

      {node.type !== "exposure" && node.type !== "metric" && node.database && node.schema && (
        <div className="bg-background rounded-lg border border-border px-3 py-2 font-mono text-[11px] space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Database</span>
            <span className="text-foreground">{node.database}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Schema</span>
            <span className="text-foreground">{node.schema}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Table</span>
            <span className="text-indigo-500 font-semibold">{node.alias || node.identifier || node.name}</span>
          </div>
          {namingMode === "dbt" && (
            <div className="flex items-center gap-2">
              <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">dbt</span>
              <span className="text-foreground">{node.name}</span>
            </div>
          )}
        </div>
      )}

      {subtitle && !node.database && (
        <div className="text-[10px] text-muted font-mono">{subtitle}</div>
      )}

      {node.materializedType && (
        <div className="text-xs"><span className="text-muted">Materialized:</span> <span className="text-foreground">{node.materializedType}</span></div>
      )}

      {node.executionInfo && (
        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">Last run:</span>
            <StatusBadge status={node.executionInfo.lastRunStatus} />
            <span className="text-muted">{formatTimeAgo(node.executionInfo.executeCompletedAt)}</span>
          </div>
          {node.executionInfo.executionTime != null && (
            <div className="text-xs"><span className="text-muted">Execution time:</span> <span className="text-foreground">{node.executionInfo.executionTime.toFixed(1)}s</span></div>
          )}
        </div>
      )}

      {node.freshness && (
        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs"><span className="text-muted">Freshness:</span> <StatusBadge status={node.freshness.freshnessStatus} /></div>
          <div className="text-xs"><span className="text-muted">Last loaded:</span> <span className="text-foreground">{formatTimeAgo(node.freshness.maxLoadedAt)}</span></div>
        </div>
      )}

      {node.rawCode && (
        <details className="border-t border-border pt-2">
          <summary className="text-xs text-muted cursor-pointer hover:text-foreground transition-colors">View SQL</summary>
          <pre className="mt-2 text-[11px] text-foreground bg-background rounded-lg p-3 overflow-auto max-h-60 font-mono border border-border">{node.rawCode}</pre>
        </details>
      )}
    </div>
  );
}

function AssetDetailPanel({ data, selectedNode, namingMode }: { data: AssetLineageResponse; selectedNode: LineageNode | null; namingMode: NamingMode }) {
  const { asset, nodes } = data;
  const models = nodes.filter((n) => n.type === "model");
  const sources = nodes.filter((n) => n.type === "source");
  const metrics = nodes.filter((n) => n.type === "metric");
  const exposures = nodes.filter((n) => n.type === "exposure");
  const semanticModels = nodes.filter((n) => n.type === "semantic_model");

  return (
    <div className="space-y-4 overflow-y-auto max-h-full">
      {/* Asset Header */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <DbtMark size={20} className="rounded-md" />
          <h2 className="text-base font-bold text-foreground truncate">{asset.name}</h2>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase bg-indigo-500/15 text-indigo-600 border-indigo-500/20">
            {asset.type.replace("_", " ")}
          </span>
        </div>
        {asset.description && <p className="text-xs text-muted mb-3 leading-relaxed">{asset.description}</p>}
        {asset.database && asset.schema && (
          <div className="bg-background rounded-lg border border-border px-3 py-2 font-mono text-[11px] space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Database</span>
              <span className="text-foreground">{asset.database}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Schema</span>
              <span className="text-foreground">{asset.schema}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">Table</span>
              <span className="text-indigo-500 font-semibold">{asset.alias || asset.identifier || asset.name}</span>
            </div>
          </div>
        )}
        {asset.materializedType && (
          <div className="text-xs mt-2"><span className="text-muted">Materialized:</span> <span className="text-foreground">{asset.materializedType}</span></div>
        )}
      </div>

      {/* Selected Node */}
      {selectedNode && selectedNode.id !== asset.id && (
        <div>
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Selected Node</h3>
          <NodeDetailPanel node={selectedNode} namingMode={namingMode} />
        </div>
      )}

      {/* Summary */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Lineage Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg p-3 text-center border border-border">
            <div className="text-xl font-bold text-emerald-500">{models.length}</div>
            <div className="text-[10px] text-muted uppercase">Models</div>
          </div>
          <div className="bg-background rounded-lg p-3 text-center border border-border">
            <div className="text-xl font-bold text-amber-500">{sources.length}</div>
            <div className="text-[10px] text-muted uppercase">Sources</div>
          </div>
          {semanticModels.length > 0 && (
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <div className="text-xl font-bold text-purple-500">{semanticModels.length}</div>
              <div className="text-[10px] text-muted uppercase">Semantic Models</div>
            </div>
          )}
          {metrics.length > 0 && (
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <div className="text-xl font-bold text-dbt-orange">{metrics.length}</div>
              <div className="text-[10px] text-muted uppercase">Metrics</div>
            </div>
          )}
          {exposures.length > 0 && (
            <div className="bg-background rounded-lg p-3 text-center border border-border col-span-2">
              <div className="text-xl font-bold text-indigo-500">{exposures.length}</div>
              <div className="text-[10px] text-muted uppercase">Exposures</div>
            </div>
          )}
        </div>
      </div>

      {/* Exposures list */}
      {exposures.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Downstream Dashboards</h3>
          <div className="space-y-2">
            {exposures.map((exp) => {
              const isSigma = isSigmaUrl(exp.url);
              return (
                <div key={exp.id} className="bg-background rounded-lg border border-border p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isSigma ? (
                      <SigmaLogo size={16} className="rounded" />
                    ) : (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/15 text-indigo-500 font-bold">E</span>
                    )}
                    <span className="font-medium text-foreground">{exp.name}</span>
                  </div>
                  {exp.url && (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 underline truncate block font-mono text-[10px]">
                      {exp.url.replace(/^https?:\/\//, "").substring(0, 55)}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnDetailsView({ data }: { data: AssetLineageResponse }) {
  if (!data.columnLineage || data.columnLineage.columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted text-xs">
          {data.asset.type === "source"
            ? "Column details are available for models only"
            : "No catalog columns available for this model"}
        </div>
      </div>
    );
  }

  const { columns, modelName, modelDatabase, modelSchema } = data.columnLineage;
  const path = modelDatabase && modelSchema ? `${modelDatabase}.${modelSchema}` : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Model header card */}
        <div className="bg-surface rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-emerald-500/15 text-emerald-600">MODEL</span>
            <h2 className="text-base font-bold text-foreground">{modelName}</h2>
          </div>
          {path && (
            <p className="font-mono text-[11px] text-muted">{path}.{modelName}</p>
          )}
          <p className="text-[11px] text-muted mt-2">
            {columns.length} column{columns.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Column list */}
        <div className="space-y-2">
          {columns.map((col) => (
            <div key={col.columnName} className="bg-surface rounded-lg border border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className="font-mono text-xs font-medium text-foreground truncate">{col.columnName}</span>
                </div>
                {col.columnType && (
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-surface-hover text-muted ml-3 flex-shrink-0 uppercase">
                    {col.columnType}
                  </span>
                )}
              </div>
              {col.sourceColumns.length > 0 && (
                <div className="mt-2 ml-6 space-y-1">
                  {col.sourceColumns.map((sc, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 flex-shrink-0">SRC</span>
                      <span className="font-mono text-muted truncate">{sc.sourceName}.{sc.column}</span>
                      {sc.database && sc.schema && (
                        <span className="text-[8px] text-muted/70 flex-shrink-0">{sc.database}.{sc.schema}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AssetExplorerPage() {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [lineageData, setLineageData] = useState<AssetLineageResponse | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [namingMode, setNamingMode] = useState<NamingMode>("dbt");
  const [rightPanel, setRightPanel] = useState<RightPanel>("details");
  const [lineageView, setLineageView] = useState<LineageView>("object");

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const all: AssetSummary[] = [
          ...(data.models ?? []),
          ...(data.sources ?? []),
        ];
        all.sort((a, b) => a.name.localeCompare(b.name));
        setAssets(all);
      } catch (err) {
        console.error("Failed to load assets:", err);
      } finally {
        setAssetsLoading(false);
      }
    }
    loadAssets();
  }, []);

  const handleSelectAsset = useCallback(async (uniqueId: string) => {
    setSelectedAsset(uniqueId);
    setLineageLoading(true);
    setLineageError(null);
    setSelectedNode(null);
    setLineageData(null);

    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(uniqueId)}/lineage`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLineageData(data);
    } catch (err) {
      setLineageError(err instanceof Error ? err.message : "Failed to load lineage");
    } finally {
      setLineageLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((node: LineageNode) => {
    setSelectedNode(node);
    setRightPanel("details");
  }, []);

  const hasColumns = lineageData?.columnLineage && lineageData.columnLineage.columns.length > 0;

  return (
    <div className="h-screen flex overflow-hidden">
      <AssetSidebar
        assets={assets}
        selectedAsset={selectedAsset}
        onSelectAsset={handleSelectAsset}
        loading={assetsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedAsset ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <DbtMark size={48} className="mx-auto mb-5 rounded-2xl" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Select an Asset</h2>
              <p className="text-xs text-muted leading-relaxed">
                Choose a model or source from the sidebar to explore its full lineage &mdash;
                upstream dependencies, downstream consumers, metrics, and dashboards.
              </p>
              <Link href="/" className="inline-block mt-4 text-[11px] text-indigo-500/70 hover:text-indigo-500 transition-colors">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
              <div className="flex items-center gap-2.5">
                <Link href="/" className="text-muted hover:text-foreground transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <DbtMark size={16} className="rounded" />
                <h2 className="text-xs font-semibold text-foreground truncate max-w-xs">
                  {lineageData?.asset?.name ?? selectedAsset.split(".").pop()}
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                {/* View Toggle */}
                <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setLineageView("object")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                      lineageView === "object"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Object Lineage
                  </button>
                  <button
                    onClick={() => setLineageView("columns")}
                    disabled={!hasColumns}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                      lineageView === "columns"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : hasColumns
                        ? "text-muted hover:text-foreground"
                        : "text-muted/40 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Column Details
                  </button>
                </div>

                {/* Naming Toggle */}
                <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setNamingMode("dbt")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
                      namingMode === "dbt"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    dbt Names
                  </button>
                  <button
                    onClick={() => setNamingMode("table")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
                      namingMode === "table"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Table Names
                  </button>
                </div>

                {/* Details Toggle */}
                <div className="flex items-center gap-0.5 border-l border-border pl-2.5">
                  <button
                    onClick={() => setRightPanel(rightPanel === "details" ? null : "details")}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors font-medium ${
                      rightPanel === "details"
                        ? "bg-indigo-500/12 text-indigo-600"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    Details
                  </button>
                </div>

                <div className="border-l border-border pl-2.5">
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative">
                {lineageLoading ? (
                  <div className="flex items-center justify-center h-full gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted">Building lineage graph...</span>
                  </div>
                ) : lineageError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
                      <p className="text-xs text-red-500 mb-3">{lineageError}</p>
                      <button
                        onClick={() => selectedAsset && handleSelectAsset(selectedAsset)}
                        className="text-[11px] px-4 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-500 rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : lineageData ? (
                  lineageView === "object" ? (
                    <LineageGraph
                      lineageNodes={lineageData.nodes}
                      lineageEdges={lineageData.edges}
                      namingMode={namingMode}
                      onNodeClick={handleNodeClick}
                    />
                  ) : hasColumns ? (
                    <ColumnDetailsView data={lineageData} />
                  ) : null
                ) : null}
              </div>

              {/* Right Panel */}
              {rightPanel === "details" && lineageData && (
                <aside className="w-[380px] border-l border-border bg-surface overflow-y-auto p-4">
                  <AssetDetailPanel data={lineageData} selectedNode={selectedNode} namingMode={namingMode} />
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
