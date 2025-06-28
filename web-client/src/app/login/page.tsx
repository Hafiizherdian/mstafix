"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { api } from "@/utils/api";
import { storeToken, storeUser } from "@/utils/auth";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Check for expired session parameter
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("expired") === "true") {
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hapus dulu data otentikasi sebelumnya untuk mencegah konflik
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Membersihkan cookie yang mungkin ada
      await fetch("/api/auth/clear-cookie", {
        method: "POST",
      }).catch((err) => console.error("Error saat membersihkan cookie:", err));

      // Kirim request login langsung tanpa helper
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed:", data);
        throw new Error(data.error || "Login gagal");
      }

      console.log("Login berhasil:", data.user?.email);

      // Cek token ada
      const token = data.token || data.accessToken;
      if (!token) {
        console.error("Token tidak ditemukan dalam respons");
        throw new Error("Token tidak ditemukan dalam respons");
      }

      // Cek user data ada
      if (!data.user || !data.user.id || !data.user.email) {
        console.error("Data user tidak lengkap:", data.user);
        throw new Error("Data pengguna tidak lengkap");
      }

      // Log untuk debugging
      console.log("LOGIN SUCCESS - USER DATA:", {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });

      // Simpan token ke localStorage
      localStorage.setItem("authToken", token);

      // Simpan data user ke localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Juga simpan token di cookie melalui API route
      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      console.log("Token disimpan di cookie dan localStorage");
      console.log("User data tersimpan:", data.user);

      // Tampilkan pesan sukses
      toast.success(`Login berhasil sebagai ${data.user.name}`);

      // Tunggu sebentar untuk memastikan cookie tersimpan
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Refresh router untuk memastikan middleware mendapatkan cookie yang baru
      router.refresh();

      // Tunggu refresh selesai
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Tentukan halaman redirect berdasarkan role pengguna
      const redirectPath =
        data.user.role === "ADMIN" ? "/admin" : "/generate-soal";
      console.log(
        `Mengarahkan pengguna dengan role ${data.user.role} ke ${redirectPath}`,
      );

      // Untuk VPS, gunakan window.location dengan base URL yang benar
      const isVPS = window.location.hostname !== "localhost";
      const baseUrl = isVPS
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : "";
      const fullRedirectUrl = isVPS
        ? `${baseUrl}${redirectPath}`
        : redirectPath;

      try {
        // Gunakan router push dulu, fallback ke window.location jika gagal
        router.push(redirectPath);
        setTimeout(() => {
          if (window.location.pathname !== redirectPath) {
            console.log("Router push failed, using window.location fallback");
            window.location.href = fullRedirectUrl;
          }
        }, 1000);
      } catch (error) {
        console.log("Router error, using window.location:", error);
        window.location.href = fullRedirectUrl;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo dan Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-10 w-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <HiOutlineLightningBolt className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">MSTA</h1>
          </div>
          <h2 className="text-3xl font-bold text-white">Login ke Akun Anda</h2>
          <p className="mt-2 text-zinc-400">
            Masuk untuk mulai membuat dan mengelola soal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
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
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Masukkan email Anda"
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
                    focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Masukkan password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                shadow-sm text-sm font-medium text-black bg-cyan-500 hover:bg-cyan-600
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-400">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-medium text-cyan-500 hover:text-cyan-400"
              >
                Daftar sekarang
              </Link>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Admin pertama kali?{" "}
              <Link
                href="/setup-admin"
                className="font-medium text-purple-500 hover:text-purple-400"
              >
                Setup akun admin
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
