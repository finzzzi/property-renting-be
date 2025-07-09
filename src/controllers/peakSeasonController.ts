import { NextFunction, Request, Response } from "express";
import "../middleware/authMiddleware";
import {
  validateListPeakSeasonParams,
  validateCreatePeakSeasonParams,
  validateUpdatePeakSeasonParams,
  validateDeletePeakSeasonParams,
} from "../services/propertyValidation";
import {
  getPeakSeasonRatesByRoom,
  createPeakSeasonRate,
  updatePeakSeasonRateById,
  deletePeakSeasonRateById,
} from "../services/propertyQuery";
import { sendErrorResponse } from "../services/responseHelper";

export const getPeakSeasonRates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = validateListPeakSeasonParams(req.query, res);
    if (!validated) return;
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }
    const result = await getPeakSeasonRatesByRoom(validated, userId);
    if (!result.success) {
      res.status(404).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const createPeakSeasonRateEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = validateCreatePeakSeasonParams(req.body, res);
    if (!validated) return;
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }
    const result = await createPeakSeasonRate(validated, userId);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res
      .status(201)
      .json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const updatePeakSeasonRateEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedParams = validateUpdatePeakSeasonParams(
      req.params,
      req.body,
      res
    );
    if (!validatedParams) return;
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }
    const result = await updatePeakSeasonRateById(
      validatedParams,
      validatedParams,
      userId
    );
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const deletePeakSeasonRateEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = validateDeletePeakSeasonParams(req.params, res);
    if (!validated) return;
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }
    const result = await deletePeakSeasonRateById(validated, userId);
    if (!result.success) {
      res.status(404).json({ success: false, message: result.message });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};
