import Link from "next/link";
import Image from "next/image";
import Icon from "./icon";
import { formatPrice } from "@/lib/courses";

export default function CourseCard({ course }) {
  const price = formatPrice(course.price, course.currency);

  return (
    <article className={`course-card accent-${course.accent}${course.cover_url ? " has-thumb" : ""}`} id={course.slug}>
      {course.cover_url ? (
        <div className="course-thumb">
          <Image src={course.cover_url} alt="" fill sizes="(max-width: 700px) 100vw, 380px" />
          {course.category && <span className="thumb-tag">{course.category}</span>}
        </div>
      ) : (
        <>
          <div className="course-icon"><Icon name={course.icon} size={26} /></div>
          <span className="course-category">{course.category}</span>
        </>
      )}
      <h3><Link href={`/courses/${course.slug}`} className="stretched">{course.title}</Link></h3>
      <p>{course.summary}</p>
      <div className="course-foot">
        <span className="course-link">View course <Icon name="arrowRight" size={16} /></span>
        {price && <span className="course-price">{price}</span>}
      </div>
    </article>
  );
}
