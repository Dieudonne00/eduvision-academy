import Link from "next/link";
import CourseForm from "../../course-form";
import Flash from "../../flash";

export const metadata = { title: "New course" };

export default async function NewCoursePage({ searchParams }) {
  const flash = await searchParams;

  return (
    <>
      <header className="admin-head">
        <Link href="/admin/courses" className="back-link"><span aria-hidden="true">←</span> All courses</Link>
        <h1>New course</h1>
        <p className="muted">Step 1 of 3: course details. Next you&apos;ll add chapters (video or audio), then quizzes if you want.</p>
      </header>

      <ol className="steps-mini" aria-label="Steps">
        <li className="active"><span>1</span> Course details</li>
        <li><span>2</span> Chapters</li>
        <li><span>3</span> Quizzes &amp; exam</li>
      </ol>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card">
        <CourseForm />
      </section>
    </>
  );
}
