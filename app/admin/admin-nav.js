"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/_components/icon";

const items = [
  { href: "/admin", label: "Overview", icon: "book", exact: true },
  { href: "/admin/enrollments", label: "Payments", icon: "wallet" },
  { href: "/admin/courses", label: "Courses & lessons", icon: "play" },
  { href: "/admin/students", label: "Students", icon: "users" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
            <Icon name={item.icon} size={18} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
