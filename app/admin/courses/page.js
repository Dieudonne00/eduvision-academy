import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/courses";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, price, currency, published, modules (id, lessons (id))")
    .order("title");

  return (
    <>
      <header className="admin-head">
        <h1>Courses &amp; lessons</h1>
        <p className="muted">Set prices, publish courses, and add units and lessons.</p>
      </header>

      <section className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Course</th><th>Price</th><th>Content</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {(courses || []).map((c) => {
                const units = c.modules?.length || 0;
                const lessons = (c.modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0);
                return (
                  <tr key={c.id}>
                    <td><strong>{c.title}</strong><small>/{c.slug}</small></td>
                    <td>{formatPrice(c.price, c.currency) || <span className="muted">Not set</span>}</td>
                    <td><small>{units} units · {lessons} lessons</small></td>
                    <td>
                      <span className={`pill ${c.published ? "pill-success" : "pill-muted"}`}>
                        {c.published ? "Published" : "Hidden"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <Link href={`/admin/courses/${c.id}`} className="btn btn-sm btn-primary">Manage</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
