import { NextFunction, Request, Response } from "express";
// Import untuk memuat module augmentation Express Request interface
import "../middleware/authMiddleware";
import {
  validateListRoomUnavailParams,
  validateCreateUnavailabilityParams,
  validateDeleteUnavailabilityParams,
} from "../services/propertyValidation";
import {
  getRoomUnavailabilitiesByRoom,
  createRoomUnavailability,
  deleteRoomUnavailabilityById,
} from "../services/propertyQuery";
import { sendErrorResponse } from "../services/responseHelper";

export const getRoomUnavailabilities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateListRoomUnavailParams(req.query, res);
    if (!validatedParams) return;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    // Query room unavailabilities
    const result = await getRoomUnavailabilitiesByRoom(validatedParams, userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const createRoomUnavailabilityEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateCreateUnavailabilityParams(req.body, res);
    if (!validatedParams) return;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    // Create room unavailability
    const result = await createRoomUnavailability(validatedParams, userId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const deleteRoomUnavailabilityEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateDeleteUnavailabilityParams(req.params, res);
    if (!validatedParams) return;

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
      return;
    }

    // Delete room unavailability
    const result = await deleteRoomUnavailabilityById(validatedParams, userId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: result.message,
      });
      return;
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};
