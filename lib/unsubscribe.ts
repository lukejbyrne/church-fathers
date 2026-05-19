import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";

function tokenSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.ADMIN_TOKEN;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing UNSUBSCRIBE_SECRET or ADMIN_TOKEN");
  }
  return "local-dev-unsubscribe-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createUnsubscribeToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ v: TOKEN_VERSION, email: email.trim().toLowerCase() })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function emailFromUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      v?: string;
      email?: string;
    };
    if (decoded.v !== TOKEN_VERSION || !decoded.email || !/^\S+@\S+\.\S+$/.test(decoded.email)) {
      return null;
    }
    return decoded.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

export function unsubscribeUrlFor(email: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const token = encodeURIComponent(createUnsubscribeToken(email));
  return `${base}/api/unsubscribe?token=${token}`;
}
