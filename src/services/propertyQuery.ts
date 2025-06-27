import { PrismaClient } from "../../generated/prisma";
import { ValidatedSearchParams } from "./propertyValidation";

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
              start_date: {
                lte: checkInDate,
              },
              end_date: {
                gte: checkOutDate,
              },
            },
          },
        },
      },
    },
  });
};
