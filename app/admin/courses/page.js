import Link from "next/link";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, withDisplay } from "@/lib/courses";
import CourseForm from "../course-form";
import Flash from "../flash";

export default async function AdminCoursesPage({ searchParams }) {
  const flash = await searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, icon, accent, cover_url, price, currency, published, modules (lessons (id))")
    .order("position")
    .order("title");

  return (
    <>
      <header className="admin-head">
        <h1>Courses</h1>
        <p className="muted">Create a course, then add its chapters one by one.</p>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Your courses</h2>
          <a href="#new-course" className="btn btn-primary btn-sm">+ New course</a>
        </div>
        <div className="course-rows">
          {(courses || []).map((row) => {
            const c = withDisplay(row);
            const chapters = (c.modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0);
            return (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="course-row">
                {c.cover_url
                  ? <img src={c.cover_url} alt="" className="course-row-thumb" />
                  : <span className={`course-row-thumb placeholder accent-${c.accent}`}><Icon name={c.icon} size={22} /></span>}
                <div className="course-row-info">
                  <strong>{c.title}</strong>
                  <small>{chapters} chapter{chapters === 1 ? "" : "s"} · {formatPrice(c.price, c.currency) || "No price yet"}</small>
                </div>
                <span className={`pill ${c.published ? "pill-success" : "pill-muted"}`}>{c.published ? "Published" : "Hidden"}</span>
                <span className="course-row-go">Edit →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="admin-card" id="new-course">
        <h2>New course</h2>
        <CourseForm />
      </section>
    </>
  );
}
