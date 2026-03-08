import { NextRequest, NextResponse } from "next/server";

const DISCOVERY_API_URL = process.env.DBT_DISCOVERY_API_URL!;
const SERVICE_TOKEN = process.env.DBT_SERVICE_TOKEN!;
const ACCOUNT_ID = process.env.DBT_ACCOUNT_ID!;
const PROJECT_ID = process.env.DBT_PROJECT_ID!;
const ENVIRONMENT_ID = process.env.DBT_ENVIRONMENT_ID!;

export async function GET(request: NextRequest) {
  const test = request.nextUrl.searchParams.get("test") === "true";

  const info = {
    accountId: ACCOUNT_ID,
    projectId: PROJECT_ID,
    environmentId: ENVIRONMENT_ID,
    configured: !!(SERVICE_TOKEN && ACCOUNT_ID && ENVIRONMENT_ID),
  };

  if (!test) {
    return NextResponse.json(info);
  }

  try {
    const query = `
      query ($environmentId: BigInt!) {
        environment(id: $environmentId) {
          applied {
            models(first: 1) {
              edges {
                node {
                  uniqueId
                  name
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch(DISCOVERY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables: { environmentId: parseInt(ENVIRONMENT_ID) },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        ...info,
        test: { success: false, error: `API returned ${res.status}: ${text.substring(0, 200)}` },
      });
    }

    const json = await res.json();
    if (json.errors) {
      return NextResponse.json({
        ...info,
        test: { success: false, error: json.errors[0]?.message ?? "GraphQL error" },
      });
    }

    const modelCount = json.data?.environment?.applied?.models?.edges?.length ?? 0;
    return NextResponse.json({
      ...info,
      test: { success: true, message: `Connection verified — found ${modelCount} model(s)` },
    });
  } catch (err) {
    return NextResponse.json({
      ...info,
      test: { success: false, error: err instanceof Error ? err.message : "Connection failed" },
    });
  }
}
