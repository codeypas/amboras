import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend } from "../../lib/backend";
import type { DemoStore } from "../../lib/types";

type LoginResponse = {
  accessToken: string;
  store: DemoStore;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { storeId?: string };

    if (!body.storeId) {
      return NextResponse.json({ message: "storeId is required" }, { status: 400 });
    }

    const data = await fetchBackend<LoginResponse>("/api/v1/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({
        storeId: body.storeId
      })
    });

    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === "production";

    cookieStore.set("amboras_access_token", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 12
    });
    cookieStore.set("amboras_store_name", data.store.name, {
      httpOnly: false,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 12
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to create session"
      },
      { status: 500 }
    );
  }
}
