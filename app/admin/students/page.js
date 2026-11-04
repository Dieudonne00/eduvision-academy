import { createClient } from "@/lib/supabase/server";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, enrollments (status, courses (title))")
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="admin-head">
        <h1>Students</h1>
        <p className="muted">{people?.length || 0} accounts, newest first.</p>
      </header>

      <section className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Contact</th><th>Courses</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {(people || []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name || "No name"}</strong>
                    {p.role === "admin" && <span className="pill pill-muted">Admin</span>}
                  </td>
                  <td><small>{p.email}</small><small>{p.phone}</small></td>
                  <td>
                    {(p.enrollments || []).filter((e) => e.status !== "cancelled").map((e) => (
                      <small key={e.courses?.title}>
                        {e.courses?.title} · {e.status === "active" ? "active" : "awaiting payment"}
                      </small>
                    ))}
                    {!(p.enrollments || []).some((e) => e.status !== "cancelled") && <small className="muted">None</small>}
                  </td>
                  <td><small>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
