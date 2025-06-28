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
    <div className="flex min-h-screen bg-zinc-900 text-white">
      <AdminSidebar />
      <main className="flex-1 p-8 ml-64">
        {children} {/* Page content will be injected here */}
      </main>
    </div>
  );
}
