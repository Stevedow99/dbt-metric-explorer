"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { ColumnLineageData, NamingMode, isSigmaUrl } from "@/lib/types";
import { SigmaLogo } from "@/components/Icons";
import { useDarkMode } from "@/lib/useDarkMode";

// ─── Dimensions ──────────────────────────────────────────────────────────────

const SOURCE_W = 200; const SOURCE_H = 44;
const COL_W = 220; const COL_H = 48;
const MEASURE_W = 280; const MEASURE_H = 64;
const METRIC_W = 220; const METRIC_H = 72;
const DIM_W = 200; const DIM_H = 40;
const ENTITY_W = 200; const ENTITY_H = 40;
const EXPOSURE_W = 260; const EXPOSURE_H = 56;

// ─── Node Renderers ──────────────────────────────────────────────────────────

function SourceColumnNode({ data }: { data: Record<string, unknown> }) {
  const col = data.col as string;
  const table = data.table as string;
  const path = data.path as string | undefined;
  const dk = data.isDark as boolean;
  return (
    <div className="rounded-lg flex items-center gap-2.5 px-3 overflow-hidden" style={{ background: dk ? "#1E1B0C" : "#FEFCE8", border: `1px solid ${dk ? "#FACC1540" : "#EAB30840"}`, width: SOURCE_W, height: SOURCE_H, boxShadow: `0 1px 2px rgba(0,0,0,${dk ? "0.2" : "0.04"})` }}>
      <Handle type="source" position={Position.Right} style={{ background: dk ? "#FACC15" : "#EAB308", width: 6, height: 6 }} />
      <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ background: dk ? "#FACC1520" : "#EAB30818", color: dk ? "#FACC15" : "#CA8A04" }}>SRC</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono truncate" style={{ color: dk ? "#E2E8F0" : "#334155" }} title={col}>{col}</div>
        <div className="text-[8px] truncate" style={{ color: dk ? "#94A3B8" : "#94A3B8" }} title={`${table}${path ? ` · ${path}` : ""}`}>{table}{path ? ` · ${path}` : ""}</div>
      </div>
    </div>
  );
}

function ModelColumnNode({ data }: { data: Record<string, unknown> }) {
  const col = data.col as string;
  const colType = data.colType as string | null;
  const model = data.model as string;
  const renamed = data.renamed as boolean;
  const dk = data.isDark as boolean;
  const bg = dk ? (renamed ? "#0F1E2D" : "#0F2218") : (renamed ? "#EFF6FF" : "#F0FDF4");
  const borderCol = renamed ? (dk ? "#7DD3FC50" : "#38BDF850") : (dk ? "#4ADE8040" : "#22C55E40");
  return (
    <div className="rounded-lg flex items-center justify-between px-3 overflow-hidden" style={{ background: bg, border: `1px solid ${borderCol}`, width: COL_W, height: COL_H, boxShadow: renamed ? `0 0 0 2px ${dk ? "#38BDF810" : "#38BDF815"}` : `0 1px 2px rgba(0,0,0,${dk ? "0.2" : "0.04"})` }}>
      <Handle type="target" position={Position.Left} style={{ background: dk ? "#4ADE80" : "#22C55E", width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: dk ? "#4ADE80" : "#22C55E", width: 6, height: 6 }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono truncate" style={{ color: dk ? "#E2E8F0" : "#334155" }} title={col}>{col}</div>
        <div className="text-[8px] truncate" style={{ color: dk ? "#94A3B8" : "#94A3B8" }} title={model}>{model}</div>
      </div>
      {colType && <span className="text-[8px] px-1.5 py-0.5 rounded ml-2 flex-shrink-0" style={{ background: dk ? "#334155" : "#F1F5F9", color: dk ? "#94A3B8" : "#64748B" }}>{colType}</span>}
    </div>
  );
}

function MeasureNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const agg = data.agg as string;
  const expr = data.expr as string;
  const sm = data.sm as string;
  const dk = data.isDark as boolean;
  return (
    <div className="rounded-xl px-3 py-2 overflow-hidden" style={{ background: dk ? "#2D1A15" : "#FFF7F5", border: `1.5px solid ${dk ? "#FF694B50" : "#FF694B50"}`, width: MEASURE_W, height: MEASURE_H, boxShadow: `0 1px 3px rgba(0,0,0,${dk ? "0.2" : "0.06"})` }}>
      <Handle type="target" position={Position.Left} style={{ background: "#FF694B", width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#FF694B", width: 7, height: 7 }} />
      <div className="flex items-center gap-2 mb-0.5 min-w-0">
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0" style={{ background: "#FF694B18", color: "#FF694B" }}>{agg}</span>
        <span className="text-[11px] font-semibold truncate min-w-0" style={{ color: dk ? "#F1F5F9" : "#1E293B" }} title={name}>{name}</span>
      </div>
      <div className="text-[10px] font-mono text-dbt-orange/80 truncate" title={expr}>{expr}</div>
      <div className="text-[8px] mt-0.5 truncate" style={{ color: dk ? "#94A3B8" : "#94A3B8" }} title={`SM: ${sm}`}>SM: {sm}</div>
    </div>
  );
}

function MetricNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const dk = data.isDark as boolean;
  return (
    <div className="rounded-xl flex items-center gap-3 px-4 overflow-hidden" style={{ background: dk ? "#2D1A15" : "#FFF7F5", border: "2px solid #FF694B", width: METRIC_W, height: METRIC_H, boxShadow: `0 2px 8px ${dk ? "#FF694B30" : "#FF694B20"}` }}>
      <Handle type="target" position={Position.Left} style={{ background: "#FF694B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#FF694B", width: 8, height: 8 }} />
      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "#FF694B18", color: "#FF694B" }}>METRIC</span>
      <span className="text-[13px] font-bold truncate min-w-0" style={{ color: dk ? "#F1F5F9" : "#1E293B" }} title={name}>{name}</span>
    </div>
  );
}

function DimensionNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const dimType = data.dimType as string;
  const dk = data.isDark as boolean;
  return (
    <div className="rounded-lg flex items-center justify-between px-3 overflow-hidden" style={{ background: dk ? "#1E1530" : "#FAF5FF", border: `1px solid ${dk ? "#C084FC40" : "#A855F740"}`, width: DIM_W, height: DIM_H, boxShadow: `0 1px 2px rgba(0,0,0,${dk ? "0.2" : "0.04"})` }}>
      <Handle type="target" position={Position.Left} style={{ background: dk ? "#C084FC" : "#A855F7", width: 6, height: 6 }} />
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ background: dk ? "#C084FC15" : "#A855F715", color: dk ? "#C084FC" : "#9333EA" }}>DIM</span>
        <span className="text-[10px] font-medium truncate min-w-0" style={{ color: dk ? "#E2E8F0" : "#334155" }} title={name}>{name}</span>
      </div>
      <span className="text-[8px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-1" style={{ background: dk ? "#C084FC10" : "#A855F710", color: dk ? "#C084FC" : "#9333EA" }}>{dimType}</span>
    </div>
  );
}

function EntityNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const entType = data.entType as string;
  const dk = data.isDark as boolean;
  return (
    <div className="rounded-lg flex items-center justify-between px-3 overflow-hidden" style={{ background: dk ? "#1E293B" : "#F8FAFC", border: `1px solid ${dk ? "#47556930" : "#CBD5E130"}`, width: ENTITY_W, height: ENTITY_H, boxShadow: `0 1px 2px rgba(0,0,0,${dk ? "0.15" : "0.03"})` }}>
      <Handle type="target" position={Position.Left} style={{ background: "#94A3B8", width: 6, height: 6 }} />
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ background: "#94A3B812", color: "#94A3B8" }}>KEY</span>
        <span className="text-[10px] font-medium truncate min-w-0" style={{ color: dk ? "#94A3B8" : "#94A3B8" }} title={name}>{name}</span>
      </div>
      <span className="text-[8px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-1" style={{ background: "#94A3B810", color: "#94A3B8" }}>{entType}</span>
    </div>
  );
}

function ExposureNode({ data }: { data: Record<string, unknown> }) {
  const label = data.label as string;
  const expType = data.expType as string | null;
  const url = data.url as string | null;
  const dk = data.isDark as boolean;
  const isSigma = isSigmaUrl(url ?? undefined);
  return (
    <div className="rounded-xl flex items-center gap-2.5 px-3 overflow-hidden" style={{ background: dk ? "#151830" : "#EEF2FF", border: `1.5px solid ${dk ? "#818CF850" : "#6366F150"}`, width: EXPOSURE_W, height: EXPOSURE_H, boxShadow: `0 1px 4px rgba(99,102,241,${dk ? "0.15" : "0.10"})` }}>
      <Handle type="target" position={Position.Left} style={{ background: dk ? "#818CF8" : "#6366F1", width: 7, height: 7 }} />
      {isSigma ? (
        <SigmaLogo size={18} className="rounded flex-shrink-0" />
      ) : (
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: dk ? "#818CF818" : "#6366F118", color: dk ? "#818CF8" : "#6366F1" }}>{(expType ?? "DASHBOARD").toUpperCase()}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold truncate" style={{ color: dk ? "#F1F5F9" : "#1E293B" }} title={label}>{label}</div>
        {url && <div className="text-[8px] truncate" style={{ color: dk ? "#A5B4FC" : "#6366F1", opacity: 0.7 }} title={url}>{url}</div>}
      </div>
    </div>
  );
}

const nodeTypes = {
  sourceColumn: SourceColumnNode,
  modelColumn: ModelColumnNode,
  measureNode: MeasureNode,
  metricNode: MetricNode,
  dimensionNode: DimensionNode,
  entityNode: EntityNode,
  exposureNode: ExposureNode,
};

// ─── Build Graph ─────────────────────────────────────────────────────────────

function buildColumnGraph(
  data: ColumnLineageData,
  metricName: string,
  _namingMode: NamingMode,
  isDark: boolean
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 18 });

  const graphNodes: Node[] = [];
  const graphEdges: Edge[] = [];
  const edgeSet = new Set<string>();

  function addEdge(source: string, target: string, color: string, animated = false, dashed = false) {
    const key = `${source}→${target}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    graphEdges.push({
      id: `e-${graphEdges.length}`,
      source, target,
      type: "smoothstep",
      animated,
      style: { stroke: color, strokeWidth: 1.5, strokeDasharray: dashed ? "5 3" : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
    });
  }

  // 1. Metric node
  const metricId = `metric:${metricName}`;
  graphNodes.push({ id: metricId, type: "metricNode", position: { x: 0, y: 0 }, data: { label: metricName } });
  g.setNode(metricId, { width: METRIC_W, height: METRIC_H });

  // 2. Traces: Source Column → Model Column → Measure → Metric
  const seenMeasures = new Set<string>();
  const seenModelCols = new Set<string>();
  const seenSourceCols = new Set<string>();

  for (const trace of data.traces) {
    const measId = `measure:${trace.semanticModelName}.${trace.measureName}`;

    if (!seenMeasures.has(measId)) {
      seenMeasures.add(measId);
      graphNodes.push({
        id: measId,
        type: "measureNode",
        position: { x: 0, y: 0 },
        data: { label: trace.measureName, agg: trace.measureAgg.toUpperCase(), expr: trace.measureExpr, sm: trace.semanticModelName },
      });
      g.setNode(measId, { width: MEASURE_W, height: MEASURE_H });
      addEdge(measId, metricId, "#FF694B80", true);
    }

    for (const col of trace.columns) {
      // Model column
      const modelColId = `mcol:${trace.modelId}.${col.modelColumn}`;
      if (!seenModelCols.has(modelColId)) {
        seenModelCols.add(modelColId);
        const isRenamed = col.sourceColumn !== null && col.sourceColumn.toLowerCase() !== col.modelColumn.toLowerCase();
        graphNodes.push({
          id: modelColId,
          type: "modelColumn",
          position: { x: 0, y: 0 },
          data: { col: col.modelColumn, colType: col.modelColumnType, model: trace.modelName, renamed: isRenamed },
        });
        g.setNode(modelColId, { width: COL_W, height: COL_H });
      }
      addEdge(modelColId, measId, "#22C55E70");

      // Source column
      if (col.sourceColumn && col.sourceName) {
        const srcColId = `scol:${col.sourceName}.${col.sourceColumn}`;
        if (!seenSourceCols.has(srcColId)) {
          seenSourceCols.add(srcColId);
          const path = col.sourceDatabase && col.sourceSchema ? `${col.sourceDatabase}.${col.sourceSchema}` : undefined;
          graphNodes.push({
            id: srcColId,
            type: "sourceColumn",
            position: { x: 0, y: 0 },
            data: { col: col.sourceColumn, table: col.sourceName, path },
          });
          g.setNode(srcColId, { width: SOURCE_W, height: SOURCE_H });
        }
        const isRenamed = col.sourceColumn.toLowerCase() !== col.modelColumn.toLowerCase();
        addEdge(srcColId, `mcol:${trace.modelId}.${col.modelColumn}`, "#EAB30870", false, isRenamed);
      }
    }
  }

  // 3. Dimensions — trace back through model columns to sources
  for (const d of data.dimensions) {
    const dId = `dim:${d.semanticModelName}.${d.name}`;
    graphNodes.push({
      id: dId, type: "dimensionNode", position: { x: 0, y: 0 },
      data: { label: d.name, dimType: d.type },
    });
    g.setNode(dId, { width: DIM_W, height: DIM_H });
    addEdge(dId, metricId, "#A855F740");

    // Find which column this dimension references via expr or name
    const dimExpr = (d.expr ?? d.name).toLowerCase();
    const relatedTrace = data.traces.find((t) => t.semanticModelName === d.semanticModelName);
    if (relatedTrace) {
      // Look for a model column that matches the dimension expression
      const matchingCol = relatedTrace.columns.find(
        (c) => c.modelColumn.toLowerCase() === dimExpr
      );

      if (matchingCol) {
        const modelColId = `mcol:${relatedTrace.modelId}.${matchingCol.modelColumn}`;
        if (!seenModelCols.has(modelColId)) {
          seenModelCols.add(modelColId);
          const isRenamed = matchingCol.sourceColumn !== null && matchingCol.sourceColumn.toLowerCase() !== matchingCol.modelColumn.toLowerCase();
          graphNodes.push({
            id: modelColId,
            type: "modelColumn",
            position: { x: 0, y: 0 },
            data: { col: matchingCol.modelColumn, colType: matchingCol.modelColumnType, model: relatedTrace.modelName, renamed: isRenamed },
          });
          g.setNode(modelColId, { width: COL_W, height: COL_H });
        }
        addEdge(modelColId, dId, "#A855F750");

        // Also add the source column if available
        if (matchingCol.sourceColumn && matchingCol.sourceName) {
          const srcColId = `scol:${matchingCol.sourceName}.${matchingCol.sourceColumn}`;
          if (!seenSourceCols.has(srcColId)) {
            seenSourceCols.add(srcColId);
            const path = matchingCol.sourceDatabase && matchingCol.sourceSchema ? `${matchingCol.sourceDatabase}.${matchingCol.sourceSchema}` : undefined;
            graphNodes.push({
              id: srcColId,
              type: "sourceColumn",
              position: { x: 0, y: 0 },
              data: { col: matchingCol.sourceColumn, table: matchingCol.sourceName, path },
            });
            g.setNode(srcColId, { width: SOURCE_W, height: SOURCE_H });
          }
          const isRenamed = matchingCol.sourceColumn.toLowerCase() !== matchingCol.modelColumn.toLowerCase();
          addEdge(srcColId, modelColId, "#EAB30870", false, isRenamed);
        }
      }
    }
  }

  // 4. Entities
  for (const e of data.entities) {
    const eId = `ent:${e.semanticModelName}.${e.name}`;
    graphNodes.push({
      id: eId, type: "entityNode", position: { x: 0, y: 0 },
      data: { label: e.name, entType: e.type },
    });
    g.setNode(eId, { width: ENTITY_W, height: ENTITY_H });

    // Connect entity to a relevant measure from the same semantic model
    const relatedMeasure = data.traces.find((t) => t.semanticModelName === e.semanticModelName);
    if (relatedMeasure) {
      addEdge(eId, `measure:${relatedMeasure.semanticModelName}.${relatedMeasure.measureName}`, "#CBD5E140");
    }
  }

  // 5. Exposures (downstream of metrics)
  for (const exp of data.exposures) {
    const expId = `exposure:${exp.name}`;
    graphNodes.push({
      id: expId,
      type: "exposureNode",
      position: { x: 0, y: 0 },
      data: { label: exp.label ?? exp.name, expType: exp.exposureType, url: exp.url },
    });
    g.setNode(expId, { width: EXPOSURE_W, height: EXPOSURE_H });

    for (const mn of exp.parentMetricNames) {
      const srcMetricId = `metric:${mn}`;
      if (g.hasNode(srcMetricId)) {
        addEdge(srcMetricId, expId, "#6366F170", true);
      }
    }
  }

  // Inject isDark into every node's data
  for (const n of graphNodes) n.data.isDark = isDark;

  // Layout
  for (const e of graphEdges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  for (const n of graphNodes) {
    const pos = g.node(n.id);
    if (pos) {
      n.position = { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 };
    }
  }

  return { nodes: graphNodes, edges: graphEdges };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ColumnLineageGraphProps {
  data: ColumnLineageData;
  metricName: string;
  namingMode: NamingMode;
}

export default function ColumnLineageGraph({ data, metricName, namingMode }: ColumnLineageGraphProps) {
  const isDark = useDarkMode();

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildColumnGraph(data, metricName, namingMode, isDark),
    [data, metricName, namingMode, isDark]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDark ? "#334155" : "#E2E8F0"} gap={24} size={1} />
        <Controls style={{ background: isDark ? "#1E293B" : "#FFFFFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: 10 }} />
      </ReactFlow>
    </div>
  );
}
