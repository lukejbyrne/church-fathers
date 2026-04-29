"use client";

import { useState } from "react";

type Variant = "default" | "compact";

export default function SubscribeForm({
  variant = "default",
  heading,
  blurb,
}: {
  variant?: Variant;
  heading?: string;
  blurb?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setState("ok");
      setMessage("You're in. Check your inbox tomorrow morning.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Try again.");
    }
  }

  if (variant === "compact") {
    if (state === "ok") {
      return (
        <p
          className="max-w-xl mx-auto text-sm text-accent text-center"
          role="status"
        >
          {message}
        </p>
      );
    }
    return (
      <form
        onSubmit={onSubmit}
        className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 items-stretch"
        aria-label="Subscribe to Daily Patristic Wisdom"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-3 py-2 text-sm border border-ink/20 rounded bg-parchment focus:outline-none focus:border-accent"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-4 py-2 text-sm bg-ink text-parchment rounded hover:bg-accent transition-colors disabled:opacity-60"
        >
          {state === "loading" ? "Sending…" : "Subscribe"}
        </button>
        {message && state === "error" && (
          <p
            className="sm:basis-full text-xs mt-1 text-red-700"
            role="status"
          >
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <section className="max-w-xl mx-auto bg-ink/5 border border-ink/10 rounded-lg p-6">
      <h2 className="font-serif text-2xl text-ink mb-2">
        {heading ?? "Daily Patristic Wisdom — in your inbox."}
      </h2>
      {state === "ok" ? (
        <p className="text-accent text-sm" role="status">
          {message}
        </p>
      ) : (
        <>
          <p className="text-ink/70 text-sm mb-4">
            {blurb ??
              "A Father, council, schism, or quote each morning — sourced, annotated, and tied back to the chain. Free. Unsubscribe whenever."}
          </p>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 border border-ink/20 rounded bg-parchment focus:outline-none focus:border-accent"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors disabled:opacity-60"
            >
              {state === "loading" ? "Sending…" : "Subscribe"}
            </button>
          </form>
          {message && state === "error" && (
            <p className="mt-3 text-sm text-red-700" role="status">
              {message}
            </p>
          )}
        </>
      )}
    </section>
  );
}
