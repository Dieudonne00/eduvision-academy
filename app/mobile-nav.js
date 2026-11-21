"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./_components/icon";
import { signOut } from "./(auth)/actions";

// Hamburger menu for phones; the desktop nav is hidden below 900px.
export default function MobileNav({ links, signedIn, isAdmin, name }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? "close" : "menu"} />
      </button>

      {open && (
        <div className="mobile-panel">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <hr />
          {signedIn ? (
            <>
              {name && <span className="mobile-who">Signed in as <strong>{name}</strong></span>}
              {isAdmin && <Link href="/admin">Admin</Link>}
              <Link href="/dashboard" className="btn btn-primary">My learning</Link>
              <form action={signOut}>
                <button type="submit" className="btn btn-ghost btn-block mobile-logout">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="btn btn-primary">Get started</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
