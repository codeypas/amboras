import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./components/login-form";

export default async function HomePage() {
  const cookieStore = await cookies();

  if (cookieStore.get("amboras_access_token")) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
