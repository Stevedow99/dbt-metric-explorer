export type NamingMode = "dbt" | "table";

export interface MetricSummary {
  name: string;
  description: string;
  type: string;
  formula: string | null;
  filter: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  parents: { name: string; resourceType: string; uniqueId: string }[];
  semanticLayer: SemanticLayerMetric | null;
}

export interface SemanticLayerMetric {
  name: string;
  description: string;
  type: string;
  typeParams: {
    measure?: {
      name: string;
      filter?: { whereSqlTemplate: string } | null;
      join_to_timespine?: boolean;
    };
    inputMeasures?: { name: string }[];
    metrics?: { name: string; alias?: string }[];
    expr?: string;
  };
  filter?: { whereSqlTemplate: string } | null;
  dimensions: SemanticLayerDimension[];
  queryableGranularities: string[];
}

export interface SemanticLayerDimension {
  name: string;
  description: string;
  type: string;
  queryableGranularities: string[];
}

export interface LineageNode {
  id: string;
  name: string;
  type: "metric" | "semantic_model" | "model" | "source" | "seed" | "snapshot" | "exposure";
  description?: string;
  meta?: Record<string, unknown>;
  materializedType?: string;
  database?: string;
  schema?: string;
  alias?: string;
  identifier?: string;
  executionInfo?: {
    executeCompletedAt: string | null;
    lastRunStatus: string | null;
    executionTime: number | null;
  };
  freshness?: {
    maxLoadedAt: string | null;
    freshnessStatus: string | null;
  };
  sourceName?: string;
  rawCode?: string;
  url?: string;
  ownerName?: string;
  exposureType?: string;
  label?: string;
}

export interface LineageEdge {
  source: string;
  target: string;
}

// ─── Column / Field Lineage ──────────────────────────────────────────────────

export interface ColumnTraceColumn {
  modelColumn: string;
  modelColumnType: string | null;
  sourceColumn: string | null;
  sourceName: string | null;
  sourceDatabase: string | null;
  sourceSchema: string | null;
}

export interface ColumnTrace {
  metricName: string;
  measureName: string;
  measureAgg: string;
  measureExpr: string;
  measureDescription: string | null;
  semanticModelName: string;
  modelName: string;
  modelId: string;
  modelDatabase: string | null;
  modelSchema: string | null;
  columns: ColumnTraceColumn[];
}

export interface DimensionField {
  name: string;
  type: string;
  description: string | null;
  expr: string | null;
  semanticModelName: string;
}

export interface EntityField {
  name: string;
  type: string;
  description: string | null;
  expr: string | null;
  semanticModelName: string;
}

export interface ExposureRef {
  name: string;
  label: string | null;
  url: string | null;
  exposureType: string | null;
  ownerName: string | null;
  parentMetricNames: string[];
}

export interface ColumnLineageData {
  traces: ColumnTrace[];
  dimensions: DimensionField[];
  entities: EntityField[];
  exposures: ExposureRef[];
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface MetricLineageResponse {
  nodes: LineageNode[];
  edges: LineageEdge[];
  metric: {
    name: string;
    description: string;
    type: string;
    formula: string | null;
    filter: string | null;
    tags: string[];
    parents: { name: string; resourceType: string; uniqueId: string }[];
  };
  dimensions: SemanticLayerDimension[];
  columnLineage: ColumnLineageData;
}

// ─── Asset Explorer Types ────────────────────────────────────────────────────

export interface AssetSummary {
  uniqueId: string;
  name: string;
  type: "model" | "source" | "exposure";
  description?: string;
  materializedType?: string;
  database?: string;
  schema?: string;
  alias?: string;
  sourceName?: string;
  exposureType?: string;
  url?: string;
  label?: string;
  tags?: string[];
}

export interface AssetColumnTrace {
  columnName: string;
  columnType: string | null;
  upstreamColumns: {
    column: string;
    model: string;
    modelId: string;
    database: string | null;
    schema: string | null;
  }[];
  sourceColumns: {
    column: string;
    sourceName: string;
    database: string | null;
    schema: string | null;
  }[];
}

export interface AssetColumnLineageData {
  columns: AssetColumnTrace[];
  modelName: string;
  modelId: string;
  modelDatabase: string | null;
  modelSchema: string | null;
}

export interface AssetLineageResponse {
  nodes: LineageNode[];
  edges: LineageEdge[];
  asset: LineageNode;
  columnLineage: AssetColumnLineageData | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getDisplayName(node: LineageNode, mode: NamingMode): string {
  if (mode === "table") {
    if (node.type === "model" || node.type === "semantic_model") {
      if (node.database && node.schema) {
        return node.alias || node.name;
      }
    }
    if (node.type === "source") {
      if (node.database && node.schema) {
        return node.identifier || node.name;
      }
    }
  }
  return node.name;
}

export function getTableSubtitle(node: LineageNode, mode: NamingMode): string | null {
  if (mode === "table" && node.database && node.schema) {
    return `${node.database}.${node.schema}`;
  }
  return null;
}

export function isSigmaUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("sigma.com") || url.includes(".sigmacomputing.com");
}
