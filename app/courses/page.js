import Link from "next/link";
import CourseGroups from "../_components/course-groups";
import Icon from "../_components/icon";
import { getPublishedCourses } from "@/lib/courses";

export const metadata = {
  title: "Programmes",
  description:
    "English certification, fluency and public speaking, plus English, French, Chinese, Swahili and German courses, photography and traffic rules.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="kicker">School of English and Communication</span>
          <h1>Programmes &amp; courses</h1>
          <p>Our flagship English programmes, plus languages and practical skills. Every course is a series of video and audio chapters you can follow on your phone.</p>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container">
          <CourseGroups courses={courses} />
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
