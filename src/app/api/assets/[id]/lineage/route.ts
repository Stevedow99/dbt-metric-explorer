import { NextRequest, NextResponse } from "next/server";
import { buildAssetLineage } from "@/lib/dbt-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const uniqueId = decodeURIComponent(id);

  try {
    const lineage = await buildAssetLineage(uniqueId);
    return NextResponse.json(lineage);
  } catch (err) {
    console.error("Error building asset lineage:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build lineage" },
      { status: 500 }
    );
  }
}
