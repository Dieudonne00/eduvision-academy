"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signedIn(back) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  return { supabase, user };
}

// Mark a chapter complete (or not) and optionally move on to the next step of the course.
export async function setLessonComplete(formData) {
  const lessonId = String(formData.get("lesson_id"));
  const slug = String(formData.get("slug"));
  const complete = formData.get("complete") === "1";
  const nextUrl = String(formData.get("next_url") || "");

  const { supabase, user } = await signedIn(`/learn/${slug}/${lessonId}`);
  if (complete) {
    // Database rules only allow this for students enrolled in the course
    await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId }, { ignoreDuplicates: true });
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  }

  revalidatePath(`/learn/${slug}`, "layout");
  revalidatePath("/dashboard");
  const safeNext = nextUrl.startsWith(`/learn/${slug}/`) ? nextUrl : null;
  redirect(complete && safeNext ? safeNext : `/learn/${slug}/${lessonId}`);
}

// Start (or resume) a quiz attempt
export async function startQuiz(formData) {
  const slug = String(formData.get("slug"));
  const quizId = String(formData.get("quiz_id"));
  const here = `/learn/${slug}/quiz/${quizId}`;

  const { supabase } = await signedIn(here);
  const { data: attemptId, error } = await supabase.rpc("start_quiz_attempt", { p_quiz_id: quizId });
  if (error) redirect(`${here}?error=${encodeURIComponent(error.message)}`);
  redirect(`${here}/${attemptId}`);
}

// Collect the answers from the form and let the database mark them
export async function submitQuiz(formData) {
  const slug = String(formData.get("slug"));
  const quizId = String(formData.get("quiz_id"));
  const attemptId = String(formData.get("attempt_id"));
  const here = `/learn/${slug}/quiz/${quizId}/${attemptId}`;

  const answers = {};
  for (const id of String(formData.get("question_ids") || "").split(",").filter(Boolean)) {
    const type = String(formData.get(`type_${id}`));
    if (type === "multiple") {
      const picked = formData.getAll(`q_${id}`).map(String);
      if (picked.length) answers[id] = picked;
    } else {
      const v = formData.get(`q_${id}`);
      if (v !== null && String(v).trim() !== "") answers[id] = String(v);
    }
  }

  const { supabase } = await signedIn(here);
  const { error } = await supabase.rpc("submit_quiz_attempt", { p_attempt_id: attemptId, p_answers: answers });
  if (error) redirect(`${here}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/learn/${slug}`, "layout");
  revalidatePath("/dashboard");
  redirect(here);
}
