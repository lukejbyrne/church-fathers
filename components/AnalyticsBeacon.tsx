"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    // Off by default. This beacon POSTed to /api/analytics (a serverless
    // function) on every single pageview, which was a primary driver of the
    // Netlify function-quota overage. Re-enable by setting
    // NEXT_PUBLIC_ANALYTICS_ENABLED=true in the site env and redeploying.
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return;
    }

    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || undefined,
    });

    if (navigator.sendBeacon) {
      const body = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics", body)) return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
