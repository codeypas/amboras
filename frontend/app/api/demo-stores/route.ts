import { NextResponse } from "next/server";
import { fetchBackend } from "../../lib/backend";
import type { DemoStore } from "../../lib/types";

export async function GET() {
  try {
    const stores = await fetchBackend<DemoStore[]>("/api/v1/auth/demo-stores");
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load demo stores"
      },
      { status: 500 }
    );
  }
}
