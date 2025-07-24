// Admin Root Layout
// This layout wraps all pages under the /admin route segment.
// It provides a consistent structure with the AdminSidebar.

import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen max-w-full bg-zinc-950 text-white selection:bg-cyan-500/50 selection:text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-grid-zinc-800/20 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 to-zinc-900/90" />
      </div>
      
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0 md:ml-64 transition-all duration-300 w-full">
        <div className="max-w-7xl mx-auto">
          {children} {/* Page content will be injected here */}
        </div>
      </main>
    </div>
  );
}
