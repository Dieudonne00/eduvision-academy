"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/youtube";

// Every action re-checks admin rights; the database rules check them again.
async function adminClient() {
  await requireAdmin();
  return createClient();
}

function back(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `${path}?${qs}` : path);
}

// ── Enrollments / payments ──────────────────────────────────

export async function setEnrollmentStatus(formData) {
  const userId = String(formData.get("user_id"));
  const courseId = String(formData.get("course_id"));
  const status = String(formData.get("status"));
  const returnTo = String(formData.get("return_to") || "/admin/enrollments");
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

export async function updateCourse(formData) {
  const id = String(formData.get("id"));
  const priceRaw = String(formData.get("price") || "").replace(/[\s,]/g, "");
  const price = priceRaw === "" ? null : Number(priceRaw);
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    back(`/admin/courses/${id}`, { error: "Price must be a number (leave empty for 'price on request')." });
  }

  const supabase = await adminClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      level: String(formData.get("level") || "").trim(),
      price,
      currency: String(formData.get("currency") || "RWF").trim().toUpperCase(),
      published: formData.get("published") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin", "layout");
  back(`/admin/courses/${id}`, error ? { error: error.message } : { saved: "course" });
}

// ── Modules (units) ─────────────────────────────────────────

export async function addModule(formData) {
  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") || "").trim();
  if (!title) back(`/admin/courses/${courseId}`, { error: "Give the unit a title." });

  const supabase = await adminClient();
  const { count } = await supabase.from("modules").select("id", { count: "exact", head: true }).eq("course_id", courseId);
  const { error } = await supabase.from("modules").insert({ course_id: courseId, title, position: count ?? 0 });

  revalidatePath(`/admin/courses/${courseId}`);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "unit" });
}

export async function deleteModule(formData) {
  const courseId = String(formData.get("course_id"));
  const supabase = await adminClient();
  const { error } = await supabase.from("modules").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/admin/courses/${courseId}`);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}

// ── Lessons ─────────────────────────────────────────────────

export async function addLesson(formData) {
  const courseId = String(formData.get("course_id"));
  const moduleId = String(formData.get("module_id"));
  const title = String(formData.get("title") || "").trim();
  const kind = String(formData.get("kind")) === "audio" ? "audio" : "video";
  const isPreview = formData.get("is_preview") === "on";
  const minutes = Number(formData.get("minutes") || 0);
  const here = `/admin/courses/${courseId}`;

  if (!title) back(here, { error: "Give the lesson a title." });

  let media;
  if (kind === "video") {
    const youtubeId = parseYouTubeId(formData.get("youtube"));
    if (!youtubeId) back(here, { error: "That doesn't look like a YouTube video ID or link." });
    media = { youtube_id: youtubeId };
  } else {
    const audio = String(formData.get("audio_url") || "").trim();
    if (!/^https:\/\//.test(audio)) back(here, { error: "Paste the audio file's https:// link." });
    media = { audio_path: audio };
  }

  const supabase = await adminClient();
  const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      title,
      kind,
      is_preview: isPreview,
      duration_seconds: minutes > 0 ? Math.round(minutes * 60) : null,
      position: count ?? 0,
    })
    .select("id")
    .single();
  if (error) back(here, { error: error.message });

  const { error: mediaError } = await supabase.from("lesson_media").insert({ lesson_id: lesson.id, ...media });
  if (mediaError) {
    await supabase.from("lessons").delete().eq("id", lesson.id);
    back(here, { error: mediaError.message });
  }

  revalidatePath(here);
  back(here, { saved: "lesson" });
}

export async function deleteLesson(formData) {
  const courseId = String(formData.get("course_id"));
  const supabase = await adminClient();
  const { error } = await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/admin/courses/${courseId}`);
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}
