import Link from "next/link";
import { getSession } from "@/lib/auth";
import { signOut } from "./(auth)/actions";

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="site-header">
      <Link href="/" className="brand">EduVision Academy</Link>
      <nav>
        {session ? (
          <>
            {session.profile?.role === "admin" && <Link href="/admin">Admin</Link>}
            <Link href="/dashboard">My learning</Link>
            <form action={signOut}>
              <button type="submit" className="link-btn">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn btn-small">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
