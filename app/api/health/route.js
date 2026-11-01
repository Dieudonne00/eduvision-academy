export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, service: "eduvision-academy", time: new Date().toISOString() });
}
