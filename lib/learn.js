// Classroom data shared by chapter and quiz pages: the ordered path through a course
// (chapters, the quizzes placed after them, then the final exam) and the student's progress.
export async function getClassroom(supabase, course, userId, isAdmin) {
  const chapters = course.lessons;

  let quizQuery = supabase
    .from("quizzes")
    .select("id, title, kind, after_lesson_id, pass_mark, time_limit_minutes, max_attempts, published, position")
    .eq("course_id", course.id)
    .order("position");
  if (!isAdmin) quizQuery = quizQuery.eq("published", true);

  const [{ data: quizzes }, { data: done }, { data: enrollment }, { data: certificate }] = await Promise.all([
    quizQuery,
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId).in("lesson_id", chapters.map((l) => l.id)),
    supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", userId).maybeSingle(),
    supabase.from("certificates").select("code").eq("course_id", course.id).eq("user_id", userId).maybeSingle(),
  ]);

  const quizList = quizzes || [];
  const { data: attempts } = quizList.length
    ? await supabase.from("quiz_attempts").select("quiz_id, passed, percent, submitted_at")
        .eq("user_id", userId).in("quiz_id", quizList.map((q) => q.id)).not("submitted_at", "is", null)
    : { data: [] };

  const best = {};
  for (const a of attempts || []) {
    const b = best[a.quiz_id];
    if (!b || Number(a.percent) > Number(b.percent)) best[a.quiz_id] = a;
  }

  // Ordered path: chapter, its quizzes, next chapter… unplaced quizzes, final exam
  const items = [];
  chapters.forEach((ch, i) => {
    items.push({ type: "chapter", id: ch.id, title: ch.title, kind: ch.kind, number: i + 1, href: `/learn/${course.slug}/${ch.id}` });
    quizList.filter((q) => q.kind === "quiz" && q.after_lesson_id === ch.id)
      .forEach((q) => items.push({ type: "quiz", ...q, href: `/learn/${course.slug}/quiz/${q.id}` }));
  });
  quizList.filter((q) => q.kind === "quiz" && !chapters.some((c) => c.id === q.after_lesson_id))
    .forEach((q) => items.push({ type: "quiz", ...q, href: `/learn/${course.slug}/quiz/${q.id}` }));
  quizList.filter((q) => q.kind === "exam")
    .forEach((q) => items.push({ type: "exam", ...q, href: `/learn/${course.slug}/quiz/${q.id}` }));

  const finished = new Set((done || []).map((d) => d.lesson_id));
  const enrolled = enrollment?.status === "active";

  return {
    items,
    finished,
    best,
    enrolled,
    canLearn: enrolled || isAdmin,
    allChaptersDone: chapters.length > 0 && chapters.every((c) => finished.has(c.id)),
    percent: chapters.length ? Math.round((finished.size / chapters.length) * 100) : 0,
    certificate: certificate?.code || null,
  };
}

// The item that follows the current one in the course path
export function nextItem(items, currentId) {
  const i = items.findIndex((it) => it.id === currentId);
  return i >= 0 ? items[i + 1] || null : null;
}
