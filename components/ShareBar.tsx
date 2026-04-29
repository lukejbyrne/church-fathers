"use client";

import { useState } from "react";

type Props = {
  /** Path under the site root, e.g. "/fathers/augustine". Leading slash optional. */
  path: string;
  /** Title used by share targets that accept one (Twitter/X, Reddit, Facebook). */
  title: string;
  /** Compact inline style instead of full bar. */
  compact?: boolean;
};

const SITE = "https://patristic.io";

export default function ShareBar({ path, title, compact = false }: Props) {
  const [copied, setCopied] = useState(false);
  const url = SITE + (path.startsWith("/") ? path : "/" + path);
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  const targets: { label: string; href: string }[] = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${encUrl}&title=${encTitle}` },
    { label: "Email", href: `mailto:?subject=${encTitle}&body=${encUrl}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy link:", url);
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title,
          url,
        });
        return true;
      } catch {
        /* user cancelled */
      }
    }
    return false;
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-ink/60">
        <span>Share:</span>
        {targets.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent underline-offset-2 hover:underline"
          >
            {t.label}
          </a>
        ))}
        <button
          type="button"
          onClick={copy}
          className="hover:text-accent underline-offset-2 hover:underline"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    );
  }

  return (
    <div className="border border-ink/10 bg-parchment/60 rounded px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <button
        type="button"
        onClick={async () => {
          const ok = await nativeShare();
          if (!ok) copy();
        }}
        className="font-medium text-accent hover:underline"
      >
        Share this
      </button>
      <span className="text-ink/30">·</span>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink/70 hover:text-accent underline-offset-2 hover:underline"
        >
          {t.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="text-ink/70 hover:text-accent underline-offset-2 hover:underline"
      >
        {copied ? "✓ Copied" : "Copy link"}
      </button>
    </div>
  );
}
