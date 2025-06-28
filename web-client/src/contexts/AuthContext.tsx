"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for stored user data on mount
    console.log("AuthContext: Initializing...");
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("authToken");

      console.log("Stored user:", !!storedUser);
      console.log("Stored token:", !!storedToken);

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log(
          "AuthContext: User restored from localStorage",
          userData.email,
        );
      }
    } catch (error) {
      console.error("AuthContext: Error restoring user data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    }
  }, []);

  const login = async (token: string, userData: User) => {
    try {
      console.log("AuthContext: Attempting login for", userData.email);

      // Detect environment
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const currentPort = window.location.port;
      const baseUrl = isLocalhost
        ? ""
        : `${window.location.protocol}//${window.location.hostname}${currentPort ? `:${currentPort}` : ""}`;

      console.log("Environment detected:", { isLocalhost, baseUrl });

      // Store token using API route
      try {
        const response = await fetch(`${baseUrl}/api/auth/set-cookie`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to set cookie via API, continuing with localStorage only",
          );
        }
      } catch (cookieError) {
        console.warn("Cookie API error (continuing):", cookieError);
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("authToken", token);
      setUser(userData);

      console.log("AuthContext: User logged in successfully", userData.email);
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("AuthContext: Logging out user...");

      // Clear local data first
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      setUser(null);

      // Detect environment
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const currentPort = window.location.port;
      const baseUrl = isLocalhost
        ? ""
        : `${window.location.protocol}//${window.location.hostname}${currentPort ? `:${currentPort}` : ""}`;

      // Try to clear cookie via API (non-blocking)
      try {
        await fetch(`${baseUrl}/api/auth/clear-cookie`, {
          method: "POST",
        });
        console.log("AuthContext: Cookie cleared via API");
      } catch (cookieError) {
        console.warn(
          "AuthContext: Cookie clear API error (non-critical):",
          cookieError,
        );
      }

      console.log("AuthContext: User logged out, redirecting to login");

      // Use Next.js router for localhost, direct redirect for production
      if (isLocalhost) {
        // Small delay to ensure state is cleared
        setTimeout(() => {
          router.push("/login");

          // Fallback if router doesn't work
          setTimeout(() => {
            if (window.location.pathname !== "/login") {
              console.log("AuthContext: Router failed, using direct redirect");
              window.location.href = "/login";
            }
          }, 1000);
        }, 100);
      } else {
        // For production/VPS, use direct redirect
        const loginUrl = `${baseUrl}/login`;
        console.log("AuthContext: Production redirect to:", loginUrl);
        window.location.href = loginUrl;
      }
    } catch (error) {
      console.error("AuthContext: Logout error:", error);

      // Ensure cleanup even on error
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      setUser(null);

      // Force redirect
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const currentPort = window.location.port;
      const loginUrl = isLocalhost
        ? "/login"
        : `${window.location.protocol}//${window.location.hostname}${currentPort ? `:${currentPort}` : ""}/login`;

      console.log("AuthContext: Emergency redirect to:", loginUrl);
      window.location.href = loginUrl;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
