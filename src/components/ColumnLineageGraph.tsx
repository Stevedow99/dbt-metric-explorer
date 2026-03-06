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
  return (
    <div className="rounded-lg flex items-center gap-2.5 px-3" style={{ background: "#FEFCE8", border: "1px solid #EAB30840", width: SOURCE_W, height: SOURCE_H, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <Handle type="source" position={Position.Right} style={{ background: "#EAB308", width: 6, height: 6 }} />
      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "#EAB30818", color: "#CA8A04" }}>SRC</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono text-slate-700 truncate">{col}</div>
        <div className="text-[8px] text-slate-400 truncate">{table}{path ? ` · ${path}` : ""}</div>
      </div>
    </div>
  );
}

function ModelColumnNode({ data }: { data: Record<string, unknown> }) {
  const col = data.col as string;
  const colType = data.colType as string | null;
  const model = data.model as string;
  const renamed = data.renamed as boolean;
  return (
    <div className="rounded-lg flex items-center justify-between px-3" style={{ background: renamed ? "#EFF6FF" : "#F0FDF4", border: `1px solid ${renamed ? "#38BDF850" : "#22C55E40"}`, width: COL_W, height: COL_H, boxShadow: renamed ? "0 0 0 2px #38BDF815" : "0 1px 2px rgba(0,0,0,0.04)" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#22C55E", width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#22C55E", width: 6, height: 6 }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono text-slate-700 truncate">{col}</div>
        <div className="text-[8px] text-slate-400 truncate">{model}</div>
      </div>
      {colType && <span className="text-[8px] px-1.5 py-0.5 rounded ml-2 flex-shrink-0" style={{ background: "#F1F5F9", color: "#64748B" }}>{colType}</span>}
    </div>
  );
}

function MeasureNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const agg = data.agg as string;
  const expr = data.expr as string;
  const sm = data.sm as string;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#FFF7F5", border: "1.5px solid #FF694B50", width: MEASURE_W, height: MEASURE_H, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#FF694B", width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#FF694B", width: 7, height: 7 }} />
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "#FF694B18", color: "#FF694B" }}>{agg}</span>
        <span className="text-[11px] font-semibold text-slate-800 truncate">{name}</span>
      </div>
      <div className="text-[10px] font-mono text-dbt-orange/80 truncate" title={expr}>{expr}</div>
      <div className="text-[8px] text-slate-400 mt-0.5">SM: {sm}</div>
    </div>
  );
}

function MetricNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  return (
    <div className="rounded-xl flex items-center gap-3 px-4" style={{ background: "#FFF7F5", border: "2px solid #FF694B", width: METRIC_W, height: METRIC_H, boxShadow: "0 2px 8px #FF694B20" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#FF694B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: "#FF694B", width: 8, height: 8 }} />
      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FF694B18", color: "#FF694B" }}>METRIC</span>
      <span className="text-[13px] font-bold text-slate-800 truncate">{name}</span>
    </div>
  );
}

function DimensionNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const dimType = data.dimType as string;
  return (
    <div className="rounded-lg flex items-center justify-between px-3" style={{ background: "#FAF5FF", border: "1px solid #A855F740", width: DIM_W, height: DIM_H, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#A855F7", width: 6, height: 6 }} />
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "#A855F715", color: "#9333EA" }}>DIM</span>
        <span className="text-[10px] font-medium text-slate-700 truncate">{name}</span>
      </div>
      <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#A855F710", color: "#9333EA" }}>{dimType}</span>
    </div>
  );
}

function EntityNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const entType = data.entType as string;
  return (
    <div className="rounded-lg flex items-center justify-between px-3" style={{ background: "#F8FAFC", border: "1px solid #CBD5E130", width: ENTITY_W, height: ENTITY_H, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#94A3B8", width: 6, height: 6 }} />
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "#94A3B812", color: "#94A3B8" }}>KEY</span>
        <span className="text-[10px] font-medium text-slate-400 truncate">{name}</span>
      </div>
      <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#94A3B810", color: "#94A3B8" }}>{entType}</span>
    </div>
  );
}

function ExposureNode({ data }: { data: Record<string, unknown> }) {
  const label = data.label as string;
  const expType = data.expType as string | null;
  const url = data.url as string | null;
  const isSigma = isSigmaUrl(url ?? undefined);
  return (
    <div className="rounded-xl flex items-center gap-2.5 px-3" style={{ background: "#EEF2FF", border: "1.5px solid #6366F150", width: EXPOSURE_W, height: EXPOSURE_H, boxShadow: "0 1px 4px rgba(99,102,241,0.10)" }}>
      <Handle type="target" position={Position.Left} style={{ background: "#6366F1", width: 7, height: 7 }} />
      {isSigma ? (
        <SigmaLogo size={18} className="rounded flex-shrink-0" />
      ) : (
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#6366F118", color: "#6366F1" }}>{(expType ?? "DASHBOARD").toUpperCase()}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-slate-800 truncate">{label}</div>
        {url && <div className="text-[8px] text-indigo-500/70 truncate">{url}</div>}
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
  _namingMode: NamingMode
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

  // 3. Dimensions
  for (const d of data.dimensions) {
    const dId = `dim:${d.semanticModelName}.${d.name}`;
    graphNodes.push({
      id: dId, type: "dimensionNode", position: { x: 0, y: 0 },
      data: { label: d.name, dimType: d.type },
    });
    g.setNode(dId, { width: DIM_W, height: DIM_H });
    addEdge(dId, metricId, "#A855F740");
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
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildColumnGraph(data, metricName, namingMode),
    [data, metricName, namingMode]
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
        <Background color="#E2E8F0" gap={24} size={1} />
        <Controls style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10 }} />
      </ReactFlow>
    </div>
  );
}
