"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoStore } from "../lib/types";

export function LoginForm() {
  const router = useRouter();
  const [stores, setStores] = useState<DemoStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitting">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStores() {
      try {
        const response = await fetch("/api/demo-stores", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Unable to load demo stores");
        }

        const data = (await response.json()) as DemoStore[];
        if (!isMounted) {
          return;
        }

        setStores(data);
        setSelectedStoreId(data[0]?.id ?? "");
        setStatus("idle");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load stores");
        setStatus("idle");
      }
    }

    void loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storeId: selectedStoreId
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
      setStatus("idle");
    }
  }

  return (
    <section className="hero-shell">
      <div className="hero-copy">
        <p className="eyebrow">Amboras Store Analytics</p>
        <h1>Transform raw store activity into clear, real-time insights you can act on.</h1>
        <p className="hero-text">
          Monitor performance, understand customer behavior, and make better decisions with fast, reliable analytics built for scale.
        </p>
        <div className="hero-highlights">
          <span>Revenue today, week, month</span>
          <span>Conversion rate and event mix</span>
          <span>Top products and live activity</span>
        </div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="section-kicker">Demo Login</p>
          <h2>Pick a seeded store</h2>
          <p className="muted">
            Sign in to view your store’s analytics dashboard. Each session is securely scoped to your store to ensure your data stays private.
          </p>
        </div>

        <div className="store-list">
          {stores.map((store) => (
            <label
              className={`store-option ${selectedStoreId === store.id ? "selected" : ""}`}
              key={store.id}
            >
              <input
                checked={selectedStoreId === store.id}
                name="store"
                onChange={() => setSelectedStoreId(store.id)}
                type="radio"
                value={store.id}
              />
              <span>{store.name}</span>
              <small>{store.slug}</small>
            </label>
          ))}

          {status === "loading" && <div className="loading-box">Loading demo stores…</div>}
          {!stores.length && status !== "loading" && !error && (
            <div className="loading-box">No demo stores available. Seed the database first.</div>
          )}
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <button className="primary-button" disabled={!selectedStoreId || status === "submitting"}>
          {status === "submitting" ? "Starting session…" : "Enter dashboard"}
        </button>
      </form>
    </section>
  );
}
