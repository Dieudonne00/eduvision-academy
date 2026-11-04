import Link from "next/link";
import Icon from "./icon";
import { formatPrice } from "@/lib/courses";

export default function CourseCard({ course }) {
  const price = formatPrice(course.price, course.currency);

  return (
    <article className={`course-card accent-${course.accent}`} id={course.slug}>
      <div className="course-icon"><Icon name={course.icon} size={26} /></div>
      <span className="course-category">{course.category}</span>
      <h3><Link href={`/courses/${course.slug}`} className="stretched">{course.title}</Link></h3>
      <p>{course.summary}</p>
      <ul className="course-meta">
        <li><Icon name="play" size={14} /> Video</li>
        <li><Icon name="headphones" size={14} /> Audio</li>
        <li><Icon name="checkCircle" size={14} /> Quizzes</li>
      </ul>
      <div className="course-foot">
        <span className="course-link">View course <Icon name="arrowRight" size={16} /></span>
        {price && <span className="course-price">{price}</span>}
      </div>
    </article>
  );
}
