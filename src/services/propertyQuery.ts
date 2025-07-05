import { PrismaClient } from "../../generated/prisma";
import {
  ValidatedSearchParams,
  ValidatedDetailParams,
  ValidatedCategoryParams,
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

  // Query dengan where clause untuk tenant_id yang sesuai dengan user atau null
  const whereClause: any = {
    OR: [
      { tenant_id: null }, // Categories yang public (tenant_id null)
    ],
  };

  // Jika tenant_id diberikan, tambahkan kondisi untuk tenant_id tersebut
  if (tenantId) {
    whereClause.OR.push({ tenant_id: tenantId });
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

export const getUserProperties = async (userId: string) => {
  return await prisma.properties.findMany({
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
          picture: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { id: "asc" },
      },
      _count: {
        select: {
          rooms: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};
