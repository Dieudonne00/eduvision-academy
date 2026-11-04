"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/youtube";

// A course is a list of chapters; each chapter is one video or one audio.
// (In the database a chapter is a row in `lessons`, all under one `modules` row per course.)

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
  return Number.isFinite(price) && price >= 0 ? { price } : { error: "Price must be a number, e.g. 25000." };
}

function refresh() {
  revalidatePath("/", "layout");
}

// ── Payments ────────────────────────────────────────────────

export async function setEnrollmentStatus(formData) {
  const status = text(formData, "status");
  const returnTo = text(formData, "return_to") || "/admin/enrollments";
  if (!["active", "pending", "cancelled"].includes(status)) back(returnTo, { error: "Unknown status" });

  const supabase = await adminClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status, paid_at: status === "active" ? new Date().toISOString() : null })
    .eq("user_id", text(formData, "user_id"))
    .eq("course_id", text(formData, "course_id"));

  refresh();
  back(returnTo, error ? { error: error.message } : { saved: status });
}

// ── Course ──────────────────────────────────────────────────

function courseFields(formData) {
  const { price, error } = parsePrice(formData.get("price"));
  return {
    error: !text(formData, "title") ? "Give the course a title." : error,
    fields: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      cover_url: text(formData, "cover_url") || null,
      price,
    },
  };
}

export async function createCourse(formData) {
  const { error: invalid, fields } = courseFields(formData);
  if (invalid) back("/admin/courses", { error: invalid });

  const supabase = await adminClient();

  // Unique web address: german, german-2…
  const base = slugify(fields.title);
  const { data: taken } = await supabase.from("courses").select("slug").like("slug", `${base}%`);
  const used = new Set((taken || []).map((t) => t.slug));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const { count } = await supabase.from("courses").select("id", { count: "exact", head: true });
  const { data: course, error } = await supabase
    .from("courses")
    .insert({ ...fields, slug, currency: "RWF", published: false, position: (count ?? 0) + 1 })
    .select("id")
    .single();
  if (error) back("/admin/courses", { error: error.message });

  refresh();
  back(`/admin/courses/${course.id}`, { saved: "created" });
}

export async function updateCourse(formData) {
  const id = text(formData, "id");
  const { error: invalid, fields } = courseFields(formData);
  if (invalid) back(`/admin/courses/${id}`, { error: invalid });

  const supabase = await adminClient();
  const { error } = await supabase
    .from("courses")
    .update({ ...fields, published: formData.get("published") === "on" })
    .eq("id", id);

  refresh();
  back(`/admin/courses/${id}`, error ? { error: error.message } : { saved: "course" });
}

export async function deleteCourse(formData) {
  const id = text(formData, "course_id");
  const supabase = await adminClient();

  // Never delete a course students are enrolled in: that would erase their access
  const { count } = await supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("course_id", id);
  if (count) {
    back(`/admin/courses/${id}`, { error: `${count} student(s) are enrolled, so this course can't be deleted. Untick "Published" to hide it instead.` });
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) back(`/admin/courses/${id}`, { error: error.message });
  refresh();
  back("/admin/courses", { saved: "deleted" });
}

// ── Chapters ────────────────────────────────────────────────

function chapterFields(formData, here) {
  const title = text(formData, "title");
  if (!title) back(here, { error: "Give the chapter a title." });

  const kind = text(formData, "kind") === "audio" ? "audio" : "video";
  if (kind === "video") {
    const youtubeId = parseYouTubeId(formData.get("youtube"));
    if (!youtubeId) back(here, { error: "Paste the YouTube link of the video (e.g. https://youtu.be/…)." });
    return { lesson: { title, kind }, media: { youtube_id: youtubeId, audio_path: null } };
  }
  const audio = text(formData, "audio_path");
  if (!audio) back(here, { error: "Upload the audio file first, then click Add." });
  return { lesson: { title, kind }, media: { youtube_id: null, audio_path: audio } };
}

// Every course keeps its chapters in one container row; create it the first time.
async function courseModuleId(supabase, courseId) {
  const { data: existing } = await supabase
    .from("modules").select("id").eq("course_id", courseId).order("position").limit(1).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("modules").insert({ course_id: courseId, title: "Chapters", position: 0 }).select("id").single();
  if (error) throw error;
  return created.id;
}

async function courseLessons(supabase, courseId) {
  const { data } = await supabase
    .from("lessons").select("id, position, modules!inner (course_id, position)")
    .eq("modules.course_id", courseId);
  return (data || []).sort((a, b) => a.modules.position - b.modules.position || a.position - b.position);
}

export async function addChapter(formData) {
  const courseId = text(formData, "course_id");
  const here = `/admin/courses/${courseId}`;
  const { lesson, media } = chapterFields(formData, here);

  const supabase = await adminClient();
  const moduleId = await courseModuleId(supabase, courseId);
  const existing = await courseLessons(supabase, courseId);
  const position = existing.reduce((max, l) => Math.max(max, l.position + 1), 0);

  const { data: row, error } = await supabase
    .from("lessons").insert({ ...lesson, module_id: moduleId, position }).select("id").single();
  if (error) back(here, { error: error.message });

  const { error: mediaError } = await supabase.from("lesson_media").insert({ lesson_id: row.id, ...media });
  if (mediaError) {
    await supabase.from("lessons").delete().eq("id", row.id);
    back(here, { error: mediaError.message });
  }

  refresh();
  back(here, { saved: "chapter" });
}

export async function updateChapter(formData) {
  const courseId = text(formData, "course_id");
  const id = text(formData, "id");
  const here = `/admin/courses/${courseId}`;
  const { lesson, media } = chapterFields(formData, here);

  const supabase = await adminClient();
  const { error } = await supabase.from("lessons").update(lesson).eq("id", id);
  if (error) back(here, { error: error.message });
  const { error: mediaError } = await supabase.from("lesson_media").upsert({ lesson_id: id, ...media });

  refresh();
  back(here, mediaError ? { error: mediaError.message } : { saved: "chapter-updated" });
}

export async function moveChapter(formData) {
  const courseId = text(formData, "course_id");
  const id = text(formData, "id");
  const supabase = await adminClient();

  const order = (await courseLessons(supabase, courseId)).map((l) => l.id);
  const i = order.indexOf(id);
  const j = text(formData, "direction") === "up" ? i - 1 : i + 1;
  if (i !== -1 && j >= 0 && j < order.length) {
    [order[i], order[j]] = [order[j], order[i]];
    const moduleId = await courseModuleId(supabase, courseId);
    // Rewrite positions 0..n (and gather everything into the course's chapter list)
    await Promise.all(order.map((lid, position) => supabase.from("lessons").update({ position, module_id: moduleId }).eq("id", lid)));
  }

  refresh();
  back(`/admin/courses/${courseId}`);
}

export async function deleteChapter(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const { error } = await supabase.from("lessons").delete().eq("id", text(formData, "id"));
  refresh();
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}
