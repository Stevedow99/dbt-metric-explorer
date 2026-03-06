"use client";

import { useState } from "react";
import { ColumnLineageData, NamingMode, isSigmaUrl } from "@/lib/types";
import { SigmaLogo } from "@/components/Icons";

interface ColumnLineagePanelProps {
  data: ColumnLineageData;
  metricName: string;
  namingMode: NamingMode;
}

export default function ColumnLineagePanel({ data, metricName }: ColumnLineagePanelProps) {
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  const { traces, dimensions, entities, exposures } = data;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Column Lineage</h3>
        <p className="text-xs text-muted">
          Field-level trace for <span className="text-dbt-orange font-medium">{metricName}</span>
        </p>
      </div>

      {/* Traces */}
      {traces.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-dbt-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Measure Traces ({traces.length})
            </span>
          </div>
          <div className="space-y-2">
            {traces.map((t) => {
              const traceId = `${t.semanticModelName}.${t.measureName}`;
              const isExpanded = expandedTrace === traceId;

              return (
                <div key={traceId} className="bg-surface-hover/50 rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedTrace(isExpanded ? null : traceId)}
                    className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-dbt-orange/15 text-dbt-orange uppercase">
                        {t.measureAgg}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{t.measureName}</span>
                    </div>
                    <svg className={`w-3 h-3 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-3 py-3 space-y-3">
                      {/* Expression */}
                      <div className="bg-background rounded-lg px-3 py-2 border border-border">
                        <code className="text-[11px] text-dbt-coral font-mono">{t.measureExpr}</code>
                      </div>

                      {/* Trace chain */}
                      <div className="space-y-1.5">
                        {/* Metric */}
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-[8px] px-1 py-0.5 rounded bg-dbt-orange/15 text-dbt-orange font-bold">M</span>
                          <span className="text-foreground font-medium">{t.metricName}</span>
                        </div>

                        {/* Measure */}
                        <div className="flex items-center gap-1.5 ml-3 border-l-2 border-dbt-orange/20 pl-2 text-[11px]">
                          <span className="text-[8px] px-1 py-0.5 rounded bg-dbt-orange/10 text-dbt-orange font-bold">{t.measureAgg.toUpperCase()}</span>
                          <span className="text-foreground">{t.measureName}</span>
                          <span className="text-muted text-[10px]">({t.semanticModelName})</span>
                        </div>

                        {/* Columns */}
                        {t.columns.map((col) => (
                          <div key={col.modelColumn} className="ml-6 border-l-2 border-emerald-500/20 pl-2 space-y-1">
                            {/* Model column */}
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold">COL</span>
                              <span className="font-mono text-foreground">{col.modelColumn}</span>
                              {col.modelColumnType && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-surface text-muted">{col.modelColumnType}</span>
                              )}
                              <span className="text-muted text-[10px]">{t.modelName}</span>
                            </div>

                            {/* Source column (with rename indicator) */}
                            {col.sourceColumn && col.sourceName && (
                              <div className="flex items-center gap-1.5 ml-3 border-l-2 border-amber-500/20 pl-2 text-[11px]">
                                <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 font-bold">SRC</span>
                                <span className="font-mono text-foreground">{col.sourceColumn}</span>
                                {col.sourceColumn.toLowerCase() !== col.modelColumn.toLowerCase() && (
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">renamed</span>
                                )}
                                <span className="text-muted text-[10px]">{col.sourceName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {t.measureDescription && (
                        <p className="text-[10px] text-muted italic border-t border-border pt-2">{t.measureDescription}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dimensions */}
      {dimensions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Dimensions ({dimensions.length})
            </span>
          </div>
          <div className="space-y-1">
            {dimensions.map((d) => (
              <div key={`${d.semanticModelName}.${d.name}`} className="flex items-center justify-between bg-surface-hover/50 rounded-lg border border-border px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{d.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 uppercase font-medium">{d.type}</span>
                </div>
                <span className="text-[10px] text-muted">{d.semanticModelName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entities */}
      {entities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Entities / Join Keys ({entities.length})
            </span>
          </div>
          <div className="space-y-1">
            {entities.map((e) => (
              <div key={`${e.semanticModelName}.${e.name}`} className="flex items-center justify-between bg-surface-hover/50 rounded-lg border border-border px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{e.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 uppercase font-medium">{e.type}</span>
                </div>
                <span className="text-[10px] text-muted">{e.semanticModelName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exposures / Dashboards */}
      {exposures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Exposures / Dashboards ({exposures.length})
            </span>
          </div>
          <div className="space-y-1">
            {exposures.map((exp) => {
              const isSigma = isSigmaUrl(exp.url ?? undefined);
              return (
                <div key={exp.name} className="flex items-center justify-between bg-surface-hover/50 rounded-lg border border-border px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {isSigma ? (
                      <SigmaLogo size={14} className="rounded flex-shrink-0" />
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase font-medium">{exp.exposureType ?? "dashboard"}</span>
                    )}
                    <span className="text-foreground font-medium">{exp.label ?? exp.name}</span>
                  </div>
                  {exp.url && (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline truncate max-w-[140px]">
                      open &rarr;
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {traces.length === 0 && dimensions.length === 0 && entities.length === 0 && exposures.length === 0 && (
        <div className="text-center py-8 text-sm text-muted">No column lineage data available.</div>
      )}
    </div>
  );
}
