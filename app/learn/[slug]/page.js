import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";

// /learn/<course> -> jump to the first lesson the student hasn't finished.
export default async function LearnCourse({ params }) {
  const { slug } = await params;
  const { user } = await requireUser(`/learn/${slug}`);
  const course = await getCourseOutline(slug);
  if (!course) notFound();

  if (course.lessons.length === 0) {
    return (
      <main className="page">
        <h1>{course.title}</h1>
        <p className="muted">The chapters for this course are being prepared. Check back soon!</p>
        <Link href="/dashboard" className="btn btn-primary">Back to My learning</Link>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: done } = await supabase
    .from("lesson_progress").select("lesson_id").eq("user_id", user.id)
    .in("lesson_id", course.lessons.map((l) => l.id));
  const finished = new Set((done || []).map((d) => d.lesson_id));
  const next = course.lessons.find((l) => !finished.has(l.id)) || course.lessons[0];

  redirect(`/learn/${slug}/${next.id}`);
}
