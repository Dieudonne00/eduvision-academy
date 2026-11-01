// Normalises a phone number to international format, e.g. "0788 672 955" -> "+250788672955".
// Returns null when it doesn't look like a valid number.
export function normalizePhone(input) {
  let p = String(input || "").replace(/[\s\-().]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (/^07\d{8}$/.test(p)) p = "+250" + p.slice(1); // Rwandan mobile written locally
  if (/^250\d{9}$/.test(p)) p = "+" + p;
  return /^\+\d{9,15}$/.test(p) ? p : null;
}
