const DISCOVERY_API_URL = process.env.DBT_DISCOVERY_API_URL!;
const SEMANTIC_LAYER_API_URL = process.env.DBT_SEMANTIC_LAYER_API_URL!;
const SERVICE_TOKEN = process.env.DBT_SERVICE_TOKEN!;
const ENVIRONMENT_ID = process.env.DBT_ENVIRONMENT_ID!;

async function gqlRequest(url: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbt API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// ─── Discovery API ───────────────────────────────────────────────────────────

export async function fetchAllMetrics(): Promise<MetricDefinition[]> {
  const query = `
    query ($environmentId: BigInt!, $first: Int!) {
      environment(id: $environmentId) {
        definition {
          metrics(first: $first) {
            edges {
              node {
                name
                description
                type
                formula
                filter
                tags
                meta
                parents {
                  name
                  resourceType
                  uniqueId
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
  });

  return data.environment.definition.metrics.edges.map(
    (e: { node: MetricDefinition }) => e.node
  );
}

export async function fetchSemanticModels(): Promise<SemanticModelDef[]> {
  const query = `
    query ($environmentId: BigInt!, $first: Int!) {
      environment(id: $environmentId) {
        definition {
          semanticModels(first: $first) {
            edges {
              node {
                name
                uniqueId
                description
                parents {
                  name
                  uniqueId
                  resourceType
                }
                measures {
                  name
                  agg
                  expr
                  description
                }
                dimensions {
                  name
                  type
                  description
                }
                entities {
                  name
                  type
                  description
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
  });

  return data.environment.definition.semanticModels.edges.map(
    (e: { node: SemanticModelDef }) => e.node
  );
}

export async function fetchModelLineage(uniqueIds: string[]): Promise<ModelNode[]> {
  if (uniqueIds.length === 0) return [];

  const query = `
    query ($environmentId: BigInt!, $first: Int!, $uniqueIds: [String!]) {
      environment(id: $environmentId) {
        applied {
          models(first: $first, filter: { uniqueIds: $uniqueIds }) {
            edges {
              node {
                uniqueId
                name
                description
                materializedType
                database
                schema
                alias
                tags
                meta
                rawCode
                compiledCode
                executionInfo {
                  executeCompletedAt
                  lastRunStatus
                  executionTime
                  lastRunId
                }
                ancestors(types: [Model, Source]) {
                  ... on ModelAppliedStateNestedNode {
                    uniqueId
                    name
                    resourceType
                    materializedType
                    modelExec: executionInfo {
                      executeCompletedAt
                      lastRunStatus
                      executionTime
                    }
                  }
                  ... on SourceAppliedStateNestedNode {
                    uniqueId
                    sourceName
                    name
                    resourceType
                    freshness {
                      maxLoadedAt
                      freshnessStatus
                    }
                  }
                }
                parents {
                  uniqueId
                  name
                  resourceType
                }
                catalog {
                  columns {
                    name
                    type
                    description
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
    uniqueIds,
  });

  return data.environment.applied.models.edges.map(
    (e: { node: Record<string, unknown> }) => {
      const raw = e.node as Record<string, unknown>;
      const ancestors = raw.ancestors as Record<string, unknown>[];
      if (ancestors) {
        for (const anc of ancestors) {
          if ("modelExec" in anc && anc.modelExec) {
            anc.executionInfo = anc.modelExec;
            delete anc.modelExec;
          }
        }
      }
      return raw as unknown as ModelNode;
    }
  );
}

export async function fetchSourceDetails(uniqueIds: string[]): Promise<SourceNode[]> {
  if (uniqueIds.length === 0) return [];

  const query = `
    query ($environmentId: BigInt!, $first: Int!, $uniqueIds: [String!]) {
      environment(id: $environmentId) {
        applied {
          sources(first: $first, filter: { uniqueIds: $uniqueIds }) {
            edges {
              node {
                uniqueId
                sourceName
                name
                description
                database
                schema
                identifier
                loader
                freshness {
                  maxLoadedAt
                  freshnessStatus
                  maxLoadedAtTimeAgoInS
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
    uniqueIds,
  });

  return data.environment.applied.sources.edges.map(
    (e: { node: SourceNode }) => e.node
  );
}

export async function fetchAllExposures(): Promise<ExposureNode[]> {
  const query = `
    query ($environmentId: BigInt!, $first: Int!) {
      environment(id: $environmentId) {
        applied {
          exposures(first: $first) {
            edges {
              node {
                uniqueId
                name
                description
                ownerName
                ownerEmail
                url
                exposureType
                label
                maturity
                parents {
                  name
                  resourceType
                  uniqueId
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
  });

  return data.environment.applied.exposures.edges.map(
    (e: { node: ExposureNode }) => e.node
  );
}

// ─── Asset Explorer API ──────────────────────────────────────────────────────

export async function fetchAllAssets() {
  const query = `
    query ($environmentId: BigInt!, $first: Int!) {
      environment(id: $environmentId) {
        applied {
          models(first: $first) {
            edges {
              node {
                uniqueId
                name
                description
                materializedType
                database
                schema
                alias
                tags
              }
            }
          }
          sources(first: $first) {
            edges {
              node {
                uniqueId
                sourceName
                name
                description
                database
                schema
              }
            }
          }
          exposures(first: $first) {
            edges {
              node {
                uniqueId
                name
                description
                exposureType
                url
                label
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
  });

  const models = data.environment.applied.models.edges.map(
    (e: { node: Record<string, unknown> }) => ({
      ...e.node,
      type: "model",
    })
  );

  const sources = data.environment.applied.sources.edges.map(
    (e: { node: Record<string, unknown> }) => ({
      ...e.node,
      type: "source",
    })
  );

  const exposures = data.environment.applied.exposures.edges.map(
    (e: { node: Record<string, unknown> }) => ({
      ...e.node,
      type: "exposure",
    })
  );

  return { models, sources, exposures };
}

export async function fetchAllModelParents(): Promise<
  { uniqueId: string; name: string; parents: { uniqueId: string; name: string; resourceType: string }[] }[]
> {
  const query = `
    query ($environmentId: BigInt!, $first: Int!) {
      environment(id: $environmentId) {
        applied {
          models(first: $first) {
            edges {
              node {
                uniqueId
                name
                parents {
                  uniqueId
                  name
                  resourceType
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlRequest(DISCOVERY_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    first: 500,
  });

  return data.environment.applied.models.edges.map(
    (e: { node: { uniqueId: string; name: string; parents: { uniqueId: string; name: string; resourceType: string }[] } }) => e.node
  );
}

export async function buildAssetLineage(
  uniqueId: string
): Promise<{
  nodes: LineageNode[];
  edges: LineageEdge[];
  asset: LineageNode;
  columnLineage: {
    columns: {
      columnName: string;
      columnType: string | null;
      upstreamColumns: { column: string; model: string; modelId: string; database: string | null; schema: string | null }[];
      sourceColumns: { column: string; sourceName: string; database: string | null; schema: string | null }[];
    }[];
    modelName: string;
    modelId: string;
    modelDatabase: string | null;
    modelSchema: string | null;
  } | null;
}> {
  const isSource = uniqueId.startsWith("source.");
  const isModel = uniqueId.startsWith("model.");

  const [allModelParents, allSemanticModels, allMetrics, allExposures] = await Promise.all([
    fetchAllModelParents(),
    fetchSemanticModels(),
    fetchAllMetrics(),
    fetchAllExposures().catch(() => [] as ExposureNode[]),
  ]);

  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];
  const visitedIds = new Set<string>();

  function addNode(node: LineageNode) {
    if (visitedIds.has(node.id)) return;
    visitedIds.add(node.id);
    nodes.push(node);
  }

  function addEdge(source: string, target: string) {
    const exists = edges.some((e) => e.source === source && e.target === target);
    if (!exists) edges.push({ source, target });
  }

  // Build parent→children adjacency map for downstream traversal
  const childrenMap = new Map<string, string[]>();
  for (const m of allModelParents) {
    for (const p of m.parents) {
      const children = childrenMap.get(p.uniqueId) ?? [];
      children.push(m.uniqueId);
      childrenMap.set(p.uniqueId, children);
    }
  }

  // === UPSTREAM: Fetch the target + its ancestors ===
  let targetModelIds: string[] = [];

  if (isModel) {
    targetModelIds = [uniqueId];
  } else if (isSource) {
    // Find models that directly depend on this source
    const directChildren = childrenMap.get(uniqueId) ?? [];
    targetModelIds = directChildren.filter((id) => id.startsWith("model."));
  }

  // Fetch full details for the target model(s) with ancestors
  const fetchedModels = await fetchModelLineage(targetModelIds);
  const sourceIds: string[] = [];

  for (const model of fetchedModels) {
    addNode({
      id: model.uniqueId,
      name: model.name,
      type: "model",
      description: model.description,
      materializedType: model.materializedType,
      database: model.database,
      schema: model.schema,
      alias: model.alias,
      executionInfo: model.executionInfo,
      rawCode: model.rawCode,
    });

    // Process ancestors (upstream chain)
    if (model.ancestors) {
      for (const ancestor of model.ancestors) {
        const isAncSource =
          ancestor.resourceType === "SourceAppliedStateNestedNode" ||
          ancestor.uniqueId.startsWith("source.");

        if (isAncSource) {
          sourceIds.push(ancestor.uniqueId);
          const srcAnc = ancestor as Extract<AncestorNode, { resourceType: "SourceAppliedStateNestedNode" }>;
          addNode({
            id: ancestor.uniqueId,
            name: ancestor.name,
            type: "source",
            sourceName: srcAnc.sourceName,
            freshness: srcAnc.freshness,
          });
        } else {
          addNode({
            id: ancestor.uniqueId,
            name: ancestor.name,
            type: "model",
            materializedType: (ancestor as { materializedType?: string }).materializedType,
            executionInfo: (ancestor as { executionInfo?: { executeCompletedAt: string | null; lastRunStatus: string | null; executionTime: number | null } }).executionInfo,
          });
        }
        addEdge(ancestor.uniqueId, model.uniqueId);
      }
    }

    // Add source parents not covered by ancestors
    if (model.parents) {
      for (const parent of model.parents) {
        if (parent.uniqueId.startsWith("source.") && !visitedIds.has(parent.uniqueId)) {
          sourceIds.push(parent.uniqueId);
          addNode({
            id: parent.uniqueId,
            name: parent.name,
            type: "source",
          });
        }
        addEdge(parent.uniqueId, model.uniqueId);
      }
    }
  }

  // If the target is a source, add it as a node too
  if (isSource && !visitedIds.has(uniqueId)) {
    sourceIds.push(uniqueId);
    const sourceName = uniqueId.split(".").pop() ?? uniqueId;
    addNode({
      id: uniqueId,
      name: sourceName,
      type: "source",
    });
    // Connect source → its child models
    for (const childId of targetModelIds) {
      addEdge(uniqueId, childId);
    }
  }

  // Enrich source nodes with details
  if (sourceIds.length > 0) {
    try {
      const sources = await fetchSourceDetails([...new Set(sourceIds)]);
      for (const src of sources) {
        const existing = nodes.find((n) => n.id === src.uniqueId);
        if (existing) {
          existing.description = src.description;
          existing.database = src.database;
          existing.schema = src.schema;
          existing.identifier = src.identifier;
          existing.sourceName = src.sourceName;
          existing.freshness = src.freshness;
        }
      }
    } catch {
      // supplementary
    }
  }

  // === DOWNSTREAM: BFS from the target to find child models ===
  const downstreamQueue = isSource ? [...targetModelIds, uniqueId] : [uniqueId];
  const downstreamVisited = new Set(downstreamQueue);

  while (downstreamQueue.length > 0) {
    const currentId = downstreamQueue.shift()!;
    const children = childrenMap.get(currentId) ?? [];

    for (const childId of children) {
      if (downstreamVisited.has(childId)) continue;
      downstreamVisited.add(childId);
      downstreamQueue.push(childId);

      const childModel = allModelParents.find((m) => m.uniqueId === childId);
      if (childModel && !visitedIds.has(childId)) {
        addNode({
          id: childId,
          name: childModel.name,
          type: "model",
        });
      }
      addEdge(currentId, childId);
    }
  }

  // Fetch details for downstream models we just discovered
  const downstreamModelIds = [...downstreamVisited].filter(
    (id) => id.startsWith("model.") && id !== uniqueId && !fetchedModels.some((m) => m.uniqueId === id)
  );
  if (downstreamModelIds.length > 0) {
    try {
      const downModels = await fetchModelLineage(downstreamModelIds);
      for (const dm of downModels) {
        const existing = nodes.find((n) => n.id === dm.uniqueId);
        if (existing) {
          existing.description = dm.description;
          existing.materializedType = dm.materializedType;
          existing.database = dm.database;
          existing.schema = dm.schema;
          existing.alias = dm.alias;
          existing.executionInfo = dm.executionInfo;
          existing.rawCode = dm.rawCode;
        }
      }
    } catch {
      // supplementary
    }
  }

  // === DOWNSTREAM: Semantic models that reference any model in our graph ===
  const allGraphModelIds = new Set(nodes.filter((n) => n.type === "model").map((n) => n.id));
  const smMap = new Map<string, SemanticModelDef>();

  for (const sm of allSemanticModels) {
    const referencesGraphModel = sm.parents.some((p) => allGraphModelIds.has(p.uniqueId));
    if (referencesGraphModel) {
      smMap.set(sm.uniqueId, sm);
      addNode({
        id: sm.uniqueId,
        name: sm.name,
        type: "semantic_model",
        description: sm.description,
      });
      for (const p of sm.parents) {
        if (allGraphModelIds.has(p.uniqueId)) {
          addEdge(p.uniqueId, sm.uniqueId);
        }
      }
    }
  }

  // === DOWNSTREAM: Metrics that reference semantic models in the graph ===
  const smIds = new Set(smMap.keys());
  const metricsMap = new Map<string, MetricDefinition>();

  for (const m of allMetrics) {
    const referencesSM = m.parents.some(
      (p) => p.uniqueId.startsWith("semantic_model.") && smIds.has(p.uniqueId)
    );
    const referencesModel = m.parents.some(
      (p) => p.uniqueId.startsWith("model.") && allGraphModelIds.has(p.uniqueId)
    );
    if (referencesSM || referencesModel) {
      const mId = `metric.${m.name}`;
      metricsMap.set(m.name, m);
      addNode({
        id: mId,
        name: m.name,
        type: "metric",
        description: m.description,
        meta: m.meta,
      });
      for (const p of m.parents) {
        if (p.uniqueId.startsWith("semantic_model.") && smIds.has(p.uniqueId)) {
          addEdge(p.uniqueId, mId);
        } else if (p.uniqueId.startsWith("model.") && allGraphModelIds.has(p.uniqueId)) {
          addEdge(p.uniqueId, mId);
        }
      }
    }
  }

  // Add derived metrics that reference metrics already in the graph
  const metricNodeIds = new Set(nodes.filter((n) => n.type === "metric").map((n) => n.id));
  for (const m of allMetrics) {
    const mId = `metric.${m.name}`;
    if (metricNodeIds.has(mId)) continue;
    const referencesGraphMetric = m.parents.some(
      (p) => p.uniqueId.startsWith("metric.") && metricNodeIds.has(`metric.${p.name}`)
    );
    if (referencesGraphMetric) {
      metricsMap.set(m.name, m);
      addNode({
        id: mId,
        name: m.name,
        type: "metric",
        description: m.description,
        meta: m.meta,
      });
      for (const p of m.parents) {
        if (p.uniqueId.startsWith("metric.")) {
          const parentId = `metric.${p.name}`;
          if (metricNodeIds.has(parentId) || visitedIds.has(parentId)) {
            addEdge(parentId, mId);
          }
        }
      }
      metricNodeIds.add(mId);
    }
  }

  // === DOWNSTREAM: Exposures ===
  const allNodeIds = new Set(nodes.map((n) => n.id));

  for (const exposure of allExposures) {
    const matchingParents = exposure.parents.filter((p) => allNodeIds.has(p.uniqueId));
    if (matchingParents.length > 0) {
      addNode({
        id: exposure.uniqueId,
        name: exposure.label || exposure.name,
        type: "exposure",
        description: exposure.description,
        url: exposure.url,
        ownerName: exposure.ownerName,
        exposureType: exposure.exposureType,
        label: exposure.label,
      });
      for (const mp of matchingParents) {
        addEdge(mp.uniqueId, exposure.uniqueId);
      }
    }
  }

  // Identify the target asset node
  let asset = nodes.find((n) => n.id === uniqueId);
  if (!asset) {
    asset = { id: uniqueId, name: uniqueId.split(".").pop() ?? uniqueId, type: isSource ? "source" : "model" };
    addNode(asset);
  }

  // === COLUMN LINEAGE (for models only) ===
  let columnLineage = null;

  if (isModel && fetchedModels.length > 0) {
    const targetModel = fetchedModels.find((m) => m.uniqueId === uniqueId);
    if (targetModel?.catalog?.columns) {
      const catalogColumns = targetModel.catalog.columns;
      const columnRenames = parseColumnRenames(targetModel.rawCode ?? "");

      // Find source ancestors for this model
      const sourceAncs: { uniqueId: string; name: string; sourceName?: string }[] = [];
      for (const a of targetModel.ancestors || []) {
        if (a.resourceType === "SourceAppliedStateNestedNode") {
          sourceAncs.push({ uniqueId: a.uniqueId, name: a.name, sourceName: (a as Extract<AncestorNode, { resourceType: "SourceAppliedStateNestedNode" }>).sourceName });
        }
      }
      if (sourceAncs.length === 0) {
        for (const p of targetModel.parents || []) {
          if (p.uniqueId.startsWith("source.")) {
            sourceAncs.push({ uniqueId: p.uniqueId, name: p.name });
          }
        }
      }

      // Find upstream model ancestors
      const upstreamModelAncs: { uniqueId: string; name: string; database?: string; schema?: string }[] = [];
      for (const a of targetModel.ancestors || []) {
        if (a.resourceType === "ModelAppliedStateNestedNode" || a.uniqueId.startsWith("model.")) {
          const enriched = nodes.find((n) => n.id === a.uniqueId);
          upstreamModelAncs.push({
            uniqueId: a.uniqueId,
            name: a.name,
            database: enriched?.database,
            schema: enriched?.schema,
          });
        }
      }

      const sourceDetails = new Map<string, { database?: string; schema?: string }>();
      for (const n of nodes) {
        if (n.type === "source" && n.database && n.schema) {
          sourceDetails.set(n.id, { database: n.database, schema: n.schema });
        }
      }

      const columns: {
        columnName: string;
        columnType: string | null;
        upstreamColumns: { column: string; model: string; modelId: string; database: string | null; schema: string | null }[];
        sourceColumns: { column: string; sourceName: string; database: string | null; schema: string | null }[];
      }[] = [];

      for (const col of catalogColumns) {
        const sourceCol = columnRenames.get(col.name.toLowerCase()) ?? col.name.toLowerCase();

        const upstreamColumns = upstreamModelAncs.map((um) => ({
          column: sourceCol,
          model: um.name,
          modelId: um.uniqueId,
          database: um.database ?? null,
          schema: um.schema ?? null,
        }));

        const sourceColumns = sourceAncs.map((sa) => {
          const sd = sourceDetails.get(sa.uniqueId);
          return {
            column: sourceCol,
            sourceName: sa.sourceName ?? sa.name,
            database: sd?.database ?? null,
            schema: sd?.schema ?? null,
          };
        });

        columns.push({
          columnName: col.name,
          columnType: col.type ?? null,
          upstreamColumns,
          sourceColumns,
        });
      }

      columnLineage = {
        columns,
        modelName: targetModel.name,
        modelId: targetModel.uniqueId,
        modelDatabase: targetModel.database ?? null,
        modelSchema: targetModel.schema ?? null,
      };
    }
  }

  return { nodes, edges, asset, columnLineage };
}

// ─── Semantic Layer API ──────────────────────────────────────────────────────

export async function fetchSemanticLayerMetrics() {
  const query = `
    query ($environmentId: BigInt!) {
      metricsPaginated(environmentId: $environmentId, pageNum: 1, pageSize: 500) {
        items {
          name
          description
          type
          typeParams {
            measure {
              name
              filter {
                whereSqlTemplate
              }
            }
            inputMeasures {
              name
            }
            metrics {
              name
            }
            expr
          }
          filter {
            whereSqlTemplate
          }
          dimensions {
            name
            description
            type
            queryableGranularities
          }
          queryableGranularities
        }
        totalItems
      }
    }
  `;

  const data = await gqlRequest(SEMANTIC_LAYER_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
  });

  return data.metricsPaginated;
}

export async function fetchMetricDimensions(metricName: string) {
  const query = `
    query ($environmentId: BigInt!, $metrics: [MetricInput!]!) {
      dimensionsPaginated(environmentId: $environmentId, metrics: $metrics, pageNum: 1, pageSize: 500) {
        items {
          name
          description
          type
          queryableGranularities
        }
        totalItems
      }
    }
  `;

  const data = await gqlRequest(SEMANTIC_LAYER_API_URL, query, {
    environmentId: parseInt(ENVIRONMENT_ID),
    metrics: [{ name: metricName }],
  });

  return data.dimensionsPaginated;
}

// ─── Semantic Layer Compile SQL ──────────────────────────────────────────────

export async function compileSemanticLayerQuery(
  metricNames: string[],
  groupBy: { name: string; grain?: string }[],
  limit: number = 10
): Promise<string> {
  const createMutation = `
    mutation ($environmentId: BigInt!, $metrics: [MetricInput!]!, $groupBy: [GroupByInput!], $limit: Int) {
      createQuery(
        environmentId: $environmentId
        metrics: $metrics
        groupBy: $groupBy
        limit: $limit
        readCache: false
      ) {
        queryId
      }
    }
  `;

  const metricsInput = metricNames.map((name) => ({ name }));
  const groupByInput = groupBy.map((g) => {
    const input: Record<string, unknown> = { name: g.name };
    if (g.grain) input.grain = g.grain;
    return input;
  });

  const createData = await gqlRequest(SEMANTIC_LAYER_API_URL, createMutation, {
    environmentId: parseInt(ENVIRONMENT_ID),
    metrics: metricsInput,
    groupBy: groupByInput,
    limit,
  });

  const queryId = createData.createQuery.queryId;

  const pollQuery = `
    query ($environmentId: BigInt!, $queryId: String!) {
      query(environmentId: $environmentId, queryId: $queryId) {
        status
        sql
        error
      }
    }
  `;

  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, i < 3 ? 500 : 1000));

    const pollData = await gqlRequest(SEMANTIC_LAYER_API_URL, pollQuery, {
      environmentId: parseInt(ENVIRONMENT_ID),
      queryId,
    });

    const result = pollData.query;

    if (result.status === "FAILED") {
      throw new Error(result.error ?? "Semantic Layer query compilation failed");
    }

    if (result.status === "SUCCESSFUL" || result.sql) {
      return result.sql ?? "";
    }
  }

  throw new Error("Timed out waiting for compiled SQL");
}

// ─── Semantic Layer Query Execution ──────────────────────────────────────────

export async function executeSemanticLayerQuery(
  metricNames: string[],
  groupBy: { name: string; grain?: string }[],
  limit: number = 5
): Promise<{ columns: { name: string; type: string }[]; rows: Record<string, unknown>[]; sql: string }> {
  const createMutation = `
    mutation ($environmentId: BigInt!, $metrics: [MetricInput!]!, $groupBy: [GroupByInput!], $limit: Int) {
      createQuery(
        environmentId: $environmentId
        metrics: $metrics
        groupBy: $groupBy
        limit: $limit
        readCache: true
      ) {
        queryId
      }
    }
  `;

  const metricsInput = metricNames.map((name) => ({ name }));
  const groupByInput = groupBy.map((g) => {
    const input: Record<string, unknown> = { name: g.name };
    if (g.grain) input.grain = g.grain;
    return input;
  });

  const createData = await gqlRequest(SEMANTIC_LAYER_API_URL, createMutation, {
    environmentId: parseInt(ENVIRONMENT_ID),
    metrics: metricsInput,
    groupBy: groupByInput,
    limit,
  });

  const queryId = createData.createQuery.queryId;

  const pollQuery = `
    query ($environmentId: BigInt!, $queryId: String!) {
      query(environmentId: $environmentId, queryId: $queryId) {
        status
        sql
        jsonResult
        arrowResult
        error
      }
    }
  `;

  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, i < 3 ? 500 : 1000));

    const pollData = await gqlRequest(SEMANTIC_LAYER_API_URL, pollQuery, {
      environmentId: parseInt(ENVIRONMENT_ID),
      queryId,
    });

    const result = pollData.query;

    if (result.status === "FAILED") {
      throw new Error(result.error ?? "Semantic Layer query failed");
    }

    if (result.status === "SUCCESSFUL") {
      const sql = result.sql ?? "";
      let columns: { name: string; type: string }[] = [];
      let rows: Record<string, unknown>[] = [];

      const jsonStr = result.jsonResult ?? result.arrowResult;
      if (jsonStr) {
        try {
          let parsed: unknown;
          if (typeof jsonStr === "string") {
            // Might be base64-encoded JSON (arrowResult) or plain JSON string
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              // Try base64 decode
              const decoded = Buffer.from(jsonStr, "base64").toString("utf-8");
              parsed = JSON.parse(decoded);
            }
          } else {
            parsed = jsonStr;
          }

          if (Array.isArray(parsed)) {
            // Direct array of row objects
            rows = parsed as Record<string, unknown>[];
          } else if (parsed && typeof parsed === "object") {
            const obj = parsed as Record<string, unknown>;

            // Extract schema fields
            if (obj.schema && typeof obj.schema === "object") {
              const schema = obj.schema as Record<string, unknown>;
              const fields = schema.fields;
              if (Array.isArray(fields)) {
                columns = fields.map((f: unknown) => {
                  const field = f as Record<string, unknown>;
                  const name = String(field.name ?? "");
                  let type = "unknown";
                  if (typeof field.type === "string") type = field.type;
                  else if (field.type && typeof field.type === "object") {
                    const t = field.type as Record<string, unknown>;
                    type = String(t.name ?? t.type ?? "unknown");
                  }
                  return { name, type };
                });
              }
            }

            // Extract rows from various possible keys
            const rowData = obj.data ?? obj.rows ?? obj.results;
            if (Array.isArray(rowData)) {
              // Check if data is column-oriented (each key maps to an array)
              if (rowData.length > 0 && typeof rowData[0] === "object" && !Array.isArray(rowData[0])) {
                rows = rowData as Record<string, unknown>[];
              }
            } else if (rowData && typeof rowData === "object") {
              // Column-oriented format: { "col1": [v1, v2], "col2": [v1, v2] }
              const colData = rowData as Record<string, unknown[]>;
              const keys = Object.keys(colData);
              if (keys.length > 0 && Array.isArray(colData[keys[0]])) {
                const len = (colData[keys[0]] as unknown[]).length;
                for (let r = 0; r < len; r++) {
                  const row: Record<string, unknown> = {};
                  for (const k of keys) row[k] = (colData[k] as unknown[])[r];
                  rows.push(row);
                }
              }
            }
          }

          // Infer columns from first row if we have rows but no schema
          if (columns.length === 0 && rows.length > 0) {
            columns = Object.keys(rows[0]).map((k) => ({ name: k, type: "unknown" }));
          }
        } catch (e) {
          console.error("Query result parse error:", e);
          console.error("Raw jsonResult type:", typeof result.jsonResult, "length:", result.jsonResult?.length);
          console.error("Raw arrowResult type:", typeof result.arrowResult, "length:", result.arrowResult?.length);
          if (typeof jsonStr === "string") {
            console.error("First 500 chars:", jsonStr.substring(0, 500));
          }
          throw new Error("Failed to parse query results");
        }
      }

      return { columns, rows, sql };
    }
  }

  throw new Error("Query timed out after 30 seconds");
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetricDefinition {
  name: string;
  description: string;
  type: string;
  formula: string | null;
  filter: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  parents: { name: string; resourceType: string; uniqueId: string }[];
}

export interface SemanticModelDef {
  name: string;
  uniqueId: string;
  description: string;
  parents: { name: string; uniqueId: string; resourceType: string }[];
  measures: { name: string; agg: string; expr: string; description: string | null }[];
  dimensions: { name: string; type: string; description: string | null }[];
  entities: { name: string; type: string; description: string | null; expr?: string }[];
}

export interface ModelNode {
  uniqueId: string;
  name: string;
  description: string;
  materializedType: string;
  database: string;
  schema: string;
  alias: string;
  tags: string[];
  meta: Record<string, unknown>;
  rawCode: string;
  compiledCode: string;
  executionInfo: {
    executeCompletedAt: string | null;
    lastRunStatus: string | null;
    executionTime: number | null;
    lastRunId: string | null;
  };
  ancestors: AncestorNode[];
  parents: { uniqueId: string; name: string; resourceType: string }[];
  catalog?: { columns: { name: string; type: string; description: string | null }[] };
}

export interface SourceNode {
  uniqueId: string;
  sourceName: string;
  name: string;
  description: string;
  database: string;
  schema: string;
  identifier: string;
  loader: string;
  freshness: {
    maxLoadedAt: string | null;
    freshnessStatus: string | null;
    maxLoadedAtTimeAgoInS: number | null;
  };
}

export interface ExposureNode {
  uniqueId: string;
  name: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
  url: string;
  exposureType: string;
  label: string;
  maturity: string;
  parents: { name: string; resourceType: string; uniqueId: string }[];
}

export type AncestorNode =
  | {
      uniqueId: string;
      name: string;
      resourceType: "ModelAppliedStateNestedNode";
      materializedType: string;
      executionInfo?: {
        executeCompletedAt: string | null;
        lastRunStatus: string | null;
        executionTime: number | null;
      };
    }
  | {
      uniqueId: string;
      sourceName: string;
      name: string;
      resourceType: "SourceAppliedStateNestedNode";
      freshness: {
        maxLoadedAt: string | null;
        freshnessStatus: string | null;
      };
    };

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

export interface ColumnLineageData {
  traces: {
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
    columns: {
      modelColumn: string;
      modelColumnType: string | null;
      sourceColumn: string | null;
      sourceName: string | null;
      sourceDatabase: string | null;
      sourceSchema: string | null;
    }[];
  }[];
  dimensions: {
    name: string;
    type: string;
    description: string | null;
    expr: string | null;
    semanticModelName: string;
  }[];
  entities: {
    name: string;
    type: string;
    description: string | null;
    expr: string | null;
    semanticModelName: string;
  }[];
  exposures: {
    name: string;
    label: string | null;
    url: string | null;
    exposureType: string | null;
    ownerName: string | null;
    parentMetricNames: string[];
  }[];
}

export interface LineageData {
  nodes: LineageNode[];
  edges: LineageEdge[];
  metric: MetricDefinition;
  columnLineage: ColumnLineageData;
}

// ─── Full Lineage Builder ────────────────────────────────────────────────────

export async function buildMetricLineage(metricName: string): Promise<LineageData> {
  // Fetch all reference data in parallel
  const [allMetrics, allSemanticModels, allExposures, slMetricsData] = await Promise.all([
    fetchAllMetrics(),
    fetchSemanticModels(),
    fetchAllExposures().catch(() => [] as ExposureNode[]),
    fetchSemanticLayerMetrics().catch(() => ({ items: [] })),
  ]);

  const slMetricsMap = new Map<string, { typeParams: { measure?: { name: string }; metrics?: { name: string }[]; inputMeasures?: { name: string }[]; expr?: string } }>();
  for (const slm of slMetricsData.items) {
    slMetricsMap.set(slm.name, slm);
  }

  const metricsMap = new Map<string, MetricDefinition>();
  for (const m of allMetrics) metricsMap.set(m.name, m);

  const smMap = new Map<string, SemanticModelDef>();
  for (const sm of allSemanticModels) smMap.set(sm.uniqueId, sm);

  const metric = metricsMap.get(metricName);
  if (!metric) throw new Error(`Metric "${metricName}" not found`);

  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];
  const visitedIds = new Set<string>();
  const underlyingModelIds: string[] = [];
  const modelCatalogMap = new Map<string, ModelCatalogEntry>();

  // ── Step 1: Resolve metrics (recursively for derived metrics) ──
  function addMetricNode(m: MetricDefinition) {
    const mId = `metric.${m.name}`;
    if (visitedIds.has(mId)) return;
    visitedIds.add(mId);

    nodes.push({
      id: mId,
      name: m.name,
      type: "metric",
      description: m.description,
      meta: m.meta,
    });

    for (const p of m.parents) {
      if (p.uniqueId.startsWith("metric.")) {
        // Use the normalized metric.{name} format to match the node ID
        const parentMetricId = `metric.${p.name}`;
        edges.push({ source: parentMetricId, target: mId });

        const parentMetric = metricsMap.get(p.name);
        if (parentMetric) addMetricNode(parentMetric);
        else if (!visitedIds.has(parentMetricId)) {
          visitedIds.add(parentMetricId);
          nodes.push({ id: parentMetricId, name: p.name, type: "metric" });
        }
      } else if (p.uniqueId.startsWith("semantic_model.")) {
        edges.push({ source: p.uniqueId, target: mId });
        const sm = smMap.get(p.uniqueId);
        if (sm && !visitedIds.has(sm.uniqueId)) {
          visitedIds.add(sm.uniqueId);
          nodes.push({
            id: sm.uniqueId,
            name: sm.name,
            type: "semantic_model",
            description: sm.description,
          });
          // Link the semantic model's underlying dbt model
          for (const smParent of sm.parents) {
            edges.push({ source: smParent.uniqueId, target: sm.uniqueId });
            if (smParent.uniqueId.startsWith("model.")) {
              underlyingModelIds.push(smParent.uniqueId);
            }
          }
        } else if (!visitedIds.has(p.uniqueId)) {
          visitedIds.add(p.uniqueId);
          nodes.push({ id: p.uniqueId, name: p.name, type: "semantic_model" });
        }
      } else if (p.uniqueId.startsWith("model.")) {
        edges.push({ source: p.uniqueId, target: mId });
        underlyingModelIds.push(p.uniqueId);
      } else {
        edges.push({ source: p.uniqueId, target: mId });
      }
    }
  }

  addMetricNode(metric);

  // ── Step 2: Fetch model lineage for all underlying models ──
  const uniqueModelIds = [...new Set(underlyingModelIds)];
  if (uniqueModelIds.length > 0) {
    const models = await fetchModelLineage(uniqueModelIds);
    const sourceIds: string[] = [];

    for (const model of models) {
      if (visitedIds.has(model.uniqueId)) continue;
      visitedIds.add(model.uniqueId);

      nodes.push({
        id: model.uniqueId,
        name: model.name,
        type: "model",
        description: model.description,
        materializedType: model.materializedType,
        database: model.database,
        schema: model.schema,
        alias: model.alias,
        executionInfo: model.executionInfo,
        rawCode: model.rawCode,
      });

      // Collect source ancestors from both ancestors and parents arrays
      const sourceAncs: { uniqueId: string; name: string; sourceName?: string }[] = [];
      for (const a of model.ancestors || []) {
        if (a.resourceType === "SourceAppliedStateNestedNode") {
          sourceAncs.push({ uniqueId: a.uniqueId, name: a.name, sourceName: a.sourceName });
        }
      }
      // Also check parents for source refs (ancestors may not include all)
      if (sourceAncs.length === 0) {
        for (const p of model.parents || []) {
          if (p.uniqueId.startsWith("source.")) {
            sourceAncs.push({ uniqueId: p.uniqueId, name: p.name });
          }
        }
      }

      modelCatalogMap.set(model.uniqueId, {
        name: model.name,
        database: model.database,
        schema: model.schema,
        alias: model.alias,
        rawCode: model.rawCode,
        columns: model.catalog?.columns ?? [],
        sourceAncestors: sourceAncs,
      });

      if (model.ancestors) {
        for (const ancestor of model.ancestors) {
          if (!visitedIds.has(ancestor.uniqueId)) {
            visitedIds.add(ancestor.uniqueId);

            const isSource = ancestor.resourceType === "SourceAppliedStateNestedNode" || ancestor.uniqueId.startsWith("source.");
            if (isSource) {
              sourceIds.push(ancestor.uniqueId);
              const srcAncestor = ancestor as Extract<AncestorNode, { resourceType: "SourceAppliedStateNestedNode" }>;
              nodes.push({
                id: ancestor.uniqueId,
                name: ancestor.name,
                type: "source",
                sourceName: srcAncestor.sourceName,
                freshness: srcAncestor.freshness,
              });
            } else {
              nodes.push({
                id: ancestor.uniqueId,
                name: ancestor.name,
                type: "model",
                materializedType: (ancestor as { materializedType?: string }).materializedType,
                executionInfo: (ancestor as { executionInfo?: { executeCompletedAt: string | null; lastRunStatus: string | null; executionTime: number | null } }).executionInfo,
              });
            }
          }
          addEdge(ancestor.uniqueId, model.uniqueId);
        }
      }

      // Also add source nodes from parents if not already added via ancestors
      if (model.parents) {
        for (const parent of model.parents) {
          if (parent.uniqueId.startsWith("source.") && !visitedIds.has(parent.uniqueId)) {
            visitedIds.add(parent.uniqueId);
            sourceIds.push(parent.uniqueId);
            nodes.push({
              id: parent.uniqueId,
              name: parent.name,
              type: "source",
            });
          }
          addEdge(parent.uniqueId, model.uniqueId);
        }
      }
    }

    // Enrich source nodes
    if (sourceIds.length > 0) {
      try {
        const sources = await fetchSourceDetails(sourceIds);
        for (const src of sources) {
          const existing = nodes.find((n) => n.id === src.uniqueId);
          if (existing) {
            existing.description = src.description;
            existing.database = src.database;
            existing.schema = src.schema;
            existing.identifier = src.identifier;
            existing.freshness = src.freshness;
          }
        }
      } catch {
        // supplementary
      }
    }
  }

  // ── Step 3: Attach downstream exposures ──
  const allNodeIds = new Set(nodes.map((n) => n.id));
  const rootMetricId = `metric.${metric.name}`;

  // Build set of metrics that are upstream of other metrics (i.e., feed into a derived metric)
  const upstreamMetricIds = new Set<string>();
  for (const e of edges) {
    if (e.source.startsWith("metric.") && e.target.startsWith("metric.")) {
      upstreamMetricIds.add(e.source);
    }
  }

  for (const exposure of allExposures) {
    const matchingParents = exposure.parents.filter(
      (p: { uniqueId: string }) => allNodeIds.has(p.uniqueId)
    );

    if (matchingParents.length > 0 && !visitedIds.has(exposure.uniqueId)) {
      visitedIds.add(exposure.uniqueId);
      nodes.push({
        id: exposure.uniqueId,
        name: exposure.label || exposure.name,
        type: "exposure",
        description: exposure.description,
        url: exposure.url,
        ownerName: exposure.ownerName,
        exposureType: exposure.exposureType,
        label: exposure.label,
      });

      // Only connect to the most downstream metrics — skip metrics that
      // feed into another metric already in the graph (e.g., child metrics
      // of a derived metric).
      const metricParents = matchingParents
        .filter((p: { uniqueId: string }) => p.uniqueId.startsWith("metric."))
        .filter((p: { uniqueId: string }) => !upstreamMetricIds.has(p.uniqueId));

      if (metricParents.length > 0) {
        for (const mp of metricParents) {
          edges.push({ source: mp.uniqueId, target: exposure.uniqueId });
        }
      } else {
        edges.push({ source: rootMetricId, target: exposure.uniqueId });
      }
    }
  }

  function addEdge(source: string, target: string) {
    const exists = edges.some((e) => e.source === source && e.target === target);
    if (!exists) edges.push({ source, target });
  }

  // Collect enriched source data for column lineage
  const sourceDetailsMap = new Map<string, { database?: string; schema?: string; identifier?: string }>();
  for (const n of nodes) {
    if (n.type === "source" && n.database && n.schema) {
      sourceDetailsMap.set(n.id, { database: n.database, schema: n.schema, identifier: n.identifier });
    }
  }

  // ── Step 4: Build column/field lineage ──
  // Collect exposure data for column lineage
  const lineageExposures = nodes
    .filter((n) => n.type === "exposure")
    .map((exp) => {
      const parentMetricNames = edges
        .filter((e) => e.target === exp.id && e.source.startsWith("metric."))
        .map((e) => e.source.replace("metric.", ""));
      return {
        name: exp.name,
        label: exp.label,
        url: exp.url,
        exposureType: exp.exposureType,
        ownerName: exp.ownerName,
        parentMetricNames,
      };
    });

  const columnLineage = buildColumnLineage(metric, metricsMap, smMap, slMetricsMap, modelCatalogMap, sourceDetailsMap, lineageExposures);

  return { nodes, edges, metric, columnLineage };
}

// ─── SQL Column Rename Parser ────────────────────────────────────────────────

function parseColumnRenames(sql: string): Map<string, string> {
  const renames = new Map<string, string>();
  if (!sql) return renames;

  // Find the innermost SELECT ... FROM block (the final transformation)
  const selectBlocks = sql.matchAll(/select\s+([\s\S]*?)\s+from\s+/gi);
  let lastSelect = "";
  for (const match of selectBlocks) {
    if (match[1] && !match[1].trim().startsWith("*")) {
      lastSelect = match[1];
    }
  }

  if (!lastSelect) return renames;

  // Split by commas, handling potential nested functions
  const items = lastSelect.split(",").map((s) => s.trim()).filter(Boolean);

  for (const item of items) {
    // Pattern: expr AS alias
    const asMatch = item.match(/^(\S+)\s+as\s+(\w+)\s*$/i);
    if (asMatch) {
      renames.set(asMatch[2].toLowerCase(), asMatch[1].toLowerCase());
      continue;
    }

    // Pattern: expr alias (no AS keyword, both simple identifiers)
    const spaceMatch = item.match(/^(\w+)\s+(\w+)\s*$/);
    if (spaceMatch) {
      const [, left, right] = spaceMatch;
      const reserved = new Set(["from", "where", "group", "order", "having", "limit", "join", "on", "and", "or", "not", "null", "true", "false"]);
      if (!reserved.has(right.toLowerCase())) {
        renames.set(right.toLowerCase(), left.toLowerCase());
        continue;
      }
    }

    // Pattern: just a column name (no rename)
    const simpleMatch = item.match(/^(\w+)\s*$/);
    if (simpleMatch) {
      renames.set(simpleMatch[1].toLowerCase(), simpleMatch[1].toLowerCase());
    }
  }

  return renames;
}

function extractReferencedColumns(expr: string, availableColumns: string[]): string[] {
  const exprLower = expr.toLowerCase();
  return availableColumns.filter((col) => {
    const colLower = col.toLowerCase();
    const regex = new RegExp(`\\b${colLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    return regex.test(exprLower);
  });
}

// ─── Column Lineage Builder ──────────────────────────────────────────────────

interface ModelCatalogEntry {
  name: string;
  database?: string;
  schema?: string;
  alias?: string;
  rawCode?: string;
  columns: { name: string; type: string; description: string | null }[];
  sourceAncestors: { uniqueId: string; name: string; sourceName?: string }[];
}

function buildColumnLineage(
  metric: MetricDefinition,
  metricsMap: Map<string, MetricDefinition>,
  smMap: Map<string, SemanticModelDef>,
  slMetricsMap: Map<string, { typeParams: { measure?: { name: string }; metrics?: { name: string }[]; inputMeasures?: { name: string }[]; expr?: string } }>,
  modelCatalogMap: Map<string, ModelCatalogEntry>,
  sourceDetailsMap: Map<string, { database?: string; schema?: string; identifier?: string }>,
  lineageExposures: { name: string; label?: string; url?: string; exposureType?: string; ownerName?: string; parentMetricNames: string[] }[]
): ColumnLineageData {
  const traces: ColumnLineageData["traces"] = [];
  const dimensions: ColumnLineageData["dimensions"] = [];
  const entities: ColumnLineageData["entities"] = [];
  const visitedMetrics = new Set<string>();
  const visitedSMs = new Set<string>();

  // Resolve which specific measure a metric uses, then build a trace for it
  function resolveMetric(m: MetricDefinition) {
    if (visitedMetrics.has(m.name)) return;
    visitedMetrics.add(m.name);

    const slMetric = slMetricsMap.get(m.name);

    // For derived metrics: recursively resolve child metrics
    if (m.type?.toLowerCase() === "derived") {
      for (const p of m.parents) {
        if (p.uniqueId.startsWith("metric.")) {
          const childMetric = metricsMap.get(p.name);
          if (childMetric) resolveMetric(childMetric);
        }
      }
      return;
    }

    // For simple/cumulative metrics: find the specific measure from typeParams
    const usedMeasureName = slMetric?.typeParams?.measure?.name ?? null;

    for (const p of m.parents) {
      if (!p.uniqueId.startsWith("semantic_model.")) continue;
      const sm = smMap.get(p.uniqueId);
      if (!sm) continue;

      // Collect dimensions/entities from this semantic model (once)
      if (!visitedSMs.has(sm.uniqueId)) {
        visitedSMs.add(sm.uniqueId);
        for (const dim of sm.dimensions) {
          dimensions.push({
            name: dim.name,
            type: dim.type,
            description: dim.description,
            expr: null,
            semanticModelName: sm.name,
          });
        }
        for (const ent of sm.entities) {
          entities.push({
            name: ent.name,
            type: ent.type,
            description: ent.description,
            expr: ent.expr || null,
            semanticModelName: sm.name,
          });
        }
      }

      // Find the specific measure this metric uses
      const measuresToInclude = usedMeasureName
        ? sm.measures.filter((ms) => ms.name === usedMeasureName)
        : sm.measures; // fallback: all measures if we can't determine

      const underlyingModel = sm.parents.find((pp) => pp.uniqueId.startsWith("model."));
      if (!underlyingModel) continue;

      const catalogEntry = modelCatalogMap.get(underlyingModel.uniqueId);
      const columnRenames = parseColumnRenames(catalogEntry?.rawCode ?? "");
      const catalogColumns = catalogEntry?.columns ?? [];

      // Get source info
      const sourceAnc = catalogEntry?.sourceAncestors?.[0];
      const srcDetails = sourceAnc ? sourceDetailsMap.get(sourceAnc.uniqueId) : undefined;

      const modelColumnNames = catalogColumns.map((c) => c.name);

      for (const meas of measuresToInclude) {
        const referencedModelCols = extractReferencedColumns(meas.expr, modelColumnNames);

        const traceColumns: ColumnLineageData["traces"][0]["columns"] = [];
        const addedCols = new Set<string>();

        function addTraceColumn(modelCol: string) {
          const key = modelCol.toLowerCase();
          if (addedCols.has(key)) return;
          addedCols.add(key);
          const catCol = catalogColumns.find((c) => c.name.toLowerCase() === key);
          const sourceCol = columnRenames.get(key) ?? null;

          traceColumns.push({
            modelColumn: catCol?.name ?? modelCol,
            modelColumnType: catCol?.type ?? null,
            sourceColumn: sourceCol,
            sourceName: sourceAnc?.name ?? null,
            sourceDatabase: srcDetails?.database ?? null,
            sourceSchema: srcDetails?.schema ?? null,
          });
        }

        if (referencedModelCols.length > 0) {
          for (const modelCol of referencedModelCols) addTraceColumn(modelCol);
        } else {
          const allModelColsLower = modelColumnNames.map((c) => c.toLowerCase());
          const exprLower = meas.expr.toLowerCase();
          const foundCols = allModelColsLower.filter((c) => exprLower.includes(c));
          for (const colLower of foundCols) {
            const catCol = catalogColumns.find((c) => c.name.toLowerCase() === colLower);
            addTraceColumn(catCol?.name ?? colLower);
          }
        }

        // Also include columns referenced by dimensions from this semantic model
        for (const dim of sm.dimensions) {
          const dimExpr = (dim.expr ?? dim.name).toLowerCase();
          const matchingCol = catalogColumns.find((c) => c.name.toLowerCase() === dimExpr);
          if (matchingCol) addTraceColumn(matchingCol.name);
        }

        traces.push({
          metricName: m.name,
          measureName: meas.name,
          measureAgg: meas.agg,
          measureExpr: meas.expr,
          measureDescription: meas.description,
          semanticModelName: sm.name,
          modelName: underlyingModel.name,
          modelId: underlyingModel.uniqueId,
          modelDatabase: catalogEntry?.database ?? null,
          modelSchema: catalogEntry?.schema ?? null,
          columns: traceColumns,
        });
      }
    }
  }

  resolveMetric(metric);

  // Include exposures that reference any metric in our lineage
  const allResolvedMetrics = new Set(visitedMetrics);
  const exposures: ColumnLineageData["exposures"] = lineageExposures
    .filter((exp) => exp.parentMetricNames.some((mn) => allResolvedMetrics.has(mn)))
    .map((exp) => ({
      name: exp.name,
      label: exp.label ?? null,
      url: exp.url ?? null,
      exposureType: exp.exposureType ?? null,
      ownerName: exp.ownerName ?? null,
      parentMetricNames: exp.parentMetricNames.filter((mn) => allResolvedMetrics.has(mn)),
    }));

  return { traces, dimensions, entities, exposures };
}
