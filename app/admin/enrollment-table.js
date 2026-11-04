import { formatPrice } from "@/lib/courses";
import { setEnrollmentStatus } from "./actions";

function StatusButton({ row, status, label, variant, returnTo }) {
  return (
    <form action={setEnrollmentStatus}>
      <input type="hidden" name="user_id" value={row.user_id} />
      <input type="hidden" name="course_id" value={row.course_id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button type="submit" className={`btn btn-sm ${variant}`}>{label}</button>
    </form>
  );
}

function whatsapp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export default function EnrollmentTable({ rows, returnTo }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Reserved</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = row.profiles || {};
            const wa = whatsapp(p.phone);
            return (
              <tr key={`${row.user_id}-${row.course_id}`}>
                <td>
                  <strong>{p.full_name || "No name"}</strong>
                  <small>{p.email}</small>
                  {p.phone && (
                    <small>
                      {p.phone}{wa && <> · <a href={wa} target="_blank" rel="noopener">WhatsApp</a></>}
                    </small>
                  )}
                </td>
                <td>
                  <strong>{row.courses?.title}</strong>
                  <small>{formatPrice(row.courses?.price, row.courses?.currency) || "Price on request"}</small>
                </td>
                <td><small>{new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small></td>
                <td>
                  <span className={`pill ${row.status === "active" ? "pill-success" : row.status === "pending" ? "pill-pending" : "pill-muted"}`}>
                    {row.status === "active" ? "Active" : row.status === "pending" ? "Awaiting payment" : "Cancelled"}
                  </span>
                </td>
                <td className="row-actions">
                  {row.status !== "active" && (
                    <StatusButton row={row} status="active" label="Confirm payment" variant="btn-primary" returnTo={returnTo} />
                  )}
                  {row.status === "pending" && (
                    <StatusButton row={row} status="cancelled" label="Cancel" variant="btn-ghost" returnTo={returnTo} />
                  )}
                  {row.status === "active" && (
                    <StatusButton row={row} status="pending" label="Revoke access" variant="btn-ghost" returnTo={returnTo} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
