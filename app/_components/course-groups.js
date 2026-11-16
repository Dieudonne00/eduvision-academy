import CourseCard from "./course-card";

// Courses grouped by category, in the order they first appear (courses come sorted by position).
export default function CourseGroups({ courses }) {
  const groups = [...new Set(courses.map((c) => c.category || "Courses"))];

  return groups.map((group) => (
    <div key={group} className="course-group">
      <h3 className="group-title">{group}</h3>
      <div className="course-grid">
        {courses.filter((c) => (c.category || "Courses") === group).map((c) => <CourseCard key={c.slug} course={c} />)}
      </div>
    </div>
  ));
}
