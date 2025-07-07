import express from "express";
import { pictureController } from "../controllers/pictureController";
import { authenticateUser } from "../middleware/authMiddleware";
import {
  uploadSingle,
  handleUploadError,
  validateFileExists,
} from "../middleware/uploadMiddleware";

const router = express.Router();

// === PROPERTY PICTURES ROUTES ===

// Upload property picture
router.post(
  "/properties/:propertyId",
  authenticateUser,
  uploadSingle,
  validateFileExists,
  pictureController.uploadPropertyPicture.bind(pictureController)
);

// Get property pictures
router.get(
  "/properties/:propertyId",
  pictureController.getPropertyPictures.bind(pictureController)
);

// Delete property picture
router.delete(
  "/property/:pictureId",
  authenticateUser,
  pictureController.deletePropertyPicture.bind(pictureController)
);

// === ROOM PICTURES ROUTES ===

// Upload room picture
router.post(
  "/rooms/:roomId",
  authenticateUser,
  uploadSingle,
  validateFileExists,
  pictureController.uploadRoomPicture.bind(pictureController)
);

// Get room pictures
router.get(
  "/rooms/:roomId",
  pictureController.getRoomPictures.bind(pictureController)
);

// Delete room picture
router.delete(
  "/room/:pictureId",
  authenticateUser,
  pictureController.deleteRoomPicture.bind(pictureController)
);

// === LIST ALL PICTURES ROUTES ===

// Get all property pictures from user's properties
router.get(
  "/all-property-pictures",
  authenticateUser,
  pictureController.getAllPropertyPictures.bind(pictureController)
);

// Get all room pictures from user's properties
router.get(
  "/all-room-pictures",
  authenticateUser,
  pictureController.getAllRoomPictures.bind(pictureController)
);

// === HELPER ROUTES ===

// Get properties list (for dropdown)
router.get(
  "/properties/list",
  authenticateUser,
  pictureController.getPropertiesList.bind(pictureController)
);

// Get rooms list for specific property (for dropdown)
router.get(
  "/properties/:propertyId/rooms/list",
  authenticateUser,
  pictureController.getRoomsList.bind(pictureController)
);

export default router;
