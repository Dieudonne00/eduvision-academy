import Link from "next/link";
import Icon from "./icon";

export default function CourseCard({ course }) {
  return (
    <article className={`course-card accent-${course.accent}`} id={course.slug}>
      <div className="course-icon"><Icon name={course.icon} size={26} /></div>
      <span className="course-category">{course.category}</span>
      <h3>{course.title}</h3>
      <p>{course.summary}</p>
      <ul className="course-meta">
        <li><Icon name="play" size={14} /> Video</li>
        <li><Icon name="headphones" size={14} /> Audio</li>
        <li><Icon name="checkCircle" size={14} /> Quizzes</li>
      </ul>
      <Link href={`/checkout/${course.slug}`} className="course-link">
        Enroll now <Icon name="arrowRight" size={16} />
      </Link>
    </article>
  );
}
