import { emailFromUnsubscribeToken } from "@/lib/unsubscribe";
import { removeSubscriber } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlResponse(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;background:#f5efe0;color:#1f1a13;font-family:Georgia,'Times New Roman',serif;line-height:1.55;">
  <main style="max-width:560px;margin:64px auto;padding:0 24px;">
    <h1 style="font-size:32px;font-weight:400;margin:0 0 12px;">${title}</h1>
    <p style="font-size:18px;margin:0 0 24px;color:#1f1a13cc;">${body}</p>
    <a href="/" style="color:#8b1e2d;">Back to Patristic Lineage</a>
  </main>
</body>
</html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const email = emailFromUnsubscribeToken(token);

  if (!email) {
    return htmlResponse("Invalid unsubscribe link", "This unsubscribe link is missing or has expired.", 400);
  }

  await removeSubscriber(email);
  return htmlResponse("You're unsubscribed", "You will not receive future Patristic Lineage emails.");
}

export async function POST(req: Request) {
  return GET(req);
}
