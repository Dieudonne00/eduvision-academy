import Link from "next/link";
import AuthForm from "../auth-form";
import { signIn } from "../actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const { next = "/dashboard", error } = await searchParams;

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">Log in to continue learning.</p>
      {error && <p className="error">{error}</p>}
      <AuthForm action={signIn} submitLabel="Log in">
        <input type="hidden" name="next" value={next} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
      </AuthForm>
      <p className="muted small">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
