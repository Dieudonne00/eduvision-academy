// Only allow redirects to paths on our own site (blocks "//evil.com" and full URLs).
export function safeNext(value, fallback = "/dashboard") {
  const next = String(value || "");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
