import { NextFunction, Request, Response } from "express";
// Import untuk memuat module augmentation Express Request interface
import "../middleware/authMiddleware";
import {
  validateSearchParams,
  validatePagination,
  validateDetailParams,
  validateCalendarParams,
  validateCategoryParams,
} from "../services/propertyValidation";
import {
  buildWhereClause,
  getAvailableProperties,
  getPropertyDetail,
  getPropertyForCalendar,
  getPropertyCategories,
  getUserProperties,
} from "../services/propertyQuery";
import {
  processRoomsAvailability,
  transformPropertyData,
  sortProperties,
  applyPagination,
  ProcessedProperty,
  processPropertyDetail,
  processCalendarData,
} from "../services/propertyProcessor";
import {
  sendSuccessResponse,
  sendEmptyResponse,
  sendErrorResponse,
  sendPropertyDetailResponse,
  sendPropertyNotFoundResponse,
  sendNoAvailableRoomsResponse,
  sendCalendarResponse,
  sendCalendarNotFoundResponse,
  sendCategoriesSuccessResponse,
  sendCategoriesEmptyResponse,
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

export const getPropertyCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateCalendarParams(req.query, req.params, res);
    if (!validatedParams) return;

    const { propertyId, year, month } = validatedParams;

    // Query property dengan rooms untuk calendar
    const property = await getPropertyForCalendar(propertyId, year, month);

    // Cek apakah property ditemukan
    if (!property) {
      sendCalendarNotFoundResponse(res);
      return;
    }

    // Process calendar data
    const calendarData = processCalendarData(property, year, month, propertyId);

    // Send success response
    sendCalendarResponse(res, calendarData);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const getPropertyCategoriesByTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validasi input parameters
    const validatedParams = validateCategoryParams(req.query, res);
    if (!validatedParams) return;

    // Query property categories
    const categories = await getPropertyCategories(validatedParams);

    // Cek apakah ada categories yang ditemukan
    if (categories.length === 0) {
      sendCategoriesEmptyResponse(res);
      return;
    }

    // Send success response
    sendCategoriesSuccessResponse(res, categories);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

export const getUserOwnedProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
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

    // Query properties milik user
    const properties = await getUserProperties(userId);

    // Cek apakah user memiliki properties
    if (properties.length === 0) {
      res.status(200).json({
        success: true,
        message: "Anda belum memiliki property",
        data: [],
        total: 0,
      });
      return;
    }

    // Process data properties
    const processedProperties = properties.map((property) => ({
      id: property.id,
      name: property.name,
      description: property.description,
      location: property.location,
      created_at: property.created_at,
      updated_at: property.updated_at,
      category: property.property_categories
        ? {
            id: property.property_categories.id,
            name: property.property_categories.name,
          }
        : null,
      city: property.cities
        ? {
            id: property.cities.id,
            name: property.cities.name,
            type: property.cities.type,
          }
        : null,
      pictures: property.property_pictures.map((pic) => ({
        id: pic.id,
        file_path: pic.file_path,
        is_main: pic.is_main,
      })),
      rooms: property.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        price: room.price,
        description: room.description,
        max_guests: room.max_guests,
        quantity: room.quantity,
        picture: room.picture,
        created_at: room.created_at,
        updated_at: room.updated_at,
      })),
      room_count: property._count.rooms,
    }));

    res.status(200).json({
      success: true,
      message: "Properties berhasil ditemukan",
      data: processedProperties,
      total: processedProperties.length,
    });
  } catch (error) {
    console.error("Error in getUserOwnedProperties:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
