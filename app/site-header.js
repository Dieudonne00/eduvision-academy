import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { signOut } from "./(auth)/actions";
import MobileNav from "./mobile-nav";
import logoMark from "@/public/images/logo-mark.png";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-us", label: "Why us" },
  { href: "/contact", label: "Contact" },
];

export default async function SiteHeader() {
  const session = await getSession();
  const isAdmin = session?.profile?.role === "admin";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="EduVision Academy home">
          <Image src={logoMark} alt="" width={48} height={32} priority />
          <span className="brand-text">
            <strong>EDUVISION</strong>
            <small>ACADEMY</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <div className="header-actions">
          {session ? (
            <>
              {isAdmin && <Link href="/admin" className="nav-link">Admin</Link>}
              <Link href="/dashboard" className="btn btn-primary btn-sm">My learning</Link>
              <form action={signOut}>
                <button type="submit" className="link-btn">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>

        <MobileNav links={links} signedIn={Boolean(session)} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
