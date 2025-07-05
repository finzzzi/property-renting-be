import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabaseConfig";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

// Module augmentation untuk extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        name?: string;
        role?: string;
      };
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token authorization diperlukan",
      });
      return;
    }

    // Verifikasi token dengan Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah expired",
      });
      return;
    }

    // Ambil data user dari database public.users
    const userData = await prisma.public_users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile_picture: true,
        phone: true,
        address: true,
      },
    });

    if (!userData) {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan di database",
      });
      return;
    }

    // Simpan data user ke req object
    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || "traveler",
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat autentikasi",
    });
  }
};

// Middleware untuk cek role tenant
export const requireTenantRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "tenant") {
    res.status(403).json({
      success: false,
      message: "Akses ditolak. Hanya tenant yang dapat mengakses endpoint ini",
    });
    return;
  }
  next();
};
