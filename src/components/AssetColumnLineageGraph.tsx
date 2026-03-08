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
import { AssetColumnLineageData } from "@/lib/types";
import { useDarkMode } from "@/lib/useDarkMode";

const SOURCE_W = 220;
const SOURCE_H = 44;
const COL_W = 240;
const COL_H = 52;
const MODEL_W = 260;
const MODEL_H = 56;

function SourceColumnNode({ data }: { data: Record<string, unknown> }) {
  const col = data.col as string;
  const source = data.source as string;
  const path = data.path as string | undefined;
  const dk = data.isDark as boolean;
  return (
    <div
      className="rounded-lg flex items-center gap-2.5 px-3"
      style={{
        background: dk ? "#1E1B0C" : "#FEFCE8",
        border: `1px solid ${dk ? "#FACC1540" : "#EAB30840"}`,
        width: SOURCE_W,
        height: SOURCE_H,
        boxShadow: `0 1px 2px rgba(0,0,0,${dk ? "0.2" : "0.04"})`,
      }}
    >
      <Handle type="source" position={Position.Right} style={{ background: dk ? "#FACC15" : "#EAB308", width: 6, height: 6 }} />
      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: dk ? "#FACC1520" : "#EAB30818", color: dk ? "#FACC15" : "#CA8A04" }}>SRC</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono truncate" style={{ color: dk ? "#E2E8F0" : "#334155" }}>{col}</div>
        <div className="text-[8px] truncate" style={{ color: "#94A3B8" }}>{source}{path ? ` · ${path}` : ""}</div>
      </div>
    </div>
  );
}

function ModelColumnNode({ data }: { data: Record<string, unknown> }) {
  const col = data.col as string;
  const colType = data.colType as string | null;
  const renamed = data.renamed as boolean;
  const dk = data.isDark as boolean;
  const bg = dk ? (renamed ? "#0F1E2D" : "#0F2218") : (renamed ? "#EFF6FF" : "#F0FDF4");
  const borderCol = renamed ? (dk ? "#7DD3FC50" : "#38BDF850") : (dk ? "#4ADE8040" : "#22C55E40");
  return (
    <div
      className="rounded-lg flex items-center justify-between px-3"
      style={{
        background: bg,
        border: `1px solid ${borderCol}`,
        width: COL_W,
        height: COL_H,
        boxShadow: renamed ? `0 0 0 2px ${dk ? "#38BDF810" : "#38BDF815"}` : `0 1px 2px rgba(0,0,0,${dk ? "0.2" : "0.04"})`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: dk ? "#4ADE80" : "#22C55E", width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: dk ? "#4ADE80" : "#22C55E", width: 6, height: 6 }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono truncate" style={{ color: dk ? "#E2E8F0" : "#334155" }}>{col}</div>
      </div>
      {colType && (
        <span className="text-[8px] px-1.5 py-0.5 rounded ml-2 flex-shrink-0" style={{ background: dk ? "#334155" : "#F1F5F9", color: dk ? "#94A3B8" : "#64748B" }}>
          {colType}
        </span>
      )}
    </div>
  );
}

function TargetModelNode({ data }: { data: Record<string, unknown> }) {
  const name = data.label as string;
  const path = data.path as string | undefined;
  const dk = data.isDark as boolean;
  return (
    <div
      className="rounded-xl flex items-center gap-3 px-4"
      style={{
        background: dk ? "#0F2218" : "#F0FDF4",
        border: `2px solid ${dk ? "#4ADE80" : "#22C55E"}`,
        width: MODEL_W,
        height: MODEL_H,
        boxShadow: `0 2px 8px ${dk ? "#22C55E30" : "#22C55E20"}`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: dk ? "#4ADE80" : "#22C55E", width: 8, height: 8 }} />
      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: dk ? "#4ADE8018" : "#22C55E18", color: dk ? "#4ADE80" : "#22C55E" }}>MODEL</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold truncate" style={{ color: dk ? "#F1F5F9" : "#1E293B" }}>{name}</div>
        {path && <div className="text-[8px] truncate" style={{ color: "#94A3B8" }}>{path}</div>}
      </div>
    </div>
  );
}

const nodeTypes = {
  sourceColumn: SourceColumnNode,
  modelColumn: ModelColumnNode,
  targetModel: TargetModelNode,
};

function buildAssetColumnGraph(data: AssetColumnLineageData, isDark: boolean): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 18 });

  const graphNodes: Node[] = [];
  const graphEdges: Edge[] = [];
  const edgeSet = new Set<string>();

  function addEdge(source: string, target: string, color: string, dashed = false) {
    const key = `${source}→${target}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    graphEdges.push({
      id: `e-${graphEdges.length}`,
      source,
      target,
      type: "smoothstep",
      style: { stroke: color, strokeWidth: 1.5, strokeDasharray: dashed ? "5 3" : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
    });
  }

  // Target model node
  const modelId = `model:${data.modelId}`;
  const modelPath = data.modelDatabase && data.modelSchema ? `${data.modelDatabase}.${data.modelSchema}` : undefined;
  graphNodes.push({
    id: modelId,
    type: "targetModel",
    position: { x: 0, y: 0 },
    data: { label: data.modelName, path: modelPath },
  });
  g.setNode(modelId, { width: MODEL_W, height: MODEL_H });

  const seenModelCols = new Set<string>();
  const seenSourceCols = new Set<string>();

  for (const col of data.columns) {
    const modelColId = `mcol:${data.modelId}.${col.columnName}`;
    if (!seenModelCols.has(modelColId)) {
      seenModelCols.add(modelColId);
      const hasRename = col.sourceColumns.some(
        (sc) => sc.column.toLowerCase() !== col.columnName.toLowerCase()
      );
      graphNodes.push({
        id: modelColId,
        type: "modelColumn",
        position: { x: 0, y: 0 },
        data: { col: col.columnName, colType: col.columnType, renamed: hasRename },
      });
      g.setNode(modelColId, { width: COL_W, height: COL_H });
      addEdge(modelColId, modelId, "#22C55E70");
    }

    for (const sc of col.sourceColumns) {
      const srcColId = `scol:${sc.sourceName}.${sc.column}`;
      if (!seenSourceCols.has(srcColId)) {
        seenSourceCols.add(srcColId);
        const path = sc.database && sc.schema ? `${sc.database}.${sc.schema}` : undefined;
        graphNodes.push({
          id: srcColId,
          type: "sourceColumn",
          position: { x: 0, y: 0 },
          data: { col: sc.column, source: sc.sourceName, path },
        });
        g.setNode(srcColId, { width: SOURCE_W, height: SOURCE_H });
      }
      const isRenamed = sc.column.toLowerCase() !== col.columnName.toLowerCase();
      addEdge(srcColId, modelColId, "#EAB30870", isRenamed);
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

interface AssetColumnLineageGraphProps {
  data: AssetColumnLineageData;
}

export default function AssetColumnLineageGraph({ data }: AssetColumnLineageGraphProps) {
  const isDark = useDarkMode();

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildAssetColumnGraph(data, isDark),
    [data, isDark]
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDark ? "#334155" : "#E2E8F0"} gap={24} size={1} />
        <Controls style={{ background: isDark ? "#1E293B" : "#FFFFFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: 10 }} />
      </ReactFlow>
    </div>
  );
}
