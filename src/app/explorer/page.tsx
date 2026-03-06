"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DbtMark } from "@/components/Icons";
import MetricSidebar from "@/components/MetricSidebar";
import MetricDetail from "@/components/MetricDetail";
import DimensionsPanel from "@/components/DimensionsPanel";
import ColumnLineagePanel from "@/components/ColumnLineagePanel";
import {
  MetricSummary,
  MetricLineageResponse,
  LineageNode,
  NamingMode,
} from "@/lib/types";

const LineageGraph = dynamic(() => import("@/components/LineageGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-dbt-orange border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const ColumnLineageGraph = dynamic(() => import("@/components/ColumnLineageGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-dbt-orange border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

type RightPanel = "details" | "dimensions" | "columns" | null;
type LineageView = "object" | "column";

export default function ExplorerPage() {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [lineageData, setLineageData] = useState<MetricLineageResponse | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [namingMode, setNamingMode] = useState<NamingMode>("dbt");
  const [rightPanel, setRightPanel] = useState<RightPanel>("details");
  const [lineageView, setLineageView] = useState<LineageView>("object");

  useEffect(() => {
    async function loadMetrics() {
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
    }
    loadMetrics();
  }, []);

  const handleSelectMetric = useCallback(async (name: string) => {
    setSelectedMetric(name);
    setLineageLoading(true);
    setLineageError(null);
    setSelectedNode(null);
    setLineageData(null);

    try {
      const res = await fetch(`/api/metrics/${encodeURIComponent(name)}/lineage`);
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

  const panelButtons: { key: RightPanel; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "dimensions", label: "Dimensions" },
    { key: "columns", label: "Columns" },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      <MetricSidebar
        metrics={metrics}
        selectedMetric={selectedMetric}
        onSelectMetric={handleSelectMetric}
        loading={metricsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedMetric ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <DbtMark size={48} className="mx-auto mb-5 rounded-2xl" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Select a Metric</h2>
              <p className="text-xs text-muted leading-relaxed">
                Choose a metric from the sidebar to explore its full lineage &mdash;
                from upstream tables and models, through semantic models and metrics,
                down to the dashboards it feeds.
              </p>
              <Link href="/" className="inline-block mt-4 text-[11px] text-dbt-orange/70 hover:text-dbt-orange transition-colors">
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
                <h2 className="text-xs font-semibold text-foreground">{selectedMetric}</h2>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Lineage View Toggle */}
                <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setLineageView("object")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                      lineageView === "object"
                        ? "bg-dbt-orange text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Object Lineage
                  </button>
                  <button
                    onClick={() => setLineageView("column")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                      lineageView === "column"
                        ? "bg-dbt-orange text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Column Lineage
                  </button>
                </div>

                {/* Naming Toggle */}
                <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setNamingMode("dbt")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
                      namingMode === "dbt"
                        ? "bg-dbt-orange text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    dbt Names
                  </button>
                  <button
                    onClick={() => setNamingMode("table")}
                    className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
                      namingMode === "table"
                        ? "bg-dbt-orange text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Table Names
                  </button>
                </div>

                {/* Panel Toggles */}
                <div className="flex items-center gap-0.5 border-l border-border pl-2.5">
                  {panelButtons.map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setRightPanel(rightPanel === btn.key ? null : btn.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-colors font-medium ${
                        rightPanel === btn.key
                          ? "bg-dbt-orange/12 text-dbt-orange"
                          : "text-muted hover:text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative">
                {lineageLoading ? (
                  <div className="flex items-center justify-center h-full gap-3">
                    <div className="w-5 h-5 border-2 border-dbt-orange border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted">Building lineage graph...</span>
                  </div>
                ) : lineageError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
                      <p className="text-xs text-red-400 mb-3">{lineageError}</p>
                      <button
                        onClick={() => selectedMetric && handleSelectMetric(selectedMetric)}
                        className="text-[11px] px-4 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors"
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
                  ) : (
                    <ColumnLineageGraph
                      data={lineageData.columnLineage}
                      metricName={lineageData.metric.name}
                      namingMode={namingMode}
                    />
                  )
                ) : null}
              </div>

              {/* Right Panel */}
              {rightPanel && lineageData && (
                <aside className="w-[380px] border-l border-border bg-surface overflow-y-auto p-4">
                  {rightPanel === "details" && (
                    <MetricDetail data={lineageData} selectedNode={selectedNode} namingMode={namingMode} />
                  )}
                  {rightPanel === "dimensions" && (
                    <DimensionsPanel dimensions={lineageData.dimensions} metricName={lineageData.metric.name} />
                  )}
                  {rightPanel === "columns" && (
                    <ColumnLineagePanel
                      data={lineageData.columnLineage}
                      metricName={lineageData.metric.name}
                      namingMode={namingMode}
                    />
                  )}
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
