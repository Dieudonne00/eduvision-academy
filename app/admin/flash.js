// Success / error banner driven by ?saved= and ?error= after an admin action.
const messages = {
  active: "Payment confirmed. The student now has access to the course.",
  pending: "Marked as awaiting payment.",
  cancelled: "Enrollment cancelled.",
  created: "Course created! Now add Chapter 1 below.",
  course: "Course saved.",
  chapter: "Chapter added. Add the next one, or tick Published when the course is ready.",
  "chapter-updated": "Chapter saved.",
  deleted: "Deleted.",
};

export default function Flash({ saved, error }) {
  if (error) return <p className="error admin-flash">{error}</p>;
  if (saved) return <p className="notice admin-flash">{messages[saved] || "Saved."}</p>;
  return null;
}
