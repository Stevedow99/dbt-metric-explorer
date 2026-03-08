"use client";

import Link from "next/link";
import { DbtMark, DbtWordmark } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";

const API_CALLS = [
  {
    id: "discovery-metrics",
    title: "Fetch All Metrics",
    api: "Discovery API",
    endpoint: "https://metadata.cloud.getdbt.com/graphql",
    method: "POST",
    description:
      "Retrieves every metric defined in the dbt project, including its type, description, formula, filters, tags, and parent references (semantic models).",
    usedFor: "Populating the sidebar metric list and determining which semantic models each metric depends on.",
    query: `query ($environmentId: BigInt!, $first: Int!) {
  environment(id: $environmentId) {
    definition {
      metrics(first: $first) {
        edges {
          node {
            name, description, type, formula
            filter, tags, meta
            parents { name, resourceType, uniqueId }
          }
        }
      }
    }
  }
}`,
  },
  {
    id: "discovery-semantic-models",
    title: "Fetch Semantic Models",
    api: "Discovery API",
    endpoint: "https://metadata.cloud.getdbt.com/graphql",
    method: "POST",
    description:
      "Pulls every semantic model with its measures (name, aggregation, expression), dimensions, entities, and parent model references.",
    usedFor:
      "Mapping metrics → semantic models → underlying dbt models. Measures and dimensions power the column-level lineage graph.",
    query: `query ($environmentId: BigInt!, $first: Int!) {
  environment(id: $environmentId) {
    definition {
      semanticModels(first: $first) {
        edges {
          node {
            name, uniqueId, description
            parents { name, uniqueId, resourceType }
            measures { name, agg, expr, description }
            dimensions { name, type, description }
            entities { name, type, description }
          }
        }
      }
    }
  }
}`,
  },
  {
    id: "discovery-models",
    title: "Fetch Model Details & Lineage",
    api: "Discovery API",
    endpoint: "https://metadata.cloud.getdbt.com/graphql",
    method: "POST",
    description:
      "For each model referenced by a semantic model, fetches detailed metadata: database, schema, raw SQL code, catalog columns, execution info, and ancestor/parent references.",
    usedFor:
      "Building the object lineage graph (model → source), extracting raw SQL for column rename parsing, and enriching nodes with database/schema info.",
    query: `query ($environmentId: BigInt!, $first: Int!, $uniqueIds: [String!]) {
  environment(id: $environmentId) {
    applied {
      models(first: $first, filter: { uniqueIds: $uniqueIds }) {
        edges {
          node {
            uniqueId, name, database, schema, alias
            materializedType, rawCode, compiledCode
            executionInfo { lastRunStatus, executionTime }
            ancestors(types: [Model, Source]) { ... }
            parents { uniqueId, name, resourceType }
            catalog { columns { name, type, description } }
          }
        }
      }
    }
  }
}`,
  },
  {
    id: "discovery-sources",
    title: "Fetch Source Details",
    api: "Discovery API",
    endpoint: "https://metadata.cloud.getdbt.com/graphql",
    method: "POST",
    description:
      "Retrieves source table metadata including database, schema, identifier, loader, and freshness status for every source referenced in the lineage.",
    usedFor:
      "Enriching source nodes in the graph with their full database.schema.table path and freshness indicators.",
    query: `query ($environmentId: BigInt!, $first: Int!, $uniqueIds: [String!]) {
  environment(id: $environmentId) {
    applied {
      sources(first: $first, filter: { uniqueIds: $uniqueIds }) {
        edges {
          node {
            uniqueId, sourceName, name, database
            schema, identifier, loader
            freshness { maxLoadedAt, freshnessStatus }
          }
        }
      }
    }
  }
}`,
  },
  {
    id: "discovery-exposures",
    title: "Fetch Exposures",
    api: "Discovery API",
    endpoint: "https://metadata.cloud.getdbt.com/graphql",
    method: "POST",
    description:
      "Retrieves all exposures (dashboards, reports, etc.) and their parent metric references, along with owner info and URLs.",
    usedFor:
      "Adding downstream dashboard/report nodes to both object and column lineage graphs. Sigma dashboards get a special logo.",
    query: `query ($environmentId: BigInt!, $first: Int!) {
  environment(id: $environmentId) {
    applied {
      exposures(first: $first) {
        edges {
          node {
            uniqueId, name, description, label
            ownerName, url, exposureType, maturity
            parents { name, resourceType, uniqueId }
          }
        }
      }
    }
  }
}`,
  },
  {
    id: "sl-metrics",
    title: "Fetch Semantic Layer Metrics",
    api: "Semantic Layer API",
    endpoint: "https://semantic-layer.cloud.getdbt.com/api/graphql",
    method: "POST",
    description:
      "Queries the Semantic Layer for metric definitions including typeParams (which specific measure a metric uses), input measures for derived metrics, queryable granularities, and dimension details.",
    usedFor:
      "Determining which specific measure each metric uses (critical for accurate column lineage), and providing queryable dimensions and granularities.",
    query: `query ($environmentId: BigInt!) {
  metricsPaginated(
    environmentId: $environmentId
    pageNum: 1, pageSize: 500
  ) {
    items {
      name, description, type
      typeParams {
        measure { name, filter { whereSqlTemplate } }
        inputMeasures { name }
        metrics { name }
        expr
      }
      filter { whereSqlTemplate }
      dimensions { name, description, type, queryableGranularities }
      queryableGranularities
    }
  }
}`,
  },
  {
    id: "sl-dimensions",
    title: "Fetch Metric Dimensions",
    api: "Semantic Layer API",
    endpoint: "https://semantic-layer.cloud.getdbt.com/api/graphql",
    method: "POST",
    description:
      "For a specific metric, fetches its available dimensions (group-by fields) with types and queryable granularities.",
    usedFor: "Populating the Dimensions panel in the detail sidebar for the selected metric.",
    query: `query ($environmentId: BigInt!, $metrics: [MetricInput!]!) {
  dimensionsPaginated(
    environmentId: $environmentId
    metrics: $metrics
    pageNum: 1, pageSize: 500
  ) {
    items {
      name, description, type
      queryableGranularities
    }
  }
}`,
  },
];

const ENV_VARS = [
  {
    name: "DBT_SERVICE_TOKEN",
    description: "A dbt Platform service token with metadata access permissions.",
    howToGet: "dbt Platform → Account Settings → Service Tokens → Create. Grant \"Metadata Only\" or \"Member\" permissions.",
  },
  {
    name: "DBT_ACCOUNT_ID",
    description: "Your dbt Platform account identifier.",
    howToGet: "Visible in the dbt Platform URL: https://cloud.getdbt.com/deploy/{ACCOUNT_ID}/...",
  },
  {
    name: "DBT_PROJECT_ID",
    description: "The numeric ID of your dbt project.",
    howToGet: "dbt Platform → your project → visible in the URL path.",
  },
  {
    name: "DBT_ENVIRONMENT_ID",
    description: "The production environment ID used for API queries.",
    howToGet: "dbt Platform → Environments → select your production environment → ID is in the URL.",
  },
  {
    name: "DBT_DISCOVERY_API_URL",
    description: "The GraphQL endpoint for the dbt Discovery (metadata) API.",
    howToGet: "Typically https://metadata.cloud.getdbt.com/graphql for multi-tenant dbt Platform.",
  },
  {
    name: "DBT_SEMANTIC_LAYER_API_URL",
    description: "The GraphQL endpoint for the dbt Semantic Layer API.",
    howToGet: "Typically https://semantic-layer.cloud.getdbt.com/api/graphql for multi-tenant dbt Platform.",
  },
];

function ApiCallCard({ call }: { call: (typeof API_CALLS)[number] }) {
  return (
    <div id={call.id} className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{call.title}</h3>
          <p className="text-xs text-muted mt-1">{call.description}</p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${
            call.api === "Discovery API"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-indigo-500/10 text-indigo-600"
          }`}
        >
          {call.api}
        </span>
      </div>
      <div className="px-5 py-3 border-b border-border bg-surface-hover/40">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-bold text-dbt-orange bg-dbt-orange/10 px-1.5 py-0.5 rounded">{call.method}</span>
          <code className="text-muted font-mono truncate">{call.endpoint}</code>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <p className="text-[11px] text-muted">
          <span className="font-semibold text-foreground">Used for: </span>
          {call.usedFor}
        </p>
      </div>
      <details className="group">
        <summary className="px-5 py-2.5 text-[11px] font-medium text-muted cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1.5">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View GraphQL Query
        </summary>
        <div className="px-5 pb-4">
          <pre className="text-[11px] font-mono bg-surface-hover border border-border rounded-lg p-4 overflow-x-auto text-foreground leading-relaxed">
            {call.query}
          </pre>
        </div>
      </details>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DbtMark size={24} className="rounded-lg" />
            <h1 className="text-sm font-semibold text-foreground">dbt Platform Asset Explorer</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/"
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-dbt-orange/10 text-dbt-orange hover:bg-dbt-orange/20 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground mb-2">How It Works</h1>
          <p className="text-sm text-muted leading-relaxed max-w-2xl">
            This application connects to <strong>two dbt Platform APIs</strong> to build a complete picture of your
            dbt project assets &mdash; from upstream source tables, through models and semantic models, to
            metrics and the dashboards that consume them. It supports both Semantic Layer metric exploration
            and general dbt asset lineage.
          </p>
        </div>

        {/* Architecture overview */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Architecture Overview</h2>
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">Discovery API</h3>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Provides project metadata: metrics, semantic models, models, sources, and exposures. Used to build
                  the full lineage graph and retrieve catalog-level column information.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">Semantic Layer API</h3>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Provides runtime metric definitions including <code className="text-dbt-orange text-[10px]">typeParams</code> (which
                  measure a metric resolves to), queryable dimensions, and granularities.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-dbt-orange/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-dbt-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">Next.js API Routes</h3>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Server-side routes proxy all API calls, keeping your service token secure. The frontend never
                  contacts dbt Platform directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data flow */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Data Flow</h2>
          <div className="rounded-xl border border-border bg-surface p-6">
            <ol className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Load metric list",
                  desc: "On page load, the app calls the Discovery API and Semantic Layer API in parallel to fetch all metrics. Results are merged and displayed in the sidebar.",
                },
                {
                  step: "2",
                  title: "Build object lineage",
                  desc: "When a metric is selected, the app fetches semantic models, resolves their parent dbt models, then fetches model details (ancestors, catalog columns, raw SQL) and source details. Exposures are fetched to find downstream dashboards. All of this is assembled into a directed graph.",
                },
                {
                  step: "3",
                  title: "Build column lineage",
                  desc: "Using the Semantic Layer's typeParams, the app identifies which specific measure a metric uses, then traces through the model's raw SQL to find column renames (e.g. source_col AS model_col), and maps each measure expression back to catalog columns and their upstream source tables.",
                },
                {
                  step: "4",
                  title: "Render interactive graphs",
                  desc: "The frontend uses React Flow to render both the object-level and column-level lineage as interactive, draggable graphs. Exposures and dashboards appear downstream of the metric node.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-dbt-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-dbt-orange">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Required configuration */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Required Configuration</h2>
          <p className="text-xs text-muted mb-4">
            These environment variables must be set in <code className="text-dbt-orange text-[10px] bg-dbt-orange/8 px-1.5 py-0.5 rounded">.env.local</code> at
            the project root. The service token is used server-side only and is never exposed to the browser.
          </p>
          <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
            {ENV_VARS.map((v) => (
              <div key={v.name} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <code className="text-xs font-mono font-semibold text-foreground">{v.name}</code>
                    <p className="text-[11px] text-muted mt-1">{v.description}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted mt-2 flex items-start gap-1.5">
                  <svg className="w-3 h-3 text-dbt-orange flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{v.howToGet}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* .env.local example */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Example <code className="text-dbt-orange">.env.local</code></h2>
          <pre className="text-[11px] font-mono bg-surface-hover border border-border rounded-xl p-5 overflow-x-auto text-foreground leading-relaxed">
{`DBT_SERVICE_TOKEN=dbtc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DBT_ACCOUNT_ID=12345
DBT_PROJECT_ID=67890
DBT_ENVIRONMENT_ID=11111
DBT_DISCOVERY_API_URL=https://metadata.cloud.getdbt.com/graphql
DBT_SEMANTIC_LAYER_API_URL=https://semantic-layer.cloud.getdbt.com/api/graphql`}
          </pre>
        </section>

        {/* API Calls */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-2">API Calls</h2>
          <p className="text-xs text-muted mb-6">
            All requests are <strong>GraphQL POST</strong> requests authenticated with a <code className="text-dbt-orange text-[10px]">Bearer</code> token
            in the <code className="text-dbt-orange text-[10px]">Authorization</code> header. Click each card to view the exact query.
          </p>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600">Discovery API</span>
            <span className="text-[11px] text-muted">5 calls &mdash; project metadata, lineage, and catalog</span>
          </div>
          <div className="space-y-4 mb-8">
            {API_CALLS.filter((c) => c.api === "Discovery API").map((call) => (
              <ApiCallCard key={call.id} call={call} />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600">Semantic Layer API</span>
            <span className="text-[11px] text-muted">2 calls &mdash; metric runtime definitions and dimensions</span>
          </div>
          <div className="space-y-4">
            {API_CALLS.filter((c) => c.api === "Semantic Layer API").map((call) => (
              <ApiCallCard key={call.id} call={call} />
            ))}
          </div>
        </section>

        {/* Internal API routes */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Internal API Routes</h2>
          <p className="text-xs text-muted mb-4">
            The Next.js server exposes two routes that the frontend consumes. These proxy and aggregate data from the
            dbt Platform APIs above.
          </p>
          <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">GET</span>
                <code className="text-xs font-mono text-foreground">/api/metrics</code>
              </div>
              <p className="text-[11px] text-muted">
                Returns all metrics, merged from Discovery API and Semantic Layer API. Used to populate the Semantic Layer Explorer sidebar.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">GET</span>
                <code className="text-xs font-mono text-foreground">/api/metrics/[name]/lineage</code>
              </div>
              <p className="text-[11px] text-muted">
                Builds the full lineage for a metric &mdash; nodes, edges, metric details, queryable dimensions, and
                column-level lineage traces. Orchestrates 5&ndash;7 dbt API calls in parallel.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded">GET</span>
                <code className="text-xs font-mono text-foreground">/api/assets</code>
              </div>
              <p className="text-[11px] text-muted">
                Returns all models, sources, and exposures from the Discovery API. Used to populate the Asset Explorer sidebar.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded">GET</span>
                <code className="text-xs font-mono text-foreground">/api/assets/[id]/lineage</code>
              </div>
              <p className="text-[11px] text-muted">
                Builds the full upstream and downstream lineage for any dbt model or source &mdash; including
                ancestor models, child models, semantic models, metrics, exposures, and column-level lineage from catalog columns.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-10 text-center">
          <DbtWordmark width={48} height={20} className="mx-auto mb-2 opacity-40" />
          <p className="text-[10px] text-muted">dbt Platform Asset Explorer</p>
        </footer>
      </main>
    </div>
  );
}
