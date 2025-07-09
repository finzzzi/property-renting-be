import { Router } from "express";
import {
  searchProperties,
  getPropertyDetailById,
  getPropertyCalendar,
  getPropertyCategoriesByTenant,
  createNewCategory,
  updateCategoryById,
  deleteCategoryById,
  getUserOwnedProperties,
  createNewProperty,
  getOwnedPropertyDetailById,
  updatePropertyById,
  getPropertyForEditForm,
  createNewRoom,
  getOwnedRoomsList,
  getRoomForEditForm,
  updateRoomById,
  deletePropertyById,
  deleteRoomById,
} from "../controllers/propertyController";
import {
  getRoomUnavailabilities,
  createRoomUnavailabilityEntry,
  deleteRoomUnavailabilityEntry,
} from "../controllers/roomUnavailabilityController";
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

router.delete(
  "/categories/delete/:category_id",
  authenticateUser,
  requireTenantRole,
  deleteCategoryById
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

router.delete(
  "/delete/:property_id",
  authenticateUser,
  requireTenantRole,
  deletePropertyById
);

router.delete(
  "/rooms/delete/:room_id",
  authenticateUser,
  requireTenantRole,
  deleteRoomById
);

// Room Unavailabilities routes
router.get(
  "/rooms/unavailabilities",
  authenticateUser,
  requireTenantRole,
  getRoomUnavailabilities
);

router.post(
  "/rooms/unavailabilities",
  authenticateUser,
  requireTenantRole,
  createRoomUnavailabilityEntry
);

router.delete(
  "/rooms/unavailabilities/:id",
  authenticateUser,
  requireTenantRole,
  deleteRoomUnavailabilityEntry
);

export default router;
