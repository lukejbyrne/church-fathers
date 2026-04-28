import { getRelationships } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return Response.json(getRelationships(), {
    headers: {
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
