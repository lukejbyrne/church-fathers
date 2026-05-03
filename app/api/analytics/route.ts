import { recordPageview } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let payload: unknown = {};

  try {
    payload = await req.json();
  } catch {}

  const result = await recordPageview(
    req,
    typeof payload === "object" && payload !== null ? payload : {}
  );

  return Response.json(result, {
    status: 202,
    headers: { "cache-control": "no-store" },
  });
}
