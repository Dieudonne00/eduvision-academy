import { courses as catalog } from "./site";
import { createClient } from "./supabase/server";

export const COURSE_ICONS = ["book", "chat", "globe", "camera", "road", "headphones", "play", "award", "users", "smartphone", "shield"];

// Course look (icon, colour, category) comes from the database, falling back
// to the built-in catalogue for anything not set yet.
export function withDisplay(course) {
  const display = catalog.find((c) => c.slug === course.slug) || { icon: "book", accent: "teal", category: "Course", summary: "" };
  return {
    ...display,
    ...course,
    icon: course.icon && course.icon !== "book" ? course.icon : display.icon,
    accent: course.accent || display.accent,
    category: course.category || display.category,
    summary: course.description || display.summary,
  };
}

export function formatPrice(price, currency = "RWF") {
  if (price === null || price === undefined) return null;
  if (Number(price) === 0) return "Free";
  return `${Number(price).toLocaleString("en-US")} ${currency}`;
}

export function formatDuration(seconds) {
  const mins = Math.round((seconds || 0) / 60);
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m} min`;
}

// Published courses for the public website (falls back to the built-in list if the DB is unreachable)
export async function getPublishedCourses() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, description, category, icon, accent, level, price, currency, cover_url")
      .eq("published", true)
      .order("position")
      .order("title");
    if (error) throw error;
    return data.map(withDisplay);
  } catch {
    return catalog;
  }
}

// One course with its chapters and lessons in order (media is NOT included here).
export async function getCourseOutline(slug) {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`id, slug, title, description, category, icon, accent, level, language, price, currency, outcomes, published, cover_url,
             modules (id, title, description, position,
               lessons (id, title, kind, is_preview, duration_seconds, position))`)
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;

  const chapters = [...(course.modules || [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons || [])].sort((a, b) => a.position - b.position) }));
  const lessons = chapters.flatMap((c) => c.lessons);

  return {
    ...withDisplay(course),
    chapters,
    lessons,
    totalSeconds: lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0),
  };
}
