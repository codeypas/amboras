import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("amboras_access_token");
  cookieStore.delete("amboras_store_name");

  return NextResponse.json({ ok: true });
}
