"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Kelola Pengguna" },
  { href: "/admin/questions", label: "Kelola Soal" },
  { href: "/admin/generated-questions", label: "Soal Hasil Generate" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-zinc-900 border-r border-zinc-800 min-h-screen w-64 p-6 flex flex-col gap-4 fixed top-0 left-0 z-20">
      <div className="mb-8">
        <span className="text-2xl font-bold text-cyan-400">MSTAFIX Admin</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded text-lg font-medium transition-all ${
              pathname === item.href
                ? "bg-cyan-500 text-white"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-cyan-400"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
