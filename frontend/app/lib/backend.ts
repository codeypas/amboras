const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function fetchBackend<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
