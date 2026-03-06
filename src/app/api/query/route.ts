import { NextRequest, NextResponse } from "next/server";
import { executeSemanticLayerQuery } from "@/lib/dbt-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, groupBy, limit } = body as {
      metrics: string[];
      groupBy: { name: string; grain?: string }[];
      limit?: number;
    };

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ error: "At least one metric is required" }, { status: 400 });
    }

    const result = await executeSemanticLayerQuery(metrics, groupBy ?? [], limit ?? 5);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Query execution error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Query execution failed" },
      { status: 500 }
    );
  }
}
