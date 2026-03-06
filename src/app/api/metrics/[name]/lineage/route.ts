import { NextRequest, NextResponse } from "next/server";
import { buildMetricLineage, fetchMetricDimensions } from "@/lib/dbt-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const [lineage, dimensions] = await Promise.allSettled([
      buildMetricLineage(name),
      fetchMetricDimensions(name),
    ]);

    if (lineage.status === "rejected") {
      return NextResponse.json(
        { error: lineage.reason?.message ?? "Failed to build lineage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...lineage.value,
      dimensions:
        dimensions.status === "fulfilled" ? dimensions.value.items : [],
    });
  } catch (err) {
    console.error("Error building lineage:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
