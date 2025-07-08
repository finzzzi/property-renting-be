import {
  ProcessedProperty,
  ProcessedRoom,
  PropertyDetail,
  CalendarDay,
  CalendarData,
} from "./propertyInterfaces";

export const processRoomsAvailability = (property: any): ProcessedRoom[] => {
  const availableRooms: ProcessedRoom[] = [];

  for (const room of property.rooms) {
    // Hitung jumlah room yang sudah di-booking pada tanggal tersebut
    const bookedRoomsCount = room.bookings.length;

    // Cek apakah ada room unavailability pada tanggal tersebut
    const hasUnavailability = room.room_unavailabilities.length > 0;

    // Hitung available quantity
    const availableQuantity = hasUnavailability
      ? 0
      : room.quantity - bookedRoomsCount;

    if (availableQuantity >= 0) {
      // Hitung harga dengan peak season rate jika ada
      let finalPrice = room.price;

      if (room.peak_season_rates.length > 0) {
        const peakRate = room.peak_season_rates[0];
        if (peakRate.type === "percentage") {
          finalPrice = room.price + (room.price * peakRate.value) / 100;
        } else if (peakRate.type === "fixed") {
          finalPrice = room.price + peakRate.value;
        }
      }

      // Add public URLs for room pictures
      const roomPicturesWithUrls =
        room.room_pictures?.map((picture: any) => ({
          ...picture,
          public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/room-pictures/${picture.file_path}`,
        })) || [];

      availableRooms.push({
        ...room,
        available_quantity: availableQuantity,
        final_price: finalPrice,
        room_pictures: roomPicturesWithUrls,
      });
    }
  }

  return availableRooms;
};

export const transformPropertyData = (
  property: any,
  availableRooms: ProcessedRoom[]
): ProcessedProperty => {
  // Ambil harga termurah dari room yang tersedia
  const cheapestRoom = availableRooms.reduce((prev, current) =>
    prev.final_price < current.final_price ? prev : current
  );

  return {
    property_id: property.id,
    name: property.name,
    location: property.location,
    category: property.property_categories?.name || null,
    city_id: property.city_id,
    property_pictures:
      property.property_pictures.length > 0
        ? property.property_pictures[0].file_path
        : null,
    price: cheapestRoom.final_price,
    available_rooms: availableRooms.length,
  };
};

export const sortProperties = (
  properties: ProcessedProperty[],
  sortBy?: string,
  sortOrder?: string
): ProcessedProperty[] => {
  if (!sortBy) return properties;

  const sortedProperties = [...properties];
  const orderValue = sortOrder || "asc";

  sortedProperties.sort((a, b) => {
    let compareValue = 0;

    if (sortBy === "name") {
      compareValue = a.name.localeCompare(b.name);
    } else if (sortBy === "price") {
      compareValue = a.price - b.price;
    }

    return orderValue === "desc" ? -compareValue : compareValue;
  });

  return sortedProperties;
};

export const applyPagination = (
  data: ProcessedProperty[],
  page: number,
  limit: number = 5
) => {
  const offset = (page - 1) * limit;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_properties: totalItems,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

export const processPropertyDetail = (property: any): PropertyDetail => {
  const availableRooms = processRoomsAvailability(property);

  // Add public URLs for property pictures
  const propertyPicturesWithUrls =
    property.property_pictures?.map((picture: any) => ({
      ...picture,
      public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/property-pictures/${picture.file_path}`,
    })) || [];

  return {
    property_id: property.id,
    name: property.name,
    description: property.description,
    location: property.location,
    category: property.property_categories?.name || null,
    city: property.cities
      ? {
          name: property.cities.name,
          type: property.cities.type,
        }
      : null,
    property_pictures: propertyPicturesWithUrls,
    available_rooms: availableRooms,
  };
};

export const processCalendarData = (
  property: any,
  year: number,
  month: number,
  propertyId: number
): CalendarData => {
  const calendar: CalendarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Process each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    // Use local date formatting to avoid timezone conversion issues
    const dateString = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    const dayOfWeek = dayNames[currentDate.getDay()];

    // Check availability and calculate min price for this date
    const availableRooms: any[] = [];

    for (const room of property.rooms) {
      // Check if room is booked on this date
      const isBooked = room.bookings.some((booking: any) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        return currentDate >= checkIn && currentDate < checkOut;
      });

      // Check if room is unavailable on this date
      const isUnavailable = room.room_unavailabilities.some((unavail: any) => {
        // Create new date objects and normalize to midnight for proper comparison
        const startDate = new Date(unavail.start_date);
        const endDate = new Date(unavail.end_date);
        const checkDate = new Date(currentDate);

        // Set time to 00:00:00 for accurate date-only comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= startDate && checkDate <= endDate;
      });

      // Calculate booked rooms count for this date
      const bookedRoomsCount = room.bookings.filter((booking: any) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        return currentDate >= checkIn && currentDate < checkOut;
      }).length;

      // Calculate available quantity
      const availableQuantity = isUnavailable
        ? 0
        : room.quantity - bookedRoomsCount;

      if (availableQuantity > 0) {
        // Calculate price with peak season rate if applicable
        let finalPrice = room.price;

        const applicablePeakRate = room.peak_season_rates.find((rate: any) => {
          const startDate = new Date(rate.start_date);
          const endDate = new Date(rate.end_date);
          return currentDate >= startDate && currentDate <= endDate;
        });

        if (applicablePeakRate) {
          if (applicablePeakRate.type === "percentage") {
            finalPrice =
              room.price + (room.price * applicablePeakRate.value) / 100;
          } else if (applicablePeakRate.type === "fixed") {
            finalPrice = room.price + applicablePeakRate.value;
          }
        }

        availableRooms.push({
          ...room,
          available_quantity: availableQuantity,
          final_price: finalPrice,
        });
      }
    }

    // Determine availability and min price
    const isAvailable = availableRooms.length > 0;
    const minPrice = isAvailable
      ? Math.min(...availableRooms.map((room) => room.final_price))
      : null;
    const availableRoomsCount = availableRooms.reduce(
      (total, room) => total + room.available_quantity,
      0
    );

    calendar.push({
      date: dateString,
      day_of_week: dayOfWeek,
      is_available: isAvailable,
      min_price: minPrice,
      available_rooms_count: availableRoomsCount,
    });
  }

  // Calculate pagination info
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    property_id: property.id,
    property_name: property.name,
    year,
    month,
    calendar,
    pagination: {
      current_month: month,
      current_year: year,
      has_prev_month: true, // You can add logic to limit this if needed
      has_next_month: true, // You can add logic to limit this if needed
      prev_month_url: `/api/properties/${propertyId}/calendar?year=${prevYear}&month=${prevMonth}`,
      next_month_url: `/api/properties/${propertyId}/calendar?year=${nextYear}&month=${nextMonth}`,
    },
  };
};

export type {
  ProcessedProperty,
  ProcessedRoom,
  PropertyDetail,
  CalendarDay,
  CalendarData,
};
