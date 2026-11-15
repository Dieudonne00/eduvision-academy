import Link from "next/link";
import CourseCard from "../_components/course-card";
import Icon from "../_components/icon";
import { getPublishedCourses } from "@/lib/courses";

export const metadata = {
  title: "Programmes",
  description:
    "English Language Certification, English Fluency and Communication, and Public Speaking and Professional Communication, with video and audio lessons.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="kicker">School of English and Communication</span>
          <h1>Our flagship programmes</h1>
          <p>Each programme is a series of video and audio chapters you can follow on your phone, with quizzes and a final exam.</p>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container">
          <div className="course-grid">
            {courses.map((c) => <CourseCard key={c.slug} course={c} />)}
          </div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container help-box">
          <Icon name="chat" size={28} />
          <div>
            <h3>Not sure which programme is right for you?</h3>
            <p>Tell us your goals and your current level, and we&apos;ll recommend where to start.</p>
          </div>
          <Link href="/contact" className="btn btn-primary">Talk to us</Link>
        </div>
      </section>
    </main>
  );
}
