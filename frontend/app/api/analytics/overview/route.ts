import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend } from "../../../lib/backend";
import type { OverviewResponse } from "../../../lib/types";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("amboras_access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const trendDays = url.searchParams.get("trendDays") ?? "14";

  try {
    const data = await fetchBackend<OverviewResponse>(`/api/v1/analytics/overview?trendDays=${trendDays}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load overview"
      },
      { status: 500 }
    );
  }
}
