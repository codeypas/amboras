import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StoreAnalyticsDashboard } from "../components/store-analytics-dashboard";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("amboras_access_token")?.value;

  if (!token) {
    redirect("/");
  }

  const storeName = cookieStore.get("amboras_store_name")?.value ?? "Demo Store";

  return <StoreAnalyticsDashboard storeName={storeName} />;
}
