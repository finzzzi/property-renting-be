import { Router } from "express";
import {
  updateUserProfile,
  getUserProfile,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// GET /users/profile - Mendapatkan data profile user yang login
router.get("/profile", authenticateUser, getUserProfile);

// PUT /users/profile - Update profile user (nama, phone, alamat)
router.put("/profile", authenticateUser, updateUserProfile);

export default router;
