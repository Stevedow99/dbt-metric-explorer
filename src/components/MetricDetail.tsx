"use client";

import {
  LineageNode,
  MetricLineageResponse,
  NamingMode,
  getDisplayName,
  getTableSubtitle,
  isSigmaUrl,
} from "@/lib/types";
import { DbtMark, SigmaLogo } from "@/components/Icons";

const TYPE_BADGES: Record<string, string> = {
  SIMPLE: "bg-dbt-orange/15 text-dbt-orange border-dbt-orange/20",
  DERIVED: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  CUMULATIVE: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  RATIO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

interface MetricDetailProps {
  data: MetricLineageResponse;
  selectedNode: LineageNode | null;
  namingMode: NamingMode;
}

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
    success: "bg-emerald-500/15 text-emerald-400",
    error: "bg-red-500/15 text-red-400",
    fail: "bg-red-500/15 text-red-400",
    warn: "bg-amber-500/15 text-amber-400",
    pass: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[status.toLowerCase()] ?? "bg-gray-500/15 text-gray-400"}`}>
      {status}
    </span>
  );
}

function TableNameDisplay({ node, namingMode }: { node: LineageNode; namingMode: NamingMode }) {
  if (!node.database || !node.schema) return null;
  const table = node.alias || node.identifier || node.name;

  return (
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
        <span className="text-dbt-orange font-semibold">{table}</span>
      </div>
      {namingMode === "dbt" && (
        <div className="flex items-center gap-2">
          <span className="text-muted w-14 text-right text-[9px] uppercase font-sans">dbt</span>
          <span className="text-foreground">{node.name}</span>
        </div>
      )}
    </div>
  );
}

function NodeDetailPanel({ node, namingMode }: { node: LineageNode; namingMode: NamingMode }) {
  const displayName = getDisplayName(node, namingMode);

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{displayName}</h3>
        <span className="text-[9px] uppercase tracking-wider text-muted bg-surface-hover px-2 py-1 rounded-md font-medium">
          {node.type.replace("_", " ")}
        </span>
      </div>

      {node.description && <p className="text-xs text-muted leading-relaxed">{node.description}</p>}

      {/* Exposure details */}
      {node.type === "exposure" && (
        <div className="space-y-2">
          {node.url && (
            <div className="flex items-center gap-2 text-xs">
              {isSigmaUrl(node.url) && <SigmaLogo size={14} className="rounded" />}
              <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline truncate">
                {node.url}
              </a>
            </div>
          )}
          {node.ownerName && (
            <div className="text-xs"><span className="text-muted">Owner:</span> <span className="text-foreground">{node.ownerName}</span></div>
          )}
        </div>
      )}

      {/* Table reference (structured format) */}
      {node.type !== "exposure" && node.type !== "metric" && (
        <TableNameDisplay node={node} namingMode={namingMode} />
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

export default function MetricDetail({ data, selectedNode, namingMode }: MetricDetailProps) {
  const { metric, nodes } = data;
  const typeBadge = TYPE_BADGES[metric.type] ?? "bg-gray-500/15 text-gray-400 border-gray-500/20";
  const models = nodes.filter((n) => n.type === "model" || n.type === "semantic_model");
  const sources = nodes.filter((n) => n.type === "source");
  const exposures = nodes.filter((n) => n.type === "exposure");

  return (
    <div className="space-y-4 overflow-y-auto max-h-full">
      {/* Metric Header */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <DbtMark size={20} className="rounded-md" />
          <h2 className="text-base font-bold text-foreground">{metric.name}</h2>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${typeBadge}`}>{metric.type}</span>
        </div>
        {metric.description && <p className="text-xs text-muted mb-3 leading-relaxed">{metric.description}</p>}
        {metric.formula && (
          <div className="text-xs mb-2">
            <span className="text-muted">Formula:</span>{" "}
            <code className="bg-background px-2 py-1 rounded-md text-dbt-orange font-mono border border-border">{metric.formula}</code>
          </div>
        )}
        {metric.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {metric.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-dbt-orange/10 text-dbt-orange border border-dbt-orange/15">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Selected Node */}
      {selectedNode && selectedNode.type !== "metric" && (
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
            <div className="text-xl font-bold text-emerald-400">{models.length}</div>
            <div className="text-[10px] text-muted uppercase">Models</div>
          </div>
          <div className="bg-background rounded-lg p-3 text-center border border-border">
            <div className="text-xl font-bold text-amber-400">{sources.length}</div>
            <div className="text-[10px] text-muted uppercase">Sources</div>
          </div>
          {exposures.length > 0 && (
            <div className="bg-background rounded-lg p-3 text-center border border-border col-span-2">
              <div className="text-xl font-bold text-indigo-400">{exposures.length}</div>
              <div className="text-[10px] text-muted uppercase">Dashboards</div>
            </div>
          )}
        </div>
      </div>

      {/* Exposures */}
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
                      <span className="text-[8px] px-1 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold">E</span>
                    )}
                    <span className="font-medium text-foreground">{exp.name}</span>
                    {isSigma && <span className="text-[8px] px-1.5 py-0.5 rounded bg-sigma-purple text-sigma-yellow font-bold">Sigma</span>}
                  </div>
                  {exp.url && (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline truncate block font-mono text-[10px]">
                      {exp.url.replace(/^https?:\/\//, "").substring(0, 55)}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upstream Models */}
      {models.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Upstream Models</h3>
          <div className="space-y-2">
            {models.map((model) => {
              const subtitle = getTableSubtitle(model, namingMode);
              return (
                <div key={model.id} className="bg-background rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{getDisplayName(model, namingMode)}</span>
                    <div className="flex items-center gap-2">
                      {model.materializedType && <span className="text-[9px] text-muted bg-surface-hover px-1.5 py-0.5 rounded-md">{model.materializedType}</span>}
                      <StatusBadge status={model.executionInfo?.lastRunStatus} />
                    </div>
                  </div>
                  {subtitle && <div className="text-[10px] text-muted font-mono">{subtitle}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Upstream Sources</h3>
          <div className="space-y-2">
            {sources.map((src) => {
              const subtitle = getTableSubtitle(src, namingMode);
              return (
                <div key={src.id} className="bg-background rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{getDisplayName(src, namingMode)}</span>
                    <StatusBadge status={src.freshness?.freshnessStatus} />
                  </div>
                  {subtitle && <div className="text-[10px] text-muted font-mono">{subtitle}</div>}
                  {src.freshness?.maxLoadedAt && <div className="text-muted text-[10px]">Last loaded: {formatTimeAgo(src.freshness.maxLoadedAt)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
