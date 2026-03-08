"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useDarkMode } from "@/lib/useDarkMode";
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

interface TypeStyle { bg: string; border: string; icon: string; label: string }

const TYPE_STYLES_LIGHT: Record<string, TypeStyle> = {
  metric:         { bg: "#FFF7F5", border: "#FF694B", icon: "M",  label: "Metric" },
  semantic_model: { bg: "#FAF5FF", border: "#A855F7", icon: "SM", label: "Semantic Model" },
  model:          { bg: "#F0FDF4", border: "#22C55E", icon: "Mo", label: "Model" },
  source:         { bg: "#FEFCE8", border: "#EAB308", icon: "S",  label: "Source" },
  seed:           { bg: "#FDF2F8", border: "#EC4899", icon: "Se", label: "Seed" },
  snapshot:       { bg: "#F0F9FF", border: "#38BDF8", icon: "Sn", label: "Snapshot" },
  exposure:       { bg: "#EEF2FF", border: "#6366F1", icon: "E",  label: "Dashboard" },
};

const TYPE_STYLES_DARK: Record<string, TypeStyle> = {
  metric:         { bg: "#2D1A15", border: "#FF694B", icon: "M",  label: "Metric" },
  semantic_model: { bg: "#1E1530", border: "#C084FC", icon: "SM", label: "Semantic Model" },
  model:          { bg: "#0F2218", border: "#4ADE80", icon: "Mo", label: "Model" },
  source:         { bg: "#1E1B0C", border: "#FACC15", icon: "S",  label: "Source" },
  seed:           { bg: "#2D1425", border: "#F472B6", icon: "Se", label: "Seed" },
  snapshot:       { bg: "#0F1E2D", border: "#7DD3FC", icon: "Sn", label: "Snapshot" },
  exposure:       { bg: "#151830", border: "#818CF8", icon: "E",  label: "Dashboard" },
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
  const isDark = data.isDark as boolean;
  const styles = isDark ? TYPE_STYLES_DARK : TYPE_STYLES_LIGHT;
  const style = styles[node.type] ?? styles.model;
  const displayName = getDisplayName(node, namingMode);
  const subtitle = getTableSubtitle(node, namingMode);
  const isSigma = node.type === "exposure" && isSigmaUrl(node.url);
  const status = node.executionInfo?.lastRunStatus ?? node.freshness?.freshnessStatus;
  const textPrimary = isDark ? "#F1F5F9" : "#1E293B";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <div
      className="rounded-xl"
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}40`,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        padding: "10px 14px",
        boxShadow: `0 1px 3px rgba(0,0,0,${isDark ? "0.3" : "0.08"}), 0 0 0 1px ${style.border}20`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: style.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: style.border, width: 8, height: 8 }} />

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
        <span className="text-[11px] font-semibold truncate flex-1" style={{ color: textPrimary }} title={displayName}>
          {displayName}
        </span>
        {status && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getStatusColor(status) }} title={status} />
        )}
      </div>

      <div className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: style.border + "AA" }}>
        {isSigma ? "Sigma Dashboard" : style.label}
      </div>

      {subtitle && (
        <div className="text-[9px] truncate font-mono" style={{ color: textSecondary }} title={subtitle}>
          {subtitle}
        </div>
      )}

      {namingMode === "dbt" && node.materializedType && node.type !== "exposure" && !subtitle && (
        <div className="text-[9px]" style={{ color: textSecondary }}>{node.materializedType}</div>
      )}

      {node.type === "exposure" && node.url && (
        <div className="text-[9px] truncate font-mono" style={{ color: isDark ? "#A5B4FC" : "#4F46E5", opacity: 0.7 }} title={node.url}>
          {node.url.replace(/^https?:\/\//, "").split("/")[0]}
        </div>
      )}

      {node.executionInfo?.executionTime != null && (
        <div className="text-[9px] mt-0.5" style={{ color: textSecondary }}>{node.executionInfo.executionTime.toFixed(1)}s</div>
      )}
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function layoutGraph(
  lineageNodes: LineageNode[],
  lineageEdges: LineageEdge[],
  namingMode: NamingMode,
  isDark: boolean
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
      data: { lineageNode: n, namingMode, isDark },
    };
  });

  const edgeColor = isDark ? "#475569" : "#CBD5E1";
  const edges: Edge[] = lineageEdges
    .filter((e) => g.hasNode(e.source) && g.hasNode(e.target))
    .map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: true,
      style: { stroke: edgeColor, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
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
  const isDark = useDarkMode();

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutGraph(lineageNodes, lineageEdges, namingMode, isDark),
    [lineageNodes, lineageEdges, namingMode, isDark]
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
        <Background color={isDark ? "#334155" : "#E2E8F0"} gap={24} size={1} />
        <Controls style={{ background: isDark ? "#1E293B" : "#FFFFFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: 10 }} />
      </ReactFlow>
    </div>
  );
}
