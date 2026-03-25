import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend } from "../../../lib/backend";
import type { TopProduct } from "../../../lib/types";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("amboras_access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchBackend<TopProduct[]>("/api/v1/analytics/top-products", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load top products"
      },
      { status: 500 }
    );
  }
}
