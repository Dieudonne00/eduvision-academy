import { courses as catalog } from "./site";

// Look/feel for a course (icon, colour) comes from the site catalogue;
// prices and ids come from the database.
export function withDisplay(course) {
  const display = catalog.find((c) => c.slug === course.slug) || { icon: "book", accent: "teal", category: "Course" };
  return { ...display, ...course, summary: course.description || display.summary };
}

export function formatPrice(price, currency = "RWF") {
  if (price === null || price === undefined) return null;
  if (Number(price) === 0) return "Free";
  return `${Number(price).toLocaleString("en-US")} ${currency}`;
}
