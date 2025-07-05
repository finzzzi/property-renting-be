import { Router } from "express";
import {
  searchProperties,
  getPropertyDetailById,
  getPropertyCalendar,
  getPropertyCategoriesByTenant,
  getUserOwnedProperties,
} from "../controllers/propertyController";
import {
  authenticateUser,
  requireTenantRole,
} from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/search", searchProperties);
router.get("/detail", getPropertyDetailById);
router.get("/:propertyId/calendar", getPropertyCalendar);
router.get("/categories", getPropertyCategoriesByTenant);

// Protected routes - require authentication
router.get(
  "/my-properties",
  authenticateUser,
  requireTenantRole,
  getUserOwnedProperties
);

export default router;
