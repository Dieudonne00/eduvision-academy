"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/app/_components/icon";

const items = [
  { href: "/admin", label: "Overview", icon: "book", exact: true },
  { href: "/admin/payments", label: "Payments", icon: "wallet", badge: "review" },
  { href: "/admin/courses", label: "Courses", icon: "play" },
  { href: "/admin/students", label: "Students", icon: "users" },
  { href: "/admin/settings", label: "Settings", icon: "shield" },
];

export default function AdminNav({ toReview = 0 }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
            <Icon name={item.icon} size={18} /> {item.label}
            {item.badge === "review" && toReview > 0 && <span className="tab-count">{toReview}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
