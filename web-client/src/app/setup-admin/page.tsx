"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineShieldCheck,
} from "react-icons/hi";

export default function SetupAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    secretKey: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pembuatan akun admin gagal");
      }

      // Store user data in localStorage
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      toast.success("Akun admin berhasil dibuat");

      // Redirect ke admin dashboard
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (error) {
      console.error("Setup admin error:", error);
      toast.error(
        error instanceof Error ? error.message : "Pembuatan akun admin gagal",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo dan Header */}
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <HiOutlineShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Setup Akun Admin</h2>
          <p className="mt-2 text-zinc-400">
            Buat akun admin pertama untuk mengelola sistem
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-lg bg-zinc-900/70 p-6 shadow-md border border-zinc-800">
            {/* Nama */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-300"
              >
                Nama
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nama Admin"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="email@admin.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Password minimal 8 karakter"
                  minLength={8}
                />
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <label
                htmlFor="secretKey"
                className="block text-sm font-medium text-zinc-300"
              >
                Kunci Rahasia
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineKey className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="secretKey"
                  type="password"
                  required
                  value={formData.secretKey}
                  onChange={(e) =>
                    setFormData({ ...formData, secretKey: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg
                    bg-zinc-900 text-white placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Kunci rahasia untuk membuat admin"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Kunci rahasia diperlukan untuk membuat akun admin
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Buat Akun Admin"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-400">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                Login sekarang
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
