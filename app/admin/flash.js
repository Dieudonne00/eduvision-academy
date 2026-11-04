// Success / error banner driven by ?saved= and ?error= after an admin action.
const messages = {
  active: "Payment confirmed. The student now has access to the course.",
  pending: "Marked as awaiting payment.",
  cancelled: "Enrollment cancelled.",
  course: "Course saved.",
  unit: "Unit added.",
  lesson: "Lesson added.",
  deleted: "Deleted.",
};

export default function Flash({ saved, error }) {
  if (error) return <p className="error admin-flash">{error}</p>;
  if (saved) return <p className="notice admin-flash">{messages[saved] || "Saved."}</p>;
  return null;
}
