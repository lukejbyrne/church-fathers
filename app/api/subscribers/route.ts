// Read the subscriber list. Protected by ADMIN_TOKEN.
//   GET /api/subscribers?token=...           -> JSON
//   GET /api/subscribers?token=...&format=csv -> CSV download

import { listSubscribers } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || token !== expected) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const subs = await listSubscribers();

  if (url.searchParams.get("format") === "csv") {
    const rows = ["email,subscribed_at,source"]
      .concat(subs.map((s) => `${s.email},${s.subscribed_at},${s.source ?? ""}`))
      .join("\n");
    return new Response(rows, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return Response.json({ ok: true, count: subs.length, subscribers: subs });
}
