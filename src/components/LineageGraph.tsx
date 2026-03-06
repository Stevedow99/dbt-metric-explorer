"use client";

import { useCallback, useEffect, useMemo } from "react";
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
import {
  LineageNode,
  LineageEdge,
  NamingMode,
  getDisplayName,
  getTableSubtitle,
  isSigmaUrl,
} from "@/lib/types";
import { DbtMark, SigmaLogo } from "@/components/Icons";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 88;

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  metric:         { bg: "#FFF7F5", border: "#FF694B", icon: "M",  label: "Metric" },
  semantic_model: { bg: "#FAF5FF", border: "#A855F7", icon: "SM", label: "Semantic Model" },
  model:          { bg: "#F0FDF4", border: "#22C55E", icon: "Mo", label: "Model" },
  source:         { bg: "#FEFCE8", border: "#EAB308", icon: "S",  label: "Source" },
  seed:           { bg: "#FDF2F8", border: "#EC4899", icon: "Se", label: "Seed" },
  snapshot:       { bg: "#F0F9FF", border: "#38BDF8", icon: "Sn", label: "Snapshot" },
  exposure:       { bg: "#EEF2FF", border: "#6366F1", icon: "E",  label: "Dashboard" },
};

function getStatusColor(status: string | null | undefined): string {
  if (!status) return "#6B7280";
  switch (status.toLowerCase()) {
    case "success": return "#34D399";
    case "error":
    case "fail":    return "#F87171";
    case "warn":    return "#FBBF24";
    default:        return "#6B7280";
  }
}

function CustomNode({ data }: { data: Record<string, unknown> }) {
  const node = data.lineageNode as LineageNode;
  const namingMode = (data.namingMode as NamingMode) ?? "dbt";
  const style = TYPE_STYLES[node.type] ?? TYPE_STYLES.model;
  const displayName = getDisplayName(node, namingMode);
  const subtitle = getTableSubtitle(node, namingMode);
  const isSigma = node.type === "exposure" && isSigmaUrl(node.url);
  const status = node.executionInfo?.lastRunStatus ?? node.freshness?.freshnessStatus;

  return (
    <div
      className="rounded-xl"
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}40`,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        padding: "10px 14px",
        boxShadow: `0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px ${style.border}20`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: style.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: style.border, width: 8, height: 8 }} />

      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        {isSigma ? (
          <SigmaLogo size={16} className="rounded flex-shrink-0" />
        ) : node.type === "metric" ? (
          <DbtMark size={16} className="rounded flex-shrink-0" />
        ) : (
          <span
            className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
            style={{ background: style.border + "20", color: style.border }}
          >
            {style.icon}
          </span>
        )}
        <span className="text-[11px] font-semibold truncate flex-1" style={{ color: "#1E293B" }} title={displayName}>
          {displayName}
        </span>
        {status && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(status) }} title={status} />
        )}
      </div>

      {/* Type label */}
      <div className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: style.border + "AA" }}>
        {isSigma ? "Sigma Dashboard" : style.label}
      </div>

      {/* Table path (formatted) */}
      {subtitle && (
        <div className="text-[9px] text-slate-500 truncate font-mono" title={subtitle}>
          {subtitle}
        </div>
      )}

      {/* dbt mode: show materializedType */}
      {namingMode === "dbt" && node.materializedType && node.type !== "exposure" && !subtitle && (
        <div className="text-[9px] text-slate-500">{node.materializedType}</div>
      )}

      {/* Exposure URL domain */}
      {node.type === "exposure" && node.url && (
        <div className="text-[9px] text-indigo-600/70 truncate font-mono" title={node.url}>
          {node.url.replace(/^https?:\/\//, "").split("/")[0]}
        </div>
      )}

      {/* Execution time */}
      {node.executionInfo?.executionTime != null && (
        <div className="text-[9px] text-slate-500 mt-0.5">{node.executionInfo.executionTime.toFixed(1)}s</div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function layoutGraph(
  lineageNodes: LineageNode[],
  lineageEdges: LineageEdge[],
  namingMode: NamingMode
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 50 });

  for (const n of lineageNodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of lineageEdges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  const nodes: Node[] = lineageNodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "custom",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { lineageNode: n, namingMode },
    };
  });

  const edges: Edge[] = lineageEdges
    .filter((e) => g.hasNode(e.source) && g.hasNode(e.target))
    .map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#CBD5E1", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#CBD5E1", width: 16, height: 16 },
    }));

  return { nodes, edges };
}

interface LineageGraphProps {
  lineageNodes: LineageNode[];
  lineageEdges: LineageEdge[];
  namingMode: NamingMode;
  onNodeClick?: (node: LineageNode) => void;
}

export default function LineageGraph({ lineageNodes, lineageEdges, namingMode, onNodeClick }: LineageGraphProps) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutGraph(lineageNodes, lineageEdges, namingMode),
    [lineageNodes, lineageEdges, namingMode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.((node.data as Record<string, unknown>).lineageNode as LineageNode);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick} nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E2E8F0" gap={24} size={1} />
        <Controls style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10 }} />
      </ReactFlow>
    </div>
  );
}
