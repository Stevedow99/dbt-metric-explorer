import { NextResponse } from "next/server";
import { fetchAllMetrics, fetchSemanticLayerMetrics, MetricDefinition } from "@/lib/dbt-api";

export async function GET() {
  try {
    const [discoveryMetrics, semanticLayerData] = await Promise.allSettled([
      fetchAllMetrics(),
      fetchSemanticLayerMetrics(),
    ]);

    const metrics =
      discoveryMetrics.status === "fulfilled" ? discoveryMetrics.value : [];

    const slMetrics =
      semanticLayerData.status === "fulfilled"
        ? semanticLayerData.value.items
        : [];

    const slMap = new Map<string, Record<string, unknown>>();
    for (const slm of slMetrics) {
      slMap.set(slm.name, slm);
    }

    const enriched = metrics.map((m: MetricDefinition) => ({
      ...m,
      semanticLayer: slMap.get(m.name) ?? null,
    }));

    return NextResponse.json({ metrics: enriched });
  } catch (err) {
    console.error("Error fetching metrics:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
