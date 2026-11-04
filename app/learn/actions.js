"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Mark a lesson complete (or not) and optionally move on to the next one.
export async function setLessonComplete(formData) {
  const lessonId = String(formData.get("lesson_id"));
  const slug = String(formData.get("slug"));
  const complete = formData.get("complete") === "1";
  const nextId = String(formData.get("next_id") || "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/learn/${slug}/${lessonId}`);

  if (complete) {
    // Database rules only allow this for students enrolled in the course
    await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId }, { ignoreDuplicates: true });
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  }

  revalidatePath(`/learn/${slug}`, "layout");
  revalidatePath("/dashboard");
  redirect(complete && nextId ? `/learn/${slug}/${nextId}` : `/learn/${slug}/${lessonId}`);
}
