import { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Interface untuk edit user data
interface EditUserData {
  name?: string;
  phone?: string;
  address?: string;
}

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, phone, address }: EditUserData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    // Validasi input - minimal ada satu field yang akan diupdate
    if (!name && !phone && !address) {
      res.status(400).json({
        success: false,
        message:
          "Minimal harus ada satu field yang akan diupdate (nama, phone, atau alamat)",
      });
      return;
    }

    // Validasi format phone jika ada
    if (phone !== undefined && phone !== null && phone !== "") {
      const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid",
        });
        return;
      }
    }

    // Validasi nama jika ada
    if (name !== undefined && name !== null && name.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Nama tidak boleh kosong",
      });
      return;
    }

    // Check apakah user exist
    const existingUser = await prisma.public_users.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
      return;
    }

    // Build data untuk update (hanya field yang diberikan)
    const updateData: EditUserData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    // Update user data
    const updatedUser = await prisma.public_users.update({
      where: { id: userId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        profile_picture: true,
        updated_at: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengupdate profile",
    });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    const user = await prisma.public_users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        profile_picture: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Data profile berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data profile",
    });
  }
};
