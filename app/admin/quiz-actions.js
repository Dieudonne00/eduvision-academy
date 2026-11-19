"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Quizzes (after a chapter) and the final exam (end of course), with their questions.
// Correct answers go to question_keys, which students can never read.

async function adminClient() {
  await requireAdmin();
  return createClient();
}

function back(path, params = {}, hash = "") {
  const qs = new URLSearchParams(params).toString();
  redirect(`${path}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`);
}

const text = (formData, key) => String(formData.get(key) || "").trim();
const intOrNull = (formData, key) => {
  const n = parseInt(text(formData, key), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const LETTERS = "abcdef";

function quizFields(formData) {
  const kind = text(formData, "kind") === "exam" ? "exam" : "quiz";
  const passMark = Math.min(100, Math.max(0, parseInt(text(formData, "pass_mark") || "70", 10)));
  return {
    title: text(formData, "title") || (kind === "exam" ? "Final exam" : "Quiz"),
    kind,
    after_lesson_id: kind === "quiz" ? text(formData, "after_lesson_id") || null : null,
    pass_mark: Number.isFinite(passMark) ? passMark : 70,
    time_limit_minutes: intOrNull(formData, "time_limit_minutes"),
    max_attempts: intOrNull(formData, "max_attempts"),
    shuffle: formData.get("shuffle") === "on",
  };
}

export async function createQuiz(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const fields = quizFields(formData);

  if (fields.kind === "exam") {
    const { count } = await supabase.from("quizzes").select("id", { count: "exact", head: true })
      .eq("course_id", courseId).eq("kind", "exam");
    if (count) back(`/admin/courses/${courseId}`, { error: "This course already has a final exam. Open it to add questions." });
  }

  const { count: n } = await supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("course_id", courseId);
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({ ...fields, course_id: courseId, published: false, position: n ?? 0 })
    .select("id")
    .single();
  if (error) back(`/admin/courses/${courseId}`, { error: error.message });

  revalidatePath("/", "layout");
  back(`/admin/courses/${courseId}/quizzes/${quiz.id}`, { saved: "quiz-created" });
}

export async function updateQuiz(formData) {
  const courseId = text(formData, "course_id");
  const id = text(formData, "id");
  const here = `/admin/courses/${courseId}/quizzes/${id}`;
  const supabase = await adminClient();

  const publish = formData.get("published") === "on";
  if (publish) {
    const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("quiz_id", id);
    if (!count) back(here, { error: "Add at least one question before publishing.", at: "settings" }, "settings");
  }

  const { kind, ...fields } = quizFields(formData);
  const { error } = await supabase.from("quizzes").update({ ...fields, published: publish }).eq("id", id);
  revalidatePath("/", "layout");
  back(here, { ...(error ? { error: error.message } : { saved: "quiz" }), at: "settings" }, "settings");
}

export async function deleteQuiz(formData) {
  const courseId = text(formData, "course_id");
  const supabase = await adminClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", text(formData, "id"));
  revalidatePath("/", "layout");
  back(`/admin/courses/${courseId}`, error ? { error: error.message } : { saved: "deleted" });
}

export async function addQuestion(formData) {
  const courseId = text(formData, "course_id");
  const quizId = text(formData, "quiz_id");
  const here = `/admin/courses/${courseId}/quizzes/${quizId}`;
  const type = text(formData, "type");
  const prompt = text(formData, "prompt");
  if (!prompt) back(here, { ...{ error: "Write the question." }, at: "questions" }, "questions");

  let options = {};
  let answer;
  if (type === "single" || type === "multiple") {
    const choices = [];
    for (let i = 0; i < LETTERS.length; i++) {
      const t = text(formData, `option_${i}`);
      if (t) choices.push({ id: LETTERS[i], text: t });
    }
    if (choices.length < 2) back(here, { ...{ error: "Add at least two answer options." }, at: "questions" }, "questions");
    const ids = new Set(choices.map((c) => c.id));
    options = { choices };
    if (type === "single") {
      const correct = text(formData, "correct");
      if (!ids.has(correct)) back(here, { ...{ error: "Choose which option is correct." }, at: "questions" }, "questions");
      answer = { correct };
    } else {
      const correct = formData.getAll("correct_multi").map(String).filter((c) => ids.has(c));
      if (!correct.length) back(here, { ...{ error: "Tick at least one correct option." }, at: "questions" }, "questions");
      answer = { correct };
    }
  } else if (type === "true_false") {
    options = { choices: [{ id: "true", text: "True" }, { id: "false", text: "False" }] };
    answer = { correct: text(formData, "correct_tf") === "false" ? "false" : "true" };
  } else if (type === "fill_blank") {
    const accepted = text(formData, "accepted").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (!accepted.length) back(here, { ...{ error: "Write the correct answer (separate alternatives with commas)." }, at: "questions" }, "questions");
    answer = { accepted };
  } else {
    back(here, { ...{ error: "Choose a question type." }, at: "questions" }, "questions");
  }

  const points = Math.max(1, Number(text(formData, "points") || 1));
  const supabase = await adminClient();
  const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("quiz_id", quizId);
  const { data: q, error } = await supabase
    .from("questions")
    .insert({ quiz_id: quizId, type, prompt, options, points, audio_path: text(formData, "audio_path") || null, position: count ?? 0 })
    .select("id")
    .single();
  if (error) back(here, { ...{ error: error.message }, at: "questions" }, "questions");

  const { error: keyError } = await supabase
    .from("question_keys")
    .insert({ question_id: q.id, answer, explanation: text(formData, "explanation") });
  if (keyError) {
    await supabase.from("questions").delete().eq("id", q.id);
    back(here, { ...{ error: keyError.message }, at: "questions" }, "questions");
  }

  revalidatePath(here);
  back(here, { ...{ saved: "question" }, at: "questions" }, "questions");
}

export async function deleteQuestion(formData) {
  const courseId = text(formData, "course_id");
  const quizId = text(formData, "quiz_id");
  const supabase = await adminClient();
  const { error } = await supabase.from("questions").delete().eq("id", text(formData, "id"));
  const here = `/admin/courses/${courseId}/quizzes/${quizId}`;
  revalidatePath(here);
  back(here, { ...(error ? { error: error.message } : { saved: "deleted" }), at: "questions" }, "questions");
}
