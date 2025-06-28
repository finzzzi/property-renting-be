import { NextFunction, Request, Response } from "express";
import {
  validateSearchParams,
  validatePagination,
  validateDetailParams,
} from "../services/propertyValidation";
import {
  buildWhereClause,
  getAvailableProperties,
  getPropertyDetail,
} from "../services/propertyQuery";
import {
  processRoomsAvailability,
  transformPropertyData,
  sortProperties,
  applyPagination,
  ProcessedProperty,
  processPropertyDetail,
} from "../services/propertyProcessor";
import {
  sendSuccessResponse,
  sendEmptyResponse,
  sendErrorResponse,
  sendPropertyDetailResponse,
  sendPropertyNotFoundResponse,
  sendNoAvailableRoomsResponse,
} from "../services/responseHelper";

export const searchProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateSearchParams(req.query, res);
    if (!validatedParams) return;

    const { pageNumber, sortBy, sortOrder } = validatedParams;

    // Build where clause untuk query
    const whereClause = buildWhereClause(validatedParams);

    // Query properties yang tersedia
    const availableProperties = await getAvailableProperties(
      whereClause,
      validatedParams
    );

    // Process data properties
    const processedProperties: ProcessedProperty[] = [];

    for (const property of availableProperties) {
      const availableRooms = processRoomsAvailability(property);

      // Jika property memiliki room yang tersedia
      if (availableRooms.length > 0) {
        const processedProperty = transformPropertyData(
          property,
          availableRooms
        );
        processedProperties.push(processedProperty);
      }
    }

    // Apply sorting jika diminta
    const sortedProperties = sortProperties(
      processedProperties,
      sortBy,
      sortOrder
    );

    // Cek apakah ada property yang tersedia
    if (sortedProperties.length === 0) {
      sendEmptyResponse(res, pageNumber);
      return;
    }

    // Apply pagination
    const paginatedResult = applyPagination(sortedProperties, pageNumber);

    // Validasi pagination
    if (
      !validatePagination(
        pageNumber,
        paginatedResult.pagination.total_pages,
        res
      )
    ) {
      return;
    }

    // Extract categories untuk response
    const categories = availableProperties.map(
      (property) => property.property_categories
    );

    // Send success response
    sendSuccessResponse(
      res,
      paginatedResult.data,
      categories,
      paginatedResult.pagination
    );
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const getPropertyDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateDetailParams(req.query, res);
    if (!validatedParams) return;

    // Query property detail
    const property = await getPropertyDetail(validatedParams);

    // Cek apakah property ditemukan
    if (!property) {
      sendPropertyNotFoundResponse(res);
      return;
    }

    // Process property detail
    const processedProperty = processPropertyDetail(property);

    // Cek apakah ada room yang tersedia
    if (processedProperty.available_rooms.length === 0) {
      sendNoAvailableRoomsResponse(res);
      return;
    }

    // Send success response
    sendPropertyDetailResponse(res, processedProperty);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};
