import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh-token-secret";
const ADMIN_SECRET_KEY =
  process.env.ADMIN_CREATION_KEY || "rahasia-admin-msta-2024";
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "7d";

interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role?: string;
  adminSecretKey?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Simpel helper function untuk generate tokens
const generateTokens = async (user: User) => {
  try {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Failed to generate authentication tokens");
  }
};

export const register = async (userData: CreateUserDTO) => {
  const { email, password, name, role, adminSecretKey } = userData;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    // Tentukan role user
    let userRole: Role = Role.USER;

    // Jika mencoba membuat admin, validasi secret key
    if (role && role.toUpperCase() === "ADMIN") {
      if (!adminSecretKey || adminSecretKey !== ADMIN_SECRET_KEY) {
        throw new Error("Kunci rahasia admin tidak valid");
      }
      userRole = Role.ADMIN;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
    throw new Error("Registration failed");
  }
};

export const login = async ({
  email,
  password,
}: Pick<CreateUserDTO, "email" | "password">) => {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Email atau password salah");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error("Authentication failed");
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!existingToken) {
      throw new Error("Invalid refresh token");
    }

    if (existingToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: existingToken.id },
      });
      throw new Error("Refresh token expired");
    }

    // Delete old refresh token and generate new tokens
    await prisma.refreshToken.delete({
      where: { id: existingToken.id },
    });

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      {
        id: existingToken.user.id,
        email: existingToken.user.email,
        name: existingToken.user.name,
        role: existingToken.user.role,
      },
    );

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error("Token refresh error:", error);
    if (error instanceof Error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
    throw new Error("Token refresh failed");
  }
};

export const logout = async (refreshToken: string) => {
  try {
    // Delete the refresh token to invalidate the session
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    if (error instanceof Error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
    throw new Error("Logout failed");
  }
};
