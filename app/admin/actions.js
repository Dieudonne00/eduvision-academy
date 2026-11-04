"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/youtube";
import { COURSE_ICONS } from "@/lib/courses";

// Every action re-checks admin rights; the database rules check them again.
async function adminClient() {
  await requireAdmin();
  return createClient();
}

function back(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `${path}?${qs}` : path);
}

const text = (formData, key) => String(formData.get(key) || "").trim();

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "course";
}

function parsePrice(raw) {
  const value = String(raw || "").replace(/[\s,]/g, "");
  if (value === "") return { price: null };
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? { price } : { error: "Price must be a number (leave empty for 'price on request')." };
}

function refreshCourse(id) {
  revalidatePath("/admin", "layout");
  revalidatePath("/courses", "layout");
  revalidatePath("/");
  return `/admin/courses/${id}`;
}

// Rewrite positions 0..n after moving one item up or down among its siblings
async function move(supabase, table, parentColumn, id, direction) {
  const { data: item } = await supabase.from(table).select(`id, ${parentColumn}`).eq("id", id).single();
  const { data: siblings } = await supabase
    .from(table).select("id, position").eq(parentColumn, item[parentColumn]).order("position").order("id");
  const order = siblings.map((s) => s.id);
  const i = order.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  await Promise.all(order.map((sid, position) => supabase.from(table).update({ position }).eq("id", sid)));
}

// ── Enrollments / payments ──────────────────────────────────

export async function setEnrollmentStatus(formData) {
  const userId = text(formData, "user_id");
  const courseId = text(formData, "course_id");
  const status = text(formData, "status");
  const returnTo = text(formData, "return_to") || "/admin/enrollments";
  if (!["active", "pending", "cancelled"].includes(status)) back(returnTo, { error: "Unknown status" });

  const supabase = await adminClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status, paid_at: status === "active" ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  revalidatePath("/admin", "layout");
  back(returnTo, error ? { error: error.message } : { saved: status });
}

// ── Courses ─────────────────────────────────────────────────

export async function createCourse(formData) {
  const title = text(formData, "title");
  if (!title) back("/admin/courses", { error: "Give the course a title." });
  const { price, error: priceError } = parsePrice(formData.get("price"));
  if (priceError) back("/admin/courses", { error: priceError });

  const supabase = await adminClient();

  // Unique web address: french, french-2, french-3…
  const base = slugify(text(formData, "slug") || title);
  const { data: taken } = await supabase.from("courses").select("slug").like("slug", `${base}%`);
  const used = new Set((taken || []).map((t) => t.slug));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const { count } = await supabase.from("courses").select("id", { count: "exact", head: true });
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      category: text(formData, "category"),
      price,
      currency: "RWF",
      published: false,
      position: (count ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) back("/admin/courses", { error: error.message });

  refreshCourse(course.id);
  back(`/admin/courses/${course.id}`, { saved: "created" });
}

export async function updateCourse(formData) {
  const id = text(formData, "id");
  const here = `/admin/courses/${id}`;
  const { price, error: priceError } = parsePrice(formData.get("price"));
  if (priceError) back(here, { error: priceError });

  const icon = COURSE_ICONS.includes(text(formData, "icon")) ? text(formData, "icon") : "book";
  const accent = text(formData, "accent") === "orange" ? "orange" : "teal";
  const outcomes = text(formData, "outcomes").split("\n").map((s) => s.trim()).filter(Boolean);

  const supabase = await adminClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title: text(formData, "title"),
      description: text(formData, "description"),
      category: text(formData, "category"),
      language: text(formData, "language"),
      level: text(formData, "level"),
      price,
      currency: (text(formData, "currency") || "RWF").toUpperCase(),
      icon,
      accent,
      outcomes,
      published: formData.get("published") === "on",
    })
    .eq("id", id);

  refreshCourse(id);
  back(here, error ? { error: error.message } : { saved: "course" });
}

export async function deleteCourse(formData) {
  const id = text(formData, "course_id");
  const supabase = await adminClient();

  // Never delete a course students are enrolled in: that would erase their access and history
  const { count } = await supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("course_id", id);
  if (count) {
    back(`/admin/courses/${id}`, { error: `${count} student(s) are enrolled, so this course can't be deleted. Untick "Published" to hide it instead.` });
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) back(`/admin/courses/${id}`, { error: error.message });
  refreshCourse(id);
  back("/admin/courses", { saved: "deleted" });
}

// ── Chapters ────────────────────────────────────────────────

export async function addChapter(formData) {
  const courseId = text(formData, "course_id");
  const title = text(formData, "title");
  const here = `/admin/courses/${courseId}`;
  if (!title) back(here, { error: "Give the chapter a title." });

  const supabase = await adminClient();
  const { count } = await supabase.from("modules").select("id", { count: "exact", head: true }).eq("course_id", courseId);
  const { error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, title, description: text(formData, "description"), position: count ?? 0 });

  refreshCourse(courseId);
  back(here, error ? { error: error.message } : { saved: "chapter" });
}

export async function updateChapter(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const { error } = await supabase
    .from("modules")
    .update({ title: text(formData, "title"), description: text(formData, "description") })
    .eq("id", text(formData, "id"));
  refreshCourse(courseId);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "chapter-updated" });
}

export async function moveChapter(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  await move(supabase, "modules", "course_id", text(formData, "id"), text(formData, "direction"));
  refreshCourse(courseId);
  back(`/admin/courses/${courseId}`);
}

export async function deleteChapter(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const { error } = await supabase.from("modules").delete().eq("id", text(formData, "id"));
  refreshCourse(courseId);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}

// ── Lessons ─────────────────────────────────────────────────

function lessonFields(formData, here) {
  const kind = text(formData, "kind") === "audio" ? "audio" : "video";
  const title = text(formData, "title");
  if (!title) back(here, { error: "Give the lesson a title." });

  let media;
  if (kind === "video") {
    const youtubeId = parseYouTubeId(formData.get("youtube"));
    if (!youtubeId) back(here, { error: "That doesn't look like a YouTube video ID or link." });
    media = { youtube_id: youtubeId, audio_path: null };
  } else {
    const audio = text(formData, "audio_url");
    if (!/^https:\/\//.test(audio)) back(here, { error: "Paste the audio file's https:// link." });
    media = { youtube_id: null, audio_path: audio };
  }

  const minutes = Number(formData.get("minutes") || 0);
  return {
    lesson: {
      title,
      kind,
      is_preview: formData.get("is_preview") === "on",
      duration_seconds: minutes > 0 ? Math.round(minutes * 60) : null,
    },
    media: { ...media, notes: text(formData, "content") },
  };
}

export async function addLesson(formData) {
  const courseId = text(formData, "course_id");
  const moduleId = text(formData, "module_id");
  const here = `/admin/courses/${courseId}`;
  const { lesson, media } = lessonFields(formData, here);

  const supabase = await adminClient();
  const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
  const { data: row, error } = await supabase
    .from("lessons")
    .insert({ ...lesson, module_id: moduleId, position: count ?? 0 })
    .select("id")
    .single();
  if (error) back(here, { error: error.message });

  const { error: mediaError } = await supabase.from("lesson_media").insert({ lesson_id: row.id, ...media });
  if (mediaError) {
    await supabase.from("lessons").delete().eq("id", row.id);
    back(here, { error: mediaError.message });
  }

  refreshCourse(courseId);
  back(here, { saved: "lesson" });
}

export async function updateLesson(formData) {
  const courseId = text(formData, "course_id");
  const id = text(formData, "id");
  const here = `/admin/courses/${courseId}`;
  const { lesson, media } = lessonFields(formData, here);

  const supabase = await adminClient();
  const { error } = await supabase.from("lessons").update(lesson).eq("id", id);
  if (error) back(here, { error: error.message });
  const { error: mediaError } = await supabase.from("lesson_media").upsert({ lesson_id: id, ...media });

  refreshCourse(courseId);
  back(here, mediaError ? { error: mediaError.message } : { saved: "lesson-updated" });
}

export async function moveLesson(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  await move(supabase, "lessons", "module_id", text(formData, "id"), text(formData, "direction"));
  refreshCourse(courseId);
  back(`/admin/courses/${courseId}`);
}

export async function deleteLesson(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const { error } = await supabase.from("lessons").delete().eq("id", text(formData, "id"));
  refreshCourse(courseId);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}
