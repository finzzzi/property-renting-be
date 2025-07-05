import { Router } from "express";
import {
  searchProperties,
  getPropertyDetailById,
  getPropertyCalendar,
  getPropertyCategoriesByTenant,
  createNewCategory,
  updateCategoryById,
  getUserOwnedProperties,
  createNewProperty,
  getOwnedPropertyDetailById,
  updatePropertyById,
  getPropertyForEditForm,
  createNewRoom,
  getOwnedRoomsList,
  getRoomForEditForm,
  updateRoomById,
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
router.post(
  "/categories/create",
  authenticateUser,
  requireTenantRole,
  createNewCategory
);

router.put(
  "/categories/update/:category_id",
  authenticateUser,
  requireTenantRole,
  updateCategoryById
);

router.get(
  "/my-properties",
  authenticateUser,
  requireTenantRole,
  getUserOwnedProperties
);

router.get(
  "/my-property-detail",
  authenticateUser,
  requireTenantRole,
  getOwnedPropertyDetailById
);

router.post("/create", authenticateUser, requireTenantRole, createNewProperty);

router.get(
  "/update/:property_id",
  authenticateUser,
  requireTenantRole,
  getPropertyForEditForm
);

router.put(
  "/update/:property_id",
  authenticateUser,
  requireTenantRole,
  updatePropertyById
);

router.post(
  "/rooms/create",
  authenticateUser,
  requireTenantRole,
  createNewRoom
);

router.get(
  "/rooms/my-rooms",
  authenticateUser,
  requireTenantRole,
  getOwnedRoomsList
);

router.get(
  "/rooms/update/:room_id",
  authenticateUser,
  requireTenantRole,
  getRoomForEditForm
);

router.put(
  "/rooms/update/:room_id",
  authenticateUser,
  requireTenantRole,
  updateRoomById
);

export default router;
