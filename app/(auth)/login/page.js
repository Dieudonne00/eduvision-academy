import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const enrolling = next.startsWith("/checkout/");
  if (await getSession()) redirect(next);

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">{enrolling ? "Log in to continue your enrollment." : "Log in to continue learning."}</p>
      {params.error && <p className="error">{params.error}</p>}
      <LoginForm next={next} />
      <p className="muted small">
        New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </div>
  );
}
