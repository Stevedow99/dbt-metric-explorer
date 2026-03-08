import { NextResponse } from "next/server";
import { fetchAllAssets } from "@/lib/dbt-api";

export async function GET() {
  try {
    const { models, sources, exposures } = await fetchAllAssets();
    return NextResponse.json({ models, sources, exposures });
  } catch (err) {
    console.error("Error fetching assets:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
