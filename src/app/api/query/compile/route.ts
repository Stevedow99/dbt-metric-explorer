import { NextRequest, NextResponse } from "next/server";
import { compileSemanticLayerQuery } from "@/lib/dbt-api";

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

    const sql = await compileSemanticLayerQuery(metrics, groupBy ?? [], limit ?? 10);
    return NextResponse.json({ sql });
  } catch (err) {
    console.error("Compile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compile query" },
      { status: 500 }
    );
  }
}
