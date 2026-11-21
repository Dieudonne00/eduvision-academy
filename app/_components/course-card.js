import Link from "next/link";
import Image from "next/image";
import Icon from "./icon";
import { formatPrice } from "@/lib/courses";

export default function CourseCard({ course }) {
  const price = formatPrice(course.price, course.currency);
  const comingSoon = course.chapterCount === 0;

  return (
    <article className={`course-card has-thumb accent-${course.accent}`} id={course.slug}>
      {/* Every card has a picture area of the same size, so the grid stays even */}
      <div className={`course-thumb${course.cover_url ? "" : " placeholder"}`}>
        {course.cover_url
          ? <Image src={course.cover_url} alt="" fill sizes="(max-width: 700px) 100vw, 380px" />
          : <span className="placeholder-icon"><Icon name={course.icon} size={44} strokeWidth={1.5} /></span>}
        {course.category && <span className="thumb-tag">{course.category}</span>}
        {comingSoon && <span className="soon-tag">Coming soon</span>}
      </div>
      <h3><Link href={`/courses/${course.slug}`} className="stretched">{course.title}</Link></h3>
      <p>{course.summary}</p>
      <div className="course-foot">
        <span className="course-link">{comingSoon ? "Learn more" : "View course"} <Icon name="arrowRight" size={16} /></span>
        {price && <span className="course-price">{price}</span>}
      </div>
    </article>
  );
}
