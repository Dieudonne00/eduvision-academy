import Link from "next/link";
import CourseCard from "../_components/course-card";
import Icon from "../_components/icon";
import { getPublishedCourses } from "@/lib/courses";

export const metadata = {
  title: "Courses",
  description: "English, French, Swahili, Chinese, Photography & Videography, and Traffic Rules courses with video and audio lessons.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();
  const groups = [...new Set(courses.map((c) => c.category || "Courses"))];

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="kicker">Courses</span>
          <h1>Find the course that moves you forward</h1>
          <p>Each course is organised in chapters of video and audio lessons, with quizzes and a final exam with a certificate.</p>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group} className="section section-compact">
          <div className="container">
            <h2 className="group-title">{group}</h2>
            <div className="course-grid">
              {courses.filter((c) => (c.category || "Courses") === group).map((c) => <CourseCard key={c.slug} course={c} />)}
            </div>
          </div>
        </section>
      ))}

      <section className="section section-compact">
        <div className="container help-box">
          <Icon name="chat" size={28} />
          <div>
            <h3>Not sure which course or level is right for you?</h3>
            <p>Tell us your goals and we&apos;ll recommend where to start.</p>
          </div>
          <Link href="/contact" className="btn btn-primary">Talk to us</Link>
        </div>
      </section>
    </main>
  );
}
