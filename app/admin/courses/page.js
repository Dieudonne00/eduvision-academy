import Link from "next/link";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, withDisplay } from "@/lib/courses";
import { createCourse } from "../actions";
import Flash from "../flash";

export default async function AdminCoursesPage({ searchParams }) {
  const flash = await searchParams;
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, category, icon, accent, price, currency, published, modules (id, lessons (id))")
    .order("position")
    .order("title");

  return (
    <>
      <header className="admin-head">
        <h1>Courses &amp; lessons</h1>
        <p className="muted">Create courses, organise them into chapters, and add video or audio lessons.</p>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card new-course">
        <h2>New course</h2>
        <form action={createCourse} className="form-row">
          <label className="grow">
            Course title
            <input name="title" placeholder="e.g. German for Beginners" required />
          </label>
          <label className="grow">
            Category
            <input name="category" placeholder="e.g. Languages" list="categories" />
            <datalist id="categories">
              <option value="Languages" /><option value="Creative skills" /><option value="Driving" /><option value="Computer skills" />
            </datalist>
          </label>
          <label className="narrow">
            Price (RWF)
            <input name="price" inputMode="numeric" placeholder="Optional" />
          </label>
          <button type="submit" className="btn btn-primary">Create course</button>
        </form>
        <p className="hint">New courses start hidden. Add chapters and lessons, then tick Published.</p>
      </section>

      <section className="admin-card">
        <h2>All courses</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Course</th><th>Price</th><th>Content</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {(courses || []).map((row) => {
                const c = withDisplay(row);
                const chapters = c.modules?.length || 0;
                const lessons = (c.modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="course-cell">
                        <span className={`mini-icon accent-${c.accent}`}><Icon name={c.icon} size={18} /></span>
                        <div><strong>{c.title}</strong><small>{c.category || "No category"}</small></div>
                      </div>
                    </td>
                    <td>{formatPrice(c.price, c.currency) || <span className="muted">Not set</span>}</td>
                    <td><small>{chapters} chapters · {lessons} lessons</small></td>
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
