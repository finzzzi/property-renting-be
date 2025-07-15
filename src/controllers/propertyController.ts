import { NextFunction, Request, Response } from "express";
// Import untuk memuat module augmentation Express Request interface
import "../middleware/authMiddleware";
import {
  validateSearchParams,
  validatePagination,
  validateDetailParams,
  validateCalendarParams,
  validateCategoryParams,
  validateCreateCategoryParams,
  validateUpdateCategoryParams,
  validateDeleteCategoryParams,
  validateCreatePropertyParams,
  validateMyPropertiesParams,
  validateOwnedPropertyDetailParams,
  validateUpdatePropertyParams,
  validatePropertyEditParams,
  validateCreateRoomParams,
  validateOwnedRoomsParams,
  validateRoomEditParams,
  validateUpdateRoomParams,
  validateDeletePropertyParams,
  validateDeleteRoomParams,
} from "../services/propertyValidation";
import {
  buildWhereClause,
  getAvailableProperties,
  getPropertyDetail,
  getPropertyForCalendar,
  getPropertyCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUserProperties,
  createProperty,
  getOwnedPropertyDetail,
  updateProperty,
  getPropertyForEdit,
  createRoom,
  getOwnedRooms,
  getRoomForEdit,
  updateRoom,
  deletePropertyById as deletePropertyQuery,
  deleteRoomById as deleteRoomQuery,
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

export const createNewCategory = async (
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

    // Validasi input parameters
    const validatedParams = validateCreateCategoryParams(req.body, res);
    if (!validatedParams) return;

    // Verifikasi bahwa tenant_id yang dikirim sama dengan user yang login
    if (validatedParams.tenantId !== userId) {
      res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses untuk membuat kategori untuk tenant lain",
      });
      return;
    }

    // Create category baru
    const newCategory = await createCategory(validatedParams);

    if (!newCategory) {
      res.status(400).json({
        success: false,
        message: "Kategori dengan nama tersebut sudah ada",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Kategori berhasil dibuat",
      data: {
        id: newCategory.id,
        name: newCategory.name,
        tenant_id: newCategory.tenant_id,
        created_at: newCategory.created_at,
      },
    });
  } catch (error) {
    console.error("Error in createNewCategory:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateCategoryById = async (
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

    // Validasi input parameters
    const validatedParams = validateUpdateCategoryParams(
      req.params,
      req.body,
      res
    );
    if (!validatedParams) return;

    // Update category
    const updatedCategory = await updateCategory(validatedParams, userId);

    if (!updatedCategory) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    if (updatedCategory === "duplicate") {
      res.status(400).json({
        success: false,
        message: "Kategori dengan nama tersebut sudah ada",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Kategori berhasil diperbarui",
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        tenant_id: updatedCategory.tenant_id,
        updated_at: updatedCategory.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in updateCategoryById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteCategoryById = async (
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

    // Validasi input parameters
    const validatedParams = validateDeleteCategoryParams(req.params, res);
    if (!validatedParams) return;

    // Delete category
    const deletedCategory = await deleteCategory(validatedParams, userId);

    if (!deletedCategory) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    if (deletedCategory === "in_use") {
      res.status(400).json({
        success: false,
        message:
          "Kategori tidak dapat dihapus karena sedang digunakan oleh property",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Kategori berhasil dihapus",
      data: {
        id: deletedCategory.id,
        name: deletedCategory.name,
      },
    });
  } catch (error) {
    console.error("Error in deleteCategoryById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
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

    // Validasi input parameters
    const validatedParams = validateMyPropertiesParams(req.query, res);
    if (!validatedParams) return;

    // Query properties milik user (dengan atau tanpa pagination)
    const result = await getUserProperties(userId, validatedParams);

    // Cek apakah user memiliki properties
    if (result.data.length === 0) {
      res.status(200).json({
        success: true,
        message: "Anda belum memiliki property",
        data: [],
        pagination: validatedParams.all ? undefined : result.pagination,
      });
      return;
    }

    // Process data properties
    const processedProperties = result.data.map((property) => ({
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
      total_rooms: property._count.rooms,
    }));

    res.status(200).json({
      success: true,
      message: "Properties berhasil ditemukan",
      data: processedProperties,
      pagination: validatedParams.all ? undefined : result.pagination,
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

export const createNewProperty = async (
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

    // Validasi input parameters
    const validatedParams = validateCreatePropertyParams(req.body, res);
    if (!validatedParams) return;

    // Create property baru
    const data = await createProperty(validatedParams, userId);

    res.status(201).json({
      success: true,
      message: "Property berhasil dibuat",
      data: data,
    });
  } catch (error) {
    console.error("Error in createNewProperty:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOwnedPropertyDetailById = async (
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

    // Validasi input parameters
    const validatedParams = validateOwnedPropertyDetailParams(req.query, res);
    if (!validatedParams) return;

    const { propertyId } = validatedParams;

    // Query property detail yang dimiliki user
    const property = await getOwnedPropertyDetail(propertyId, userId);

    // Cek apakah property ditemukan dan milik user
    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    // Process data property untuk response
    const processedProperty = {
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
      pictures: property.property_pictures.map((picture) => ({
        id: picture.id,
        file_path: picture.file_path,
        is_main: picture.is_main,
      })),
      rooms: property.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        price: room.price,
        description: room.description,
        max_guests: room.max_guests,
        quantity: room.quantity,
        picture:
          room.room_pictures.length > 0
            ? room.room_pictures[0].file_path
            : null,
        created_at: room.created_at,
        updated_at: room.updated_at,
      })),
      total_rooms: property._count.rooms,
    };

    res.status(200).json({
      success: true,
      message: "Detail property berhasil ditemukan",
      data: processedProperty,
    });
  } catch (error) {
    console.error("Error in getOwnedPropertyDetailById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPropertyForEditForm = async (
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

    // Validasi input parameters
    const validatedParams = validatePropertyEditParams(req.params, res);
    if (!validatedParams) return;

    // Query property untuk form edit
    const property = await getPropertyForEdit(validatedParams, userId);

    // Cek apakah property ditemukan dan milik user
    if (!property) {
      res.status(404).json({
        success: false,
        message: "Property tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    // Process data property untuk form edit (format yang lebih sederhana)
    const editFormData = {
      id: property.id,
      name: property.name,
      description: property.description,
      location: property.location,
      category_id: property.category_id,
      city_id: property.city_id,
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
    };

    res.status(200).json({
      success: true,
      message: "Data property untuk edit berhasil ditemukan",
      data: editFormData,
    });
  } catch (error) {
    console.error("Error in getPropertyForEditForm:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updatePropertyById = async (
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

    // Validasi input parameters
    const validatedParams = validateUpdatePropertyParams(
      req.params,
      req.body,
      res
    );
    if (!validatedParams) return;

    // Update property
    const updatedProperty = await updateProperty(validatedParams, userId);

    if (!updatedProperty) {
      res.status(404).json({
        success: false,
        message: "Property tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Property berhasil diperbarui",
      data: {
        id: updatedProperty.id,
        name: updatedProperty.name,
        description: updatedProperty.description,
        location: updatedProperty.location,
        category_id: updatedProperty.category_id,
        city_id: updatedProperty.city_id,
        updated_at: updatedProperty.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in updatePropertyById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createNewRoom = async (
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

    // Validasi input parameters
    const validatedParams = validateCreateRoomParams(req.body, res);
    if (!validatedParams) return;

    // Create room baru
    const newRoom = await createRoom(validatedParams, userId);

    if (!newRoom) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat room atau property tidak ditemukan",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Room berhasil dibuat",
      data: newRoom,
    });
  } catch (error) {
    console.error("Error in createNewRoom:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOwnedRoomsList = async (
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

    // Validasi input parameters
    const validatedParams = validateOwnedRoomsParams(req.query, res);
    if (!validatedParams) return;

    // Get owned rooms
    const result = await getOwnedRooms(validatedParams, userId);

    // Process data untuk response tanpa description
    const processedRooms = result.data.map((room) => ({
      id: room.id,
      name: room.name,
      price: room.price,
      max_guests: room.max_guests,
      quantity: room.quantity,
      property_id: room.property_id,
      property_name: room.properties?.name || null,
      created_at: room.created_at,
      updated_at: room.updated_at,
    }));

    res.status(200).json({
      success: true,
      message:
        result.data.length > 0
          ? "Daftar room berhasil ditemukan"
          : "Belum ada room yang ditemukan",
      data: processedRooms,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getOwnedRoomsList:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getRoomForEditForm = async (
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

    // Validasi input parameters
    const validatedParams = validateRoomEditParams(req.params, res);
    if (!validatedParams) return;

    // Query room untuk form edit
    const room = await getRoomForEdit(validatedParams, userId);

    // Cek apakah room ditemukan dan milik user
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    // Process data room untuk form edit
    const editFormData = {
      id: room.id,
      name: room.name,
      description: room.description,
      price: room.price,
      max_guests: room.max_guests,
      quantity: room.quantity,
      property_id: room.property_id,
      property_name: room.properties?.name || null,
      created_at: room.created_at,
      updated_at: room.updated_at,
    };

    res.status(200).json({
      success: true,
      message: "Data room untuk edit berhasil ditemukan",
      data: editFormData,
    });
  } catch (error) {
    console.error("Error in getRoomForEditForm:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateRoomById = async (
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

    // Validasi input parameters
    const validatedParams = validateUpdateRoomParams(req.params, req.body, res);
    if (!validatedParams) return;

    // Update room
    const updatedRoom = await updateRoom(validatedParams, userId);

    if (!updatedRoom) {
      res.status(404).json({
        success: false,
        message: "Room tidak ditemukan atau bukan milik Anda",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Room berhasil diperbarui",
      data: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        description: updatedRoom.description,
        price: updatedRoom.price,
        max_guests: updatedRoom.max_guests,
        quantity: updatedRoom.quantity,
        property_id: updatedRoom.property_id,
        updated_at: updatedRoom.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in updateRoomById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deletePropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Validate parameters
    const validatedParams = validateDeletePropertyParams(req.params, res);
    if (!validatedParams) {
      return;
    }

    // Delete property
    const result = await deletePropertyQuery(
      validatedParams.propertyId,
      userId
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in deletePropertyById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteRoomById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Validate parameters
    const validatedParams = validateDeleteRoomParams(req.params, res);
    if (!validatedParams) {
      return;
    }

    // Delete room
    const result = await deleteRoomQuery(validatedParams.roomId, userId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in deleteRoomById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
