"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineCollection,
  HiOutlineLightningBolt,
  HiOutlineEye,
} from "react-icons/hi";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <HiOutlineHome className="w-5 h-5" />,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: <HiOutlineUsers className="w-5 h-5" />,
  },
  {
    name: "Bank Soal",
    href: "/admin/questions",
    icon: <HiOutlineCollection className="w-5 h-5" />,
  },
  {
    name: "Generasi Soal",
    href: "/admin/analytics",
    icon: <HiOutlineLightningBolt className="w-5 h-5" />,
  },
  {
    name: "Monitoring",
    href: "/admin/monitoring",
    icon: <HiOutlineEye className="w-5 h-5" />,
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: <HiOutlineBell className="w-5 h-5" />,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <HiOutlineCog className="w-5 h-5" />,
  },
];

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#00778455,transparent)]"></div>
      </div>

      <div className="relative z-10 lg:flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900/95 border-r border-zinc-800 backdrop-blur-sm transform transition-transform duration-300 ease-in-out
          lg:relative lg:z-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <HiOutlineSparkles className="w-8 h-8 text-cyan-400" />
              <h1 className="text-xl font-bold text-white">MSTA Admin</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 shadow-[0_0_10px_rgba(0,206,209,0.3)]"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white border border-transparent hover:border-zinc-700"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="mr-3">{item.icon}</div>
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-900/20 text-cyan-400 border border-cyan-800/50">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User profile section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,206,209,0.3)]">
                  <span className="text-black text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-zinc-400">{user?.role || "ADMIN"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <HiOutlineMenu className="w-6 h-6" />
                </button>
                <div className="ml-4 lg:ml-0">
                  <h2 className="text-lg font-semibold text-white">
                    {title || navigation.find((item) => item.href === pathname)?.name ||
                      "Dashboard"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(0,206,209,0.6)]"></span>
                </button>

                {/* User menu */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,206,209,0.3)]">
                      <span className="text-black text-sm font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-white">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {user?.email || "admin@msta.com"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="py-6">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
