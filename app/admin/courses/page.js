import Link from "next/link";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, withDisplay } from "@/lib/courses";
import Flash from "../flash";

export default async function AdminCoursesPage({ searchParams }) {
  const flash = await searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, category, icon, accent, cover_url, price, currency, published, modules (lessons (id))")
    .order("position")
    .order("title");

  return (
    <>
      <header className="admin-head">
        <div className="admin-head-row">
          <div>
            <h1>Courses</h1>
            <p className="muted">Click a course to edit it and add chapters, or create a new one.</p>
          </div>
          <Link href="/admin/courses/new" className="btn btn-primary">+ New course</Link>
        </div>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card">
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
                  <small>
                    {c.category ? `${c.category} · ` : ""}{chapters} chapter{chapters === 1 ? "" : "s"} · {formatPrice(c.price, c.currency) || "No price yet"}
                  </small>
                </div>
                {chapters === 0 && c.published && <span className="pill pill-pending">No chapters yet</span>}
                <span className={`pill ${c.published ? "pill-success" : "pill-muted"}`}>{c.published ? "Published" : "Hidden"}</span>
                <span className="course-row-go">Edit →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
