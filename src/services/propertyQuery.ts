import { PrismaClient } from "../../generated/prisma";
import {
  ValidatedSearchParams,
  ValidatedDetailParams,
  ValidatedCategoryParams,
  ValidatedCreateCategoryParams,
  ValidatedUpdateCategoryParams,
  ValidatedDeleteCategoryParams,
  ValidatedCreatePropertyParams,
  ValidatedMyPropertiesParams,
  ValidatedOwnedPropertyDetailParams,
  ValidatedUpdatePropertyParams,
  ValidatedPropertyEditParams,
  ValidatedCreateRoomParams,
  ValidatedOwnedRoomsParams,
  ValidatedRoomEditParams,
  ValidatedUpdateRoomParams,
  ValidatedGetUnavailabilitiesParams,
  ValidatedCreateUnavailabilityParams,
  ValidatedDeleteUnavailabilityParams,
  ValidatedListRoomUnavailParams,
} from "./propertyValidation";

const prisma = new PrismaClient();

export const buildWhereClause = (params: ValidatedSearchParams) => {
  const { cityId, guestCount, propertyName, categoryName } = params;

  const whereClause: any = {
    city_id: cityId,
    rooms: {
      some: {
        max_guests: {
          gte: guestCount,
        },
        quantity: {
          gt: 0,
        },
      },
    },
  };

  // Filter by property name (case insensitive)
  if (propertyName) {
    whereClause.name = {
      contains: propertyName,
      mode: "insensitive",
    };
  }

  // Filter by category name (support multiple categories)
  if (categoryName) {
    const categories = categoryName.split(",").map((cat) => cat.trim());

    if (categories.length === 1) {
      // Single category - gunakan contains untuk partial match
      whereClause.property_categories = {
        name: {
          contains: categories[0],
          mode: "insensitive",
        },
      };
    } else {
      // Multiple categories - gunakan in untuk exact match
      whereClause.property_categories = {
        name: {
          in: categories,
          mode: "insensitive",
        },
      };
    }
  }

  return whereClause;
};

export const getAvailableProperties = async (
  whereClause: any,
  params: ValidatedSearchParams
) => {
  const { guestCount, checkInDate, checkOutDate } = params;

  return await prisma.properties.findMany({
    where: whereClause,
    include: {
      property_categories: {
        select: {
          name: true,
        },
      },
      property_pictures: {
        where: {
          is_main: true,
        },
        select: {
          file_path: true,
        },
      },
      rooms: {
        where: {
          max_guests: {
            gte: guestCount,
          },
          quantity: {
            gt: 0,
          },
        },
        include: {
          bookings: {
            where: {
              status_id: {
                not: 1, // 1 = Canceled
              },
              check_in: {
                lt: checkOutDate,
              },
              check_out: {
                gt: checkInDate,
              },
            },
          },
          room_unavailabilities: {
            where: {
              start_date: {
                lt: checkOutDate,
              },
              end_date: {
                gt: checkInDate,
              },
            },
          },
          peak_season_rates: {
            where: {
              AND: [
                { start_date: { lte: checkOutDate } },
                { end_date: { gte: checkInDate } },
              ],
            },
          },
        },
      },
    },
  });
};

export const getPropertyDetail = async (params: ValidatedDetailParams) => {
  const { propertyId, guestCount, checkInDate, checkOutDate } = params;

  return await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      property_categories: {
        select: {
          name: true,
        },
      },
      cities: {
        select: {
          name: true,
          type: true,
        },
      },
      property_pictures: {
        select: {
          id: true,
          file_path: true,
          is_main: true,
        },
        orderBy: [{ is_main: "desc" }, { id: "asc" }],
      },
      rooms: {
        where: {
          max_guests: {
            gte: guestCount,
          },
          quantity: {
            gt: 0,
          },
        },
        include: {
          bookings: {
            where: {
              status_id: {
                not: 1, // 1 = Canceled
              },
              check_in: {
                lt: checkOutDate,
              },
              check_out: {
                gt: checkInDate,
              },
            },
          },
          room_unavailabilities: {
            where: {
              start_date: {
                lt: checkOutDate,
              },
              end_date: {
                gt: checkInDate,
              },
            },
          },
          peak_season_rates: {
            where: {
              AND: [
                { start_date: { lte: checkOutDate } },
                { end_date: { gte: checkInDate } },
              ],
            },
          },
          room_pictures: {
            select: {
              id: true,
              file_path: true,
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
      },
    },
  });
};

export const getPropertyForCalendar = async (
  propertyId: number,
  year: number,
  month: number
) => {
  // Buat start dan end date untuk month
  const startDate = new Date(year, month - 1, 1); // month-1 karena JS month 0-indexed
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

  return await prisma.properties.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      name: true,
      rooms: {
        where: {
          quantity: {
            gt: 0,
          },
        },
        include: {
          bookings: {
            where: {
              status_id: {
                not: 1, // Exclude canceled bookings
              },
              OR: [
                {
                  check_in: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  check_out: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  AND: [
                    {
                      check_in: {
                        lte: startDate,
                      },
                    },
                    {
                      check_out: {
                        gte: endDate,
                      },
                    },
                  ],
                },
              ],
            },
          },
          room_unavailabilities: {
            where: {
              OR: [
                {
                  start_date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  end_date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  AND: [
                    {
                      start_date: {
                        lte: startDate,
                      },
                    },
                    {
                      end_date: {
                        gte: endDate,
                      },
                    },
                  ],
                },
              ],
            },
          },
          peak_season_rates: {
            where: {
              OR: [
                {
                  start_date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  end_date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                {
                  AND: [
                    {
                      start_date: {
                        lte: startDate,
                      },
                    },
                    {
                      end_date: {
                        gte: endDate,
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  });
};

export const getPropertyCategories = async (
  params: ValidatedCategoryParams
) => {
  const { tenantId } = params;

  const whereClause: any = {};

  // Jika tenant_id disediakan, filter berdasarkan tenant_id
  // Jika tidak, ambil kategori publik (tenant_id null) dan kategori milik tenant
  if (tenantId) {
    whereClause.OR = [{ tenant_id: null }, { tenant_id: tenantId }];
  } else {
    whereClause.tenant_id = null; // Hanya kategori publik
  }

  return await prisma.property_categories.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      tenant_id: true,
    },
    orderBy: [
      { tenant_id: "asc" }, // Public categories (null) first
      { id: "asc" }, // Then sort by name
    ],
  });
};

export const createCategory = async (params: ValidatedCreateCategoryParams) => {
  const { name, tenantId } = params;

  // Cek apakah kategori dengan nama yang sama sudah ada untuk tenant ini
  const existingCategory = await prisma.property_categories.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      tenant_id: tenantId,
    },
  });

  if (existingCategory) {
    return null; // Kategori sudah ada
  }

  // Buat kategori baru
  const newCategory = await prisma.property_categories.create({
    data: {
      name,
      tenant_id: tenantId,
    },
  });

  return newCategory;
};

export const updateCategory = async (
  params: ValidatedUpdateCategoryParams,
  userId: string
) => {
  const { categoryId, name } = params;

  // Pertama, verifikasi bahwa kategori tersebut milik user
  const category = await prisma.property_categories.findFirst({
    where: {
      id: categoryId,
      tenant_id: userId,
    },
  });

  if (!category) {
    return null;
  }

  // Cek apakah kategori dengan nama baru sudah ada untuk tenant ini (kecuali kategori yang sedang diupdate)
  if (name) {
    const existingCategory = await prisma.property_categories.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        tenant_id: userId,
        NOT: {
          id: categoryId,
        },
      },
    });

    if (existingCategory) {
      return "duplicate"; // Nama sudah digunakan kategori lain
    }
  }

  // Buat object untuk data yang akan diupdate
  const updateData: any = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  // Tambahkan updated_at
  updateData.updated_at = new Date();

  // Update kategori
  const updatedCategory = await prisma.property_categories.update({
    where: {
      id: categoryId,
    },
    data: updateData,
  });

  return updatedCategory;
};

export const deleteCategory = async (
  params: ValidatedDeleteCategoryParams,
  userId: string
) => {
  const { categoryId } = params;

  // Pertama, verifikasi bahwa kategori tersebut milik user
  const category = await prisma.property_categories.findFirst({
    where: {
      id: categoryId,
      tenant_id: userId,
    },
  });

  if (!category) {
    return null;
  }

  // Cek apakah kategori sedang digunakan oleh property
  const propertiesUsingCategory = await prisma.properties.count({
    where: {
      category_id: categoryId,
    },
  });

  if (propertiesUsingCategory > 0) {
    return "in_use"; // Kategori sedang digunakan
  }

  // Hapus kategori
  const deletedCategory = await prisma.property_categories.delete({
    where: {
      id: categoryId,
    },
  });

  return deletedCategory;
};

export const getUserProperties = async (
  userId: string,
  params: ValidatedMyPropertiesParams
) => {
  const { page, all } = params;

  // Jika all=true, ambil semua properties tanpa pagination
  if (all) {
    const propertiesAll = await prisma.properties.findMany({
      where: {
        tenant_id: userId,
      },
      include: {
        property_categories: {
          select: {
            id: true,
            name: true,
          },
        },
        cities: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        property_pictures: {
          select: {
            id: true,
            file_path: true,
            is_main: true,
          },
        },
        rooms: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            max_guests: true,
            quantity: true,
            created_at: true,
            updated_at: true,
            room_pictures: {
              select: {
                id: true,
                file_path: true,
              },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            rooms: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return {
      data: propertiesAll,
      pagination: null,
    };
  }

  // Jika tidak all, gunakan pagination standar
  const limit = 5;
  const offset = (page - 1) * limit;

  // Query total count untuk pagination
  const totalCount = await prisma.properties.count({
    where: {
      tenant_id: userId,
    },
  });

  // Query properties dengan pagination
  const properties = await prisma.properties.findMany({
    where: {
      tenant_id: userId,
    },
    include: {
      property_categories: {
        select: {
          id: true,
          name: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      property_pictures: {
        select: {
          id: true,
          file_path: true,
          is_main: true,
        },
      },
      rooms: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          max_guests: true,
          quantity: true,
          created_at: true,
          updated_at: true,
          room_pictures: {
            select: {
              id: true,
              file_path: true,
            },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          rooms: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip: offset,
    take: limit,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: properties,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: totalCount,
      items_per_page: limit,
      has_next_page: hasNextPage,
      has_previous_page: hasPreviousPage,
    },
  };
};

export const createProperty = async (
  params: ValidatedCreatePropertyParams,
  tenantId: string
) => {
  const { name, description, location, categoryId, cityId } = params;

  return await prisma.properties.create({
    data: {
      tenant_id: tenantId,
      name,
      description,
      location,
      category_id: categoryId || null,
      city_id: cityId || null,
    },
    include: {
      property_categories: {
        select: {
          id: true,
          name: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      property_pictures: {
        select: {
          id: true,
          file_path: true,
          is_main: true,
        },
      },
      rooms: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          max_guests: true,
          quantity: true,
          created_at: true,
          updated_at: true,
          room_pictures: {
            select: {
              id: true,
              file_path: true,
            },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          rooms: true,
        },
      },
    },
  });
};

export const getOwnedPropertyDetail = async (
  propertyId: number,
  userId: string
) => {
  return await prisma.properties.findFirst({
    where: {
      id: propertyId,
      tenant_id: userId,
    },
    include: {
      property_categories: {
        select: {
          id: true,
          name: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      property_pictures: {
        select: {
          id: true,
          file_path: true,
          is_main: true,
        },
        orderBy: [{ is_main: "desc" }, { id: "asc" }],
      },
      rooms: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          max_guests: true,
          quantity: true,
          created_at: true,
          updated_at: true,
          room_pictures: {
            select: {
              id: true,
              file_path: true,
            },
            take: 1,
          },
        },
        orderBy: { id: "asc" },
      },
      _count: {
        select: {
          rooms: true,
        },
      },
    },
  });
};

export const updateProperty = async (
  params: ValidatedUpdatePropertyParams,
  tenantId: string
) => {
  const { propertyId, name, description, location, categoryId, cityId } =
    params;

  // Buat object untuk data yang akan diupdate
  const updateData: any = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (location !== undefined) {
    updateData.location = location;
  }

  if (categoryId !== undefined) {
    updateData.category_id = categoryId;
  }

  if (cityId !== undefined) {
    updateData.city_id = cityId;
  }

  // Tambahkan updated_at
  updateData.updated_at = new Date();

  return await prisma.properties.update({
    where: {
      id: propertyId,
      tenant_id: tenantId, // Pastikan property milik user yang bersangkutan
    },
    data: updateData,
    include: {
      property_categories: {
        select: {
          id: true,
          name: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      property_pictures: {
        select: {
          id: true,
          file_path: true,
          is_main: true,
        },
        orderBy: [{ is_main: "desc" }, { id: "asc" }],
      },
      rooms: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          max_guests: true,
          quantity: true,
          created_at: true,
          updated_at: true,
          room_pictures: {
            select: {
              id: true,
              file_path: true,
            },
            take: 1,
          },
        },
        orderBy: { id: "asc" },
      },
      _count: {
        select: {
          rooms: true,
        },
      },
    },
  });
};

export const getPropertyForEdit = async (
  params: ValidatedPropertyEditParams,
  userId: string
) => {
  const { propertyId } = params;

  return await prisma.properties.findFirst({
    where: {
      id: propertyId,
      tenant_id: userId,
    },
    include: {
      property_categories: {
        select: {
          id: true,
          name: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
};

export const createRoom = async (
  params: ValidatedCreateRoomParams,
  userId: string
) => {
  const { name, description, price, maxGuests, quantity, propertyId } = params;

  // Pertama, verifikasi bahwa property tersebut milik user
  const property = await prisma.properties.findFirst({
    where: {
      id: propertyId,
      tenant_id: userId,
    },
  });

  if (!property) {
    return null;
  }

  // Buat room baru
  const newRoom = await prisma.rooms.create({
    data: {
      name,
      description,
      price,
      max_guests: maxGuests,
      quantity,
      property_id: propertyId,
    },
  });

  return newRoom;
};

export const getOwnedRooms = (
  params: ValidatedOwnedRoomsParams,
  userId: string
) => {
  const { page, propertyId, all } = params;

  // Build where clause
  const whereClause: any = {
    properties: {
      tenant_id: userId,
    },
  };

  // Filter by property ID if provided
  if (propertyId) {
    whereClause.property_id = propertyId;
  }

  // Jika all=true, kembalikan seluruh data tanpa pagination
  if (all) {
    return prisma.rooms
      .findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          price: true,
          max_guests: true,
          quantity: true,
          created_at: true,
          updated_at: true,
          property_id: true,
          properties: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      })
      .then((rooms) => ({
        data: rooms,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: rooms.length,
          items_per_page: rooms.length,
          has_next_page: false,
          has_previous_page: false,
        },
      }));
  }

  // Pagination normal
  const limit = 5;
  const offset = (page - 1) * limit;

  // Get total count
  const totalCountPromise = prisma.rooms.count({ where: whereClause });
  const roomsPromise = prisma.rooms.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      price: true,
      max_guests: true,
      quantity: true,
      created_at: true,
      updated_at: true,
      property_id: true,
      properties: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip: offset,
    take: limit,
  });

  return Promise.all([roomsPromise, totalCountPromise]).then(
    ([rooms, totalCount]) => {
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: rooms,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: limit,
          has_next_page: hasNextPage,
          has_previous_page: hasPreviousPage,
        },
      };
    }
  );
};

export const getRoomForEdit = async (
  params: ValidatedRoomEditParams,
  userId: string
) => {
  const { roomId } = params;

  return await prisma.rooms.findFirst({
    where: {
      id: roomId,
      properties: {
        tenant_id: userId,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      max_guests: true,
      quantity: true,
      property_id: true,
      created_at: true,
      updated_at: true,
      properties: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const updateRoom = async (
  params: ValidatedUpdateRoomParams,
  userId: string
) => {
  const { roomId, name, description, price, maxGuests, quantity } = params;

  // Pertama, verifikasi bahwa room tersebut milik user (melalui property)
  const room = await prisma.rooms.findFirst({
    where: {
      id: roomId,
      properties: {
        tenant_id: userId,
      },
    },
  });

  if (!room) {
    return null;
  }

  // Buat object untuk data yang akan diupdate
  const updateData: any = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (price !== undefined) {
    updateData.price = price;
  }

  if (maxGuests !== undefined) {
    updateData.max_guests = maxGuests;
  }

  if (quantity !== undefined) {
    updateData.quantity = quantity;
  }

  // Tambahkan updated_at
  updateData.updated_at = new Date();

  // Update room
  const updatedRoom = await prisma.rooms.update({
    where: {
      id: roomId,
    },
    data: updateData,
  });

  return updatedRoom;
};

export const deletePropertyById = async (
  propertyId: number,
  tenantId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Verifikasi bahwa property milik tenant
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        tenant_id: tenantId,
      },
    });

    if (!property) {
      return {
        success: false,
        message: "Property tidak ditemukan atau bukan milik Anda",
      };
    }

    // Cek apakah property memiliki booking yang masih aktif
    const bookingsCount = await prisma.bookings.count({
      where: {
        rooms: {
          property_id: propertyId,
        },
      },
    });

    if (bookingsCount > 0) {
      return {
        success: false,
        message:
          "Tidak dapat menghapus property karena masih memiliki booking. Tunggu hingga semua booking selesai",
      };
    }

    // Hapus property
    const deletedProperty = await prisma.properties.delete({
      where: {
        id: propertyId,
      },
    });

    return {
      success: true,
      message: "Property berhasil dihapus",
      data: deletedProperty,
    };
  } catch (error) {
    console.error("Error deleting property:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus property",
    };
  }
};

export const deleteRoomById = async (
  roomId: number,
  tenantId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Verifikasi bahwa room milik tenant melalui property relation
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          tenant_id: tenantId,
        },
      },
      include: {
        properties: {
          select: {
            name: true,
            tenant_id: true,
          },
        },
      },
    });

    if (!room) {
      return {
        success: false,
        message: "Room tidak ditemukan atau bukan milik Anda",
      };
    }

    // Cek apakah room memiliki booking yang masih aktif
    const bookingsCount = await prisma.bookings.count({
      where: {
        room_id: roomId,
      },
    });

    if (bookingsCount > 0) {
      return {
        success: false,
        message:
          "Tidak dapat menghapus room karena masih memiliki booking. Tunggu hingga semua booking selesai",
      };
    }

    // Hapus room
    const deletedRoom = await prisma.rooms.delete({
      where: {
        id: roomId,
      },
    });

    return {
      success: true,
      message: "Room berhasil dihapus",
      data: deletedRoom,
    };
  } catch (error) {
    console.error("Error deleting room:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus room",
    };
  }
};

// Room Unavailabilities Query Functions

export const getRoomUnavailabilitiesByProperty = async (
  params: ValidatedGetUnavailabilitiesParams,
  tenantId: string
) => {
  const { propertyId, page } = params;
  const itemsPerPage = 5;
  const skip = (page - 1) * itemsPerPage;

  // Verifikasi bahwa property milik tenant
  const property = await prisma.properties.findFirst({
    where: {
      id: propertyId,
      tenant_id: tenantId,
    },
  });

  if (!property) {
    return null;
  }

  // Get total count
  const totalCount = await prisma.room_unavailabilities.count({
    where: {
      rooms: {
        property_id: propertyId,
      },
    },
  });

  // Get paginated data
  const unavailabilities = await prisma.room_unavailabilities.findMany({
    where: {
      rooms: {
        property_id: propertyId,
      },
    },
    include: {
      rooms: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      start_date: "desc",
    },
    skip,
    take: itemsPerPage,
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    data: unavailabilities,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: totalCount,
      items_per_page: itemsPerPage,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

export const createRoomUnavailability = async (
  params: ValidatedCreateUnavailabilityParams,
  tenantId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { roomId, startDate, endDate } = params;

    // Verifikasi bahwa room milik tenant melalui property relation
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          tenant_id: tenantId,
        },
      },
    });

    if (!room) {
      return {
        success: false,
        message: "Room tidak ditemukan atau bukan milik Anda",
      };
    }

    // Cek overlap dengan unavailability yang sudah ada
    const existingUnavailability = await prisma.room_unavailabilities.findFirst(
      {
        where: {
          room_id: roomId,
          OR: [
            // Start date berada dalam range existing
            {
              AND: [
                { start_date: { lte: startDate } },
                { end_date: { gt: startDate } },
              ],
            },
            // End date berada dalam range existing
            {
              AND: [
                { start_date: { lt: endDate } },
                { end_date: { gte: endDate } },
              ],
            },
            // Range baru mencakup existing range
            {
              AND: [
                { start_date: { gte: startDate } },
                { end_date: { lte: endDate } },
              ],
            },
          ],
        },
      }
    );

    if (existingUnavailability) {
      return {
        success: false,
        message:
          "Tanggal yang dipilih bertabrakan dengan unavailability yang sudah ada",
      };
    }

    // Create unavailability
    const unavailability = await prisma.room_unavailabilities.create({
      data: {
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
      },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Room unavailability berhasil dibuat",
      data: unavailability,
    };
  } catch (error) {
    console.error("Error creating room unavailability:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat membuat room unavailability",
    };
  }
};

export const deleteRoomUnavailabilityById = async (
  params: ValidatedDeleteUnavailabilityParams,
  tenantId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { unavailabilityId } = params;

    // Verifikasi bahwa unavailability milik tenant melalui room->property relation
    const unavailability = await prisma.room_unavailabilities.findFirst({
      where: {
        id: unavailabilityId,
        rooms: {
          properties: {
            tenant_id: tenantId,
          },
        },
      },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            properties: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!unavailability) {
      return {
        success: false,
        message: "Room unavailability tidak ditemukan atau bukan milik Anda",
      };
    }

    // Delete unavailability
    const deletedUnavailability = await prisma.room_unavailabilities.delete({
      where: {
        id: unavailabilityId,
      },
    });

    return {
      success: true,
      message: "Room unavailability berhasil dihapus",
      data: deletedUnavailability,
    };
  } catch (error) {
    console.error("Error deleting room unavailability:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus room unavailability",
    };
  }
};

// Room Unavailabilities LIST by Room & Month
export const getRoomUnavailabilitiesByRoom = async (
  params: ValidatedListRoomUnavailParams,
  tenantId: string
): Promise<{ success: boolean; message: string; data?: any[] }> => {
  const { roomId, startDate, endDate } = params;

  // Verifikasi room milik tenant
  const room = await prisma.rooms.findFirst({
    where: {
      id: roomId,
      properties: {
        tenant_id: tenantId,
      },
    },
  });

  if (!room) {
    return {
      success: false,
      message: "Room tidak ditemukan atau bukan milik Anda",
    };
  }

  // Ambil unavailabilities yang overlap dengan rentang bulan
  const unavailabilities = await prisma.room_unavailabilities.findMany({
    where: {
      room_id: roomId,
      start_date: { lt: endDate },
      end_date: { gte: startDate },
    },
    orderBy: {
      start_date: "asc",
    },
    select: {
      id: true,
      room_id: true,
      start_date: true,
      end_date: true,
    },
  });

  return { success: true, message: "success", data: unavailabilities };
};
