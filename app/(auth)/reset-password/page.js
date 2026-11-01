import AuthForm from "../auth-form";
import { updatePassword } from "../actions";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Choose a new password" };

// Reached from the reset email: /auth/confirm signs them in first, then sends them here.
export default async function ResetPasswordPage() {
  await requireUser("/reset-password");

  return (
    <div className="auth-card">
      <h1>Choose a new password</h1>
      <p className="muted">Pick something at least 8 characters long.</p>
      <AuthForm action={updatePassword} submitLabel="Save new password">
        <label>
          New password
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label>
          Repeat new password
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </label>
      </AuthForm>
    </div>
  );
}
