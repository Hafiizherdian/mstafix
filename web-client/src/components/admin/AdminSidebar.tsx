"use client";
import { LayoutDashboard, Users, FileQuestion, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { 
    href: "/admin", 
    label: "Dashboard",
    icon: LayoutDashboard 
  },
  { 
    href: "/admin/users", 
    label: "Kelola Pengguna",
    icon: Users 
  },
  { 
    href: "/admin/questions", 
    label: "Kelola Soal",
    icon: FileQuestion 
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fungsi logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // kalau pakai token
    router.push("/login");
  };

  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        id="menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-cyan-500"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        id="admin-sidebar"
        className={cn(
          "bg-gradient-to-b from-zinc-900 to-zinc-800 border-r border-zinc-700 min-h-screen w-64 p-6 flex flex-col fixed top-0 left-0 z-30 transition-transform duration-300 ease-in-out",
          isOpen ? 'transform translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          MSTA Admin
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Panel Monitoring</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-zinc-700 text-white shadow-lg"
                  : "text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mr-3 transition-colors",
                isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-cyan-400"
              )} />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-zinc-700">
        <button 
        onClick={handleLogout}
        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/30 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          Keluar
        </button>
      </div>
      </aside>
    </>
  );
}
