import { Response, Request } from "express";

interface SearchParams {
  city_id?: string;
  check_in?: string;
  check_out?: string;
  guests?: string;
  page?: string;
  property_name?: string;
  category_name?: string;
  sort_by?: string;
  sort_order?: string;
}

interface DetailParams {
  property_id?: string;
  check_in?: string;
  check_out?: string;
  guests?: string;
}

// Interface untuk query parameters
interface CalendarQuery {
  year?: string;
  month?: string;
}

interface CalendarParams {
  propertyId?: string;
}

// Interface untuk update peak season
interface UpdatePeakSeasonBody {
  type?: string;
  value?: string | number;
  start_date?: string;
  end_date?: string;
}

interface UpdatePeakSeasonParams {
  id?: string;
}

export interface ValidatedUpdatePeakSeasonParams {
  id: number;
  type?: "percentage" | "fixed";
  value?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ValidatedSearchParams {
  cityId: number;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  pageNumber: number;
  propertyName?: string;
  categoryName?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ValidatedDetailParams {
  propertyId: number;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
}

export interface ValidatedCalendarParams {
  propertyId: number;
  year: number;
  month: number;
}

interface CategoryParams {
  tenant_id?: string;
}

export interface ValidatedCategoryParams {
  tenantId?: string;
}

interface CreatePropertyParams {
  name?: string;
  description?: string;
  location?: string;
  category_id?: string;
  city_id?: string;
}

export interface ValidatedCreatePropertyParams {
  name: string;
  description: string;
  location: string;
  categoryId?: number;
  cityId?: number;
}

interface MyPropertiesParams {
  page?: string;
  all?: string;
}

export interface ValidatedMyPropertiesParams {
  page: number;
  all: boolean;
}

interface OwnedPropertyDetailParams {
  property_id?: string;
}

export interface ValidatedOwnedPropertyDetailParams {
  propertyId: number;
}

interface UpdatePropertyParams {
  property_id?: string;
  name?: string;
  description?: string;
  location?: string;
  category_id?: string;
  city_id?: string;
}

export interface ValidatedUpdatePropertyParams {
  propertyId: number;
  name?: string;
  description?: string;
  location?: string;
  categoryId?: number;
  cityId?: number;
}

interface PropertyEditParams {
  property_id?: string;
}

export interface ValidatedPropertyEditParams {
  propertyId: number;
}

interface DeletePropertyParams {
  property_id?: string;
}

export interface ValidatedDeletePropertyParams {
  propertyId: number;
}

export const validateSearchParams = (
  params: SearchParams,
  res: Response
): ValidatedSearchParams | null => {
  const {
    city_id,
    check_in,
    check_out,
    guests,
    page,
    property_name,
    category_name,
    sort_by,
    sort_order,
  } = params;

  // Validasi input wajib
  if (!city_id || !check_in || !check_out || !guests) {
    res.status(400).json({
      success: false,
      message: "city_id, check_in, check_out, dan guests harus diisi",
    });
    return null;
  }

  const pageNumber = parseInt(page as string) || 1;

  // Validasi page number
  if (pageNumber < 1) {
    res.status(400).json({
      success: false,
      message: "Page number harus lebih besar dari 0",
    });
    return null;
  }

  // Validasi sort parameters
  const validSortBy = ["name", "price"];
  const validSortOrder = ["asc", "desc"];

  if (sort_by && !validSortBy.includes(sort_by as string)) {
    res.status(400).json({
      success: false,
      message: "sort_by harus 'name' atau 'price'",
    });
    return null;
  }

  if (sort_order && !validSortOrder.includes(sort_order as string)) {
    res.status(400).json({
      success: false,
      message: "sort_order harus 'asc' atau 'desc'",
    });
    return null;
  }

  const cityId = parseInt(city_id as string);
  const guestCount = parseInt(guests as string);
  const checkInDate = new Date(check_in as string);
  const checkOutDate = new Date(check_out as string);

  // Validasi tanggal
  if (checkInDate >= checkOutDate) {
    res.status(400).json({
      success: false,
      message: "Tanggal check_in harus sebelum check_out",
    });
    return null;
  }

  // Validasi tanggal tidak boleh di masa lalu
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    res.status(400).json({
      success: false,
      message: "Tanggal check_in tidak boleh di masa lalu",
    });
    return null;
  }

  return {
    cityId,
    checkInDate,
    checkOutDate,
    guestCount,
    pageNumber,
    propertyName: property_name as string,
    categoryName: category_name as string,
    sortBy: sort_by as string,
    sortOrder: sort_order as string,
  };
};

export const validatePagination = (
  pageNumber: number,
  totalPages: number,
  res: Response
): boolean => {
  if (pageNumber > totalPages && totalPages > 0) {
    res.status(400).json({
      success: false,
      message: `Page ${pageNumber} tidak tersedia. Total page: ${totalPages}`,
    });
    return false;
  }
  return true;
};

export const validateDetailParams = (
  params: DetailParams,
  res: Response
): ValidatedDetailParams | null => {
  const { property_id, check_in, check_out, guests } = params;

  // Validasi input wajib
  if (!property_id || !check_in || !check_out || !guests) {
    res.status(400).json({
      success: false,
      message: "property_id, check_in, check_out, dan guests harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id as string);
  const guestCount = parseInt(guests as string);
  const checkInDate = new Date(check_in as string);
  const checkOutDate = new Date(check_out as string);

  // Validasi property_id adalah number yang valid
  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "property_id harus berupa angka yang valid",
    });
    return null;
  }

  // Validasi guests adalah number yang valid
  if (isNaN(guestCount) || guestCount <= 0) {
    res.status(400).json({
      success: false,
      message: "guests harus berupa angka yang valid",
    });
    return null;
  }

  // Validasi tanggal
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Format tanggal tidak valid",
    });
    return null;
  }

  if (checkInDate >= checkOutDate) {
    res.status(400).json({
      success: false,
      message: "Tanggal check_in harus sebelum check_out",
    });
    return null;
  }

  // Validasi tanggal tidak boleh di masa lalu
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    res.status(400).json({
      success: false,
      message: "Tanggal check_in tidak boleh di masa lalu",
    });
    return null;
  }

  return {
    propertyId,
    checkInDate,
    checkOutDate,
    guestCount,
  };
};

export const validateCalendarParams = (
  query: CalendarQuery,
  params: CalendarParams,
  res: Response
): ValidatedCalendarParams | null => {
  const { propertyId } = params;
  const { year, month } = query;

  // Validate propertyId
  if (!propertyId) {
    res.status(400).json({
      status: "error",
      message: "Property ID harus diisi",
    });
    return null;
  }
  const parsedPropertyId = parseInt(propertyId);
  if (isNaN(parsedPropertyId) || parsedPropertyId <= 0) {
    res.status(400).json({
      status: "error",
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  // Validate year
  if (!year) {
    res.status(400).json({
      status: "error",
      message: "Year harus diisi",
    });
    return null;
  }
  const parsedYear = parseInt(year);
  if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2030) {
    res.status(400).json({
      status: "error",
      message: "Year harus berupa angka antara 2020-2030",
    });
    return null;
  }

  // Validate month
  if (!month) {
    res.status(400).json({
      status: "error",
      message: "Month harus diisi",
    });
    return null;
  }
  const parsedMonth = parseInt(month);
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    res.status(400).json({
      status: "error",
      message: "Month harus berupa angka antara 1-12",
    });
    return null;
  }

  return {
    propertyId: parsedPropertyId,
    year: parsedYear,
    month: parsedMonth,
  };
};

export const validateCategoryParams = (
  params: CategoryParams,
  res: Response
): ValidatedCategoryParams | null => {
  const { tenant_id } = params;

  // tenant_id adalah optional untuk get categories
  let tenantId: string | undefined;
  if (tenant_id) {
    // Validasi format UUID jika ada
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenant_id)) {
      res.status(400).json({
        success: false,
        message: "Format tenant_id tidak valid",
      });
      return null;
    }
    tenantId = tenant_id;
  }

  return {
    tenantId,
  };
};

interface CreateCategoryParams {
  name?: string;
  tenant_id?: string;
}

export interface ValidatedCreateCategoryParams {
  name: string;
  tenantId: string;
}

export const validateCreateCategoryParams = (
  body: CreateCategoryParams,
  res: Response
): ValidatedCreateCategoryParams | null => {
  const { name, tenant_id } = body;

  // Validasi input wajib
  if (!name || !tenant_id) {
    res.status(400).json({
      success: false,
      message: "name dan tenant_id harus diisi",
    });
    return null;
  }

  // Validasi nama kategori
  if (name.trim().length < 2 || name.trim().length > 50) {
    res.status(400).json({
      success: false,
      message: "Nama kategori harus antara 2-50 karakter",
    });
    return null;
  }

  // Validasi format UUID untuk tenant_id
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenant_id)) {
    res.status(400).json({
      success: false,
      message: "Format tenant_id tidak valid",
    });
    return null;
  }

  return {
    name: name.trim(),
    tenantId: tenant_id,
  };
};

interface UpdateCategoryParams {
  category_id?: string;
  name?: string;
}

export interface ValidatedUpdateCategoryParams {
  categoryId: number;
  name?: string;
}

export const validateUpdateCategoryParams = (
  params: UpdateCategoryParams,
  body: UpdateCategoryParams,
  res: Response
): ValidatedUpdateCategoryParams | null => {
  // Ambil category_id dari params URL
  const { category_id } = params;

  // Validasi category_id wajib
  if (!category_id) {
    res.status(400).json({
      success: false,
      message: "Category ID harus diisi",
    });
    return null;
  }

  const categoryId = parseInt(category_id);

  // Validasi category_id format angka
  if (isNaN(categoryId) || categoryId <= 0) {
    res.status(400).json({
      success: false,
      message: "Category ID harus berupa angka positif",
    });
    return null;
  }

  // Ambil data yang akan diupdate dari body
  const { name } = body;

  // Minimal harus ada satu field yang akan diupdate
  if (!name) {
    res.status(400).json({
      success: false,
      message: "Nama kategori harus diisi untuk update",
    });
    return null;
  }

  const result: ValidatedUpdateCategoryParams = {
    categoryId,
  };

  // Validasi nama kategori jika ada
  if (name !== undefined) {
    if (name.trim().length < 2 || name.trim().length > 50) {
      res.status(400).json({
        success: false,
        message: "Nama kategori harus antara 2-50 karakter",
      });
      return null;
    }
    result.name = name.trim();
  }

  return result;
};

interface DeleteCategoryParams {
  category_id?: string;
}

export interface ValidatedDeleteCategoryParams {
  categoryId: number;
}

export const validateDeleteCategoryParams = (
  params: DeleteCategoryParams,
  res: Response
): ValidatedDeleteCategoryParams | null => {
  const { category_id } = params;

  if (!category_id) {
    res.status(400).json({
      success: false,
      message: "Category ID harus diisi",
    });
    return null;
  }

  const categoryId = parseInt(category_id);

  if (isNaN(categoryId) || categoryId <= 0) {
    res.status(400).json({
      success: false,
      message: "Category ID harus berupa angka positif",
    });
    return null;
  }

  return {
    categoryId,
  };
};

export const validateCreatePropertyParams = (
  body: CreatePropertyParams,
  res: Response
): ValidatedCreatePropertyParams | null => {
  const { name, description, location, category_id, city_id } = body;

  // Validasi field wajib
  if (!name || !description || !location) {
    res.status(400).json({
      success: false,
      message: "name, description, dan location harus diisi",
    });
    return null;
  }

  // Validasi panjang string
  if (name.trim().length < 3) {
    res.status(400).json({
      success: false,
      message: "Nama property minimal 3 karakter",
    });
    return null;
  }

  if (description.trim().length < 10) {
    res.status(400).json({
      success: false,
      message: "Deskripsi property minimal 10 karakter",
    });
    return null;
  }

  if (location.trim().length < 3) {
    res.status(400).json({
      success: false,
      message: "Lokasi property minimal 3 karakter",
    });
    return null;
  }

  // Validasi category_id jika ada
  let categoryId: number | undefined;
  if (category_id) {
    categoryId = parseInt(category_id);
    if (isNaN(categoryId) || categoryId <= 0) {
      res.status(400).json({
        success: false,
        message: "category_id harus berupa angka yang valid",
      });
      return null;
    }
  }

  // Validasi city_id jika ada
  let cityId: number | undefined;
  if (city_id) {
    cityId = parseInt(city_id);
    if (isNaN(cityId) || cityId <= 0) {
      res.status(400).json({
        success: false,
        message: "city_id harus berupa angka yang valid",
      });
      return null;
    }
  }

  return {
    name: name.trim(),
    description: description.trim(),
    location: location.trim(),
    categoryId,
    cityId,
  };
};

export const validateMyPropertiesParams = (
  query: MyPropertiesParams,
  res: Response
): ValidatedMyPropertiesParams | null => {
  const { page, all } = query;

  // Cek apakah parameter all=true
  const allFlag = typeof all === "string" && all.toLowerCase() === "true";

  // Jika all=true, abaikan pagination
  if (allFlag) {
    return {
      page: 1,
      all: true,
    };
  }

  // Validasi page parameter
  let pageNumber = 1;
  if (page) {
    pageNumber = parseInt(page);
    if (isNaN(pageNumber) || pageNumber < 1) {
      res.status(400).json({
        success: false,
        message:
          "Parameter page harus berupa angka yang valid dan lebih besar dari 0",
      });
      return null;
    }
  }

  return {
    page: pageNumber,
    all: false,
  };
};

export const validateOwnedPropertyDetailParams = (
  params: OwnedPropertyDetailParams,
  res: Response
): ValidatedOwnedPropertyDetailParams | null => {
  const { property_id } = params;

  // Validasi property_id wajib
  if (!property_id) {
    res.status(400).json({
      success: false,
      message: "property_id harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id);

  // Validasi property_id format angka
  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "property_id harus berupa angka yang valid",
    });
    return null;
  }

  return {
    propertyId,
  };
};

export const validateUpdatePropertyParams = (
  params: UpdatePropertyParams,
  body: UpdatePropertyParams,
  res: Response
): ValidatedUpdatePropertyParams | null => {
  // Ambil property_id dari params URL
  const { property_id } = params;

  // Validasi property_id wajib
  if (!property_id) {
    res.status(400).json({
      success: false,
      message: "property_id harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id);

  // Validasi property_id format angka
  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "property_id harus berupa angka yang valid",
    });
    return null;
  }

  // Ambil data yang akan diupdate dari body
  const { name, description, location, category_id, city_id } = body;

  // Minimal harus ada satu field yang akan diupdate
  if (!name && !description && !location && !category_id && !city_id) {
    res.status(400).json({
      success: false,
      message: "Minimal satu field harus diisi untuk update",
    });
    return null;
  }

  const result: ValidatedUpdatePropertyParams = {
    propertyId,
  };

  // Validasi field yang akan diupdate jika ada
  if (name !== undefined) {
    if (name.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Nama property minimal 3 karakter",
      });
      return null;
    }
    result.name = name.trim();
  }

  if (description !== undefined) {
    if (description.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: "Deskripsi property minimal 10 karakter",
      });
      return null;
    }
    result.description = description.trim();
  }

  if (location !== undefined) {
    if (location.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Lokasi property minimal 3 karakter",
      });
      return null;
    }
    result.location = location.trim();
  }

  // Validasi category_id jika ada
  if (category_id !== undefined) {
    const categoryId = parseInt(category_id);
    if (isNaN(categoryId) || categoryId <= 0) {
      res.status(400).json({
        success: false,
        message: "category_id harus berupa angka yang valid",
      });
      return null;
    }
    result.categoryId = categoryId;
  }

  // Validasi city_id jika ada
  if (city_id !== undefined) {
    const cityId = parseInt(city_id);
    if (isNaN(cityId) || cityId <= 0) {
      res.status(400).json({
        success: false,
        message: "city_id harus berupa angka yang valid",
      });
      return null;
    }
    result.cityId = cityId;
  }

  return result;
};

export const validatePropertyEditParams = (
  params: PropertyEditParams,
  res: Response
): ValidatedPropertyEditParams | null => {
  const { property_id } = params;

  if (!property_id) {
    res.status(400).json({
      success: false,
      message: "Property ID harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id);

  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  return {
    propertyId,
  };
};

interface DeletePropertyParams {
  property_id?: string;
}

export interface ValidatedDeletePropertyParams {
  propertyId: number;
}

export const validateDeletePropertyParams = (
  params: DeletePropertyParams,
  res: Response
): ValidatedDeletePropertyParams | null => {
  const { property_id } = params;

  if (!property_id) {
    res.status(400).json({
      success: false,
      message: "Property ID harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id);

  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  return {
    propertyId,
  };
};

interface CreateRoomParams {
  name?: string;
  description?: string;
  price?: string;
  max_guests?: string;
  quantity?: string;
  property_id?: string;
}

export interface ValidatedCreateRoomParams {
  name: string;
  description: string;
  price: number;
  maxGuests: number;
  quantity: number;
  propertyId: number;
}

export const validateCreateRoomParams = (
  body: CreateRoomParams,
  res: Response
): ValidatedCreateRoomParams | null => {
  const { name, description, price, max_guests, quantity, property_id } = body;

  // Validasi input wajib
  if (!name || !description || !price || !max_guests || !property_id) {
    res.status(400).json({
      success: false,
      message:
        "name, description, price, max_guests, dan property_id harus diisi",
    });
    return null;
  }

  // Validasi nama room
  if (name.trim().length < 2 || name.trim().length > 100) {
    res.status(400).json({
      success: false,
      message: "Nama room harus antara 2-100 karakter",
    });
    return null;
  }

  // Validasi deskripsi
  if (description.trim().length < 10 || description.trim().length > 1000) {
    res.status(400).json({
      success: false,
      message: "Deskripsi harus antara 10-1000 karakter",
    });
    return null;
  }

  // Validasi harga
  const priceNumber = parseInt(price);
  if (isNaN(priceNumber) || priceNumber <= 0) {
    res.status(400).json({
      success: false,
      message: "Harga harus berupa angka positif",
    });
    return null;
  }

  // Validasi max guests
  const maxGuestsNumber = parseInt(max_guests);
  if (isNaN(maxGuestsNumber) || maxGuestsNumber <= 0 || maxGuestsNumber > 50) {
    res.status(400).json({
      success: false,
      message: "Jumlah maksimal tamu harus antara 1-50",
    });
    return null;
  }

  // Validasi quantity (default 1 jika tidak diisi)
  const quantityNumber = quantity ? parseInt(quantity) : 1;
  if (isNaN(quantityNumber) || quantityNumber <= 0 || quantityNumber > 100) {
    res.status(400).json({
      success: false,
      message: "Jumlah room harus antara 1-100",
    });
    return null;
  }

  // Validasi property_id
  const propertyIdNumber = parseInt(property_id);
  if (isNaN(propertyIdNumber) || propertyIdNumber <= 0) {
    res.status(400).json({
      success: false,
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  return {
    name: name.trim(),
    description: description.trim(),
    price: priceNumber,
    maxGuests: maxGuestsNumber,
    quantity: quantityNumber,
    propertyId: propertyIdNumber,
  };
};

interface OwnedRoomsParams {
  page?: string;
  property_id?: string;
  all?: string;
}

export interface ValidatedOwnedRoomsParams {
  page: number;
  propertyId?: number;
  all: boolean;
}

export const validateOwnedRoomsParams = (
  query: OwnedRoomsParams,
  res: Response
): ValidatedOwnedRoomsParams | null => {
  // Ambil parameter
  const { page, property_id, all } = query;

  // Cek apakah parameter all=true
  const allFlag = typeof all === "string" && all.toLowerCase() === "true";

  // Jika all=true, abaikan pagination (kembalikan page=1 sebagai placeholder)
  if (allFlag) {
    // Validasi property_id jika ada
    let propertyId: number | undefined;
    if (property_id) {
      propertyId = parseInt(property_id);
      if (isNaN(propertyId) || propertyId <= 0) {
        res.status(400).json({
          success: false,
          message: "Property ID harus berupa angka positif",
        });
        return null;
      }
    }

    return {
      page: 1,
      propertyId,
      all: true,
    };
  }

  // Jika all !== true, lakukan validasi pagination normal
  const pageNumber = parseInt(page as string) || 1;
  if (pageNumber < 1) {
    res.status(400).json({
      success: false,
      message: "Page number harus lebih besar dari 0",
    });
    return null;
  }

  // Validasi property_id jika ada
  let propertyId: number | undefined;
  if (property_id) {
    propertyId = parseInt(property_id);
    if (isNaN(propertyId) || propertyId <= 0) {
      res.status(400).json({
        success: false,
        message: "Property ID harus berupa angka positif",
      });
      return null;
    }
  }

  return {
    page: pageNumber,
    propertyId,
    all: false,
  };
};

interface RoomEditParams {
  room_id?: string;
}

export interface ValidatedRoomEditParams {
  roomId: number;
}

export const validateRoomEditParams = (
  params: RoomEditParams,
  res: Response
): ValidatedRoomEditParams | null => {
  const { room_id } = params;

  if (!room_id) {
    res.status(400).json({
      success: false,
      message: "Room ID harus diisi",
    });
    return null;
  }

  const roomId = parseInt(room_id);

  if (isNaN(roomId) || roomId <= 0) {
    res.status(400).json({
      success: false,
      message: "Room ID harus berupa angka positif",
    });
    return null;
  }

  return {
    roomId,
  };
};

interface UpdateRoomParams {
  room_id?: string;
  name?: string;
  description?: string;
  price?: string;
  max_guests?: string;
  quantity?: string;
}

export interface ValidatedUpdateRoomParams {
  roomId: number;
  name?: string;
  description?: string;
  price?: number;
  maxGuests?: number;
  quantity?: number;
}

export const validateUpdateRoomParams = (
  params: UpdateRoomParams,
  body: UpdateRoomParams,
  res: Response
): ValidatedUpdateRoomParams | null => {
  // Ambil room_id dari params URL
  const { room_id } = params;

  // Validasi room_id wajib
  if (!room_id) {
    res.status(400).json({
      success: false,
      message: "Room ID harus diisi",
    });
    return null;
  }

  const roomId = parseInt(room_id);

  // Validasi room_id format angka
  if (isNaN(roomId) || roomId <= 0) {
    res.status(400).json({
      success: false,
      message: "Room ID harus berupa angka positif",
    });
    return null;
  }

  // Ambil data yang akan diupdate dari body
  const { name, description, price, max_guests, quantity } = body;

  // Minimal harus ada satu field yang akan diupdate
  if (!name && !description && !price && !max_guests && !quantity) {
    res.status(400).json({
      success: false,
      message: "Minimal satu field harus diisi untuk update",
    });
    return null;
  }

  const result: ValidatedUpdateRoomParams = {
    roomId,
  };

  // Validasi field yang akan diupdate jika ada
  if (name !== undefined) {
    if (name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: "Nama room harus antara 2-100 karakter",
      });
      return null;
    }
    result.name = name.trim();
  }

  if (description !== undefined) {
    if (description.trim().length < 10 || description.trim().length > 1000) {
      res.status(400).json({
        success: false,
        message: "Deskripsi harus antara 10-1000 karakter",
      });
      return null;
    }
    result.description = description.trim();
  }

  // Validasi price jika ada
  if (price !== undefined) {
    const priceNumber = parseInt(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      res.status(400).json({
        success: false,
        message: "Harga harus berupa angka positif",
      });
      return null;
    }
    result.price = priceNumber;
  }

  // Validasi max_guests jika ada
  if (max_guests !== undefined) {
    const maxGuestsNumber = parseInt(max_guests);
    if (
      isNaN(maxGuestsNumber) ||
      maxGuestsNumber <= 0 ||
      maxGuestsNumber > 50
    ) {
      res.status(400).json({
        success: false,
        message: "Jumlah maksimal tamu harus antara 1-50",
      });
      return null;
    }
    result.maxGuests = maxGuestsNumber;
  }

  // Validasi quantity jika ada
  if (quantity !== undefined) {
    const quantityNumber = parseInt(quantity);
    if (isNaN(quantityNumber) || quantityNumber <= 0 || quantityNumber > 100) {
      res.status(400).json({
        success: false,
        message: "Jumlah room harus antara 1-100",
      });
      return null;
    }
    result.quantity = quantityNumber;
  }

  return result;
};

interface DeleteRoomParams {
  room_id?: string;
}

export interface ValidatedDeleteRoomParams {
  roomId: number;
}

export const validateDeleteRoomParams = (
  params: DeleteRoomParams,
  res: Response
): ValidatedDeleteRoomParams | null => {
  const { room_id } = params;

  if (!room_id) {
    res.status(400).json({
      success: false,
      message: "Room ID harus diisi",
    });
    return null;
  }

  const roomId = parseInt(room_id);

  if (isNaN(roomId) || roomId <= 0) {
    res.status(400).json({
      success: false,
      message: "Room ID harus berupa angka positif",
    });
    return null;
  }

  return {
    roomId,
  };
};

// Room Unavailabilities Validation Interfaces and Functions

interface GetUnavailabilitiesParams {
  property_id?: string;
  page?: string;
}

export interface ValidatedGetUnavailabilitiesParams {
  propertyId: number;
  page: number;
}

export const validateGetUnavailabilitiesParams = (
  query: GetUnavailabilitiesParams,
  res: Response
): ValidatedGetUnavailabilitiesParams | null => {
  const { property_id, page } = query;

  // Validasi property_id wajib
  if (!property_id) {
    res.status(400).json({
      success: false,
      message: "Property ID harus diisi",
    });
    return null;
  }

  const propertyId = parseInt(property_id);

  if (isNaN(propertyId) || propertyId <= 0) {
    res.status(400).json({
      success: false,
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  // Validasi page (default 1)
  const pageNumber = parseInt(page as string) || 1;

  if (pageNumber < 1) {
    res.status(400).json({
      success: false,
      message: "Page number harus lebih besar dari 0",
    });
    return null;
  }

  return {
    propertyId,
    page: pageNumber,
  };
};

interface CreateUnavailabilityParams {
  room_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface ValidatedCreateUnavailabilityParams {
  roomId: number;
  startDate: Date;
  endDate: Date;
}

export const validateCreateUnavailabilityParams = (
  body: CreateUnavailabilityParams,
  res: Response
): ValidatedCreateUnavailabilityParams | null => {
  const { room_id, start_date, end_date } = body;

  // Validasi room_id wajib
  if (!room_id) {
    res.status(400).json({
      success: false,
      message: "Room ID harus diisi",
    });
    return null;
  }

  const roomId = parseInt(room_id);

  if (isNaN(roomId) || roomId <= 0) {
    res.status(400).json({
      success: false,
      message: "Room ID harus berupa angka positif",
    });
    return null;
  }

  // Validasi start_date wajib
  if (!start_date) {
    res.status(400).json({
      success: false,
      message: "Start date harus diisi",
    });
    return null;
  }

  // Validasi end_date wajib
  if (!end_date) {
    res.status(400).json({
      success: false,
      message: "End date harus diisi",
    });
    return null;
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Validasi format tanggal
  if (isNaN(startDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Format start date tidak valid",
    });
    return null;
  }

  if (isNaN(endDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Format end date tidak valid",
    });
    return null;
  }

  // Validasi tanggal tidak boleh di masa lalu
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (startDate < today) {
    res.status(400).json({
      success: false,
      message: "Tanggal tidak boleh di masa lalu",
    });
    return null;
  }

  // Validasi end_date harus setelah atau sama dengan start_date
  if (endDate < startDate) {
    res.status(400).json({
      success: false,
      message: "End date harus setelah atau sama dengan start date",
    });
    return null;
  }

  // Validasi maksimal 1 tahun ke depan
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  if (endDate > maxDate) {
    res.status(400).json({
      success: false,
      message: "Unavailability tidak boleh lebih dari 1 tahun ke depan",
    });
    return null;
  }

  return {
    roomId,
    startDate,
    endDate,
  };
};

interface DeleteUnavailabilityParams {
  id?: string;
}

export interface ValidatedDeleteUnavailabilityParams {
  unavailabilityId: number;
}

export const validateDeleteUnavailabilityParams = (
  params: DeleteUnavailabilityParams,
  res: Response
): ValidatedDeleteUnavailabilityParams | null => {
  const { id } = params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: "Unavailability ID harus diisi",
    });
    return null;
  }

  const unavailabilityId = parseInt(id);

  if (isNaN(unavailabilityId) || unavailabilityId <= 0) {
    res.status(400).json({
      success: false,
      message: "Unavailability ID harus berupa angka positif",
    });
    return null;
  }

  return {
    unavailabilityId,
  };
};

// ================= Room Unavailabilities LIST by Room =================

interface ListRoomUnavailParams {
  room_id?: string;
  month?: string; // Format YYYY-MM
}

export interface ValidatedListRoomUnavailParams {
  roomId: number;
  startDate: Date;
  endDate: Date;
}

export const validateListRoomUnavailParams = (
  query: ListRoomUnavailParams,
  res: Response
): ValidatedListRoomUnavailParams | null => {
  const { room_id, month } = query;

  // room_id wajib
  if (!room_id) {
    res.status(400).json({
      success: false,
      message: "room_id harus diisi",
    });
    return null;
  }

  const roomId = parseInt(room_id);
  if (isNaN(roomId) || roomId <= 0) {
    res.status(400).json({
      success: false,
      message: "room_id harus berupa angka positif",
    });
    return null;
  }

  // Jika month tidak diisi, gunakan bulan & tahun saat ini
  let year: number;
  let monthIndex: number; // 0-11
  if (month) {
    const match = month.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      res.status(400).json({
        success: false,
        message: "Format month harus YYYY-MM",
      });
      return null;
    }
    year = parseInt(match[1]);
    monthIndex = parseInt(match[2]) - 1; // JS month index
    if (monthIndex < 0 || monthIndex > 11) {
      res.status(400).json({
        success: false,
        message: "Nilai month tidak valid",
      });
      return null;
    }
  } else {
    const today = new Date();
    year = today.getUTCFullYear();
    monthIndex = today.getUTCMonth();
  }

  // Hitung startDate dan endDate (awal bulan, awal bulan berikutnya)
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 1)); // exclusive

  return {
    roomId,
    startDate,
    endDate,
  };
};

// ================= Peak Season Rates Validation =================

interface ListPeakSeasonParams {
  room_id?: string;
  month?: string; // optional YYYY-MM
}

export interface ValidatedListPeakSeasonParams {
  roomId: number;
  startDate?: Date; // inclusive
  endDate?: Date; // exclusive
}

export const validateListPeakSeasonParams = (
  query: ListPeakSeasonParams,
  res: Response
): ValidatedListPeakSeasonParams | null => {
  const { room_id, month } = query;

  if (!room_id) {
    res.status(400).json({ success: false, message: "room_id harus diisi" });
    return null;
  }
  const roomId = parseInt(room_id);
  if (isNaN(roomId) || roomId <= 0) {
    res
      .status(400)
      .json({ success: false, message: "room_id harus berupa angka positif" });
    return null;
  }

  if (month) {
    const match = month.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      res
        .status(400)
        .json({ success: false, message: "Format month harus YYYY-MM" });
      return null;
    }
    const year = parseInt(match[1]);
    const monthIndex = parseInt(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
      res
        .status(400)
        .json({ success: false, message: "Nilai month tidak valid" });
      return null;
    }
    const startDate = new Date(Date.UTC(year, monthIndex, 1));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));
    return { roomId, startDate, endDate };
  }

  // tanpa filter bulan
  return { roomId };
};

interface CreatePeakSeasonParams {
  room_id?: string;
  type?: string;
  value?: string;
  start_date?: string;
  end_date?: string;
}

export interface ValidatedCreatePeakSeasonParams {
  roomId: number;
  type: "percentage" | "fixed";
  value: number;
  startDate: Date;
  endDate: Date;
}

export const validateCreatePeakSeasonParams = (
  body: CreatePeakSeasonParams,
  res: Response
): ValidatedCreatePeakSeasonParams | null => {
  const { room_id, type, value, start_date, end_date } = body;

  if (!room_id || !type || !value || !start_date || !end_date) {
    res.status(400).json({
      success: false,
      message: "room_id, type, value, start_date, end_date wajib diisi",
    });
    return null;
  }
  const roomId = parseInt(room_id);
  if (isNaN(roomId) || roomId <= 0) {
    res
      .status(400)
      .json({ success: false, message: "room_id harus berupa angka positif" });
    return null;
  }

  if (type !== "percentage" && type !== "fixed") {
    res.status(400).json({
      success: false,
      message: "type harus 'percentage' atau 'fixed'",
    });
    return null;
  }

  const valNumber = parseInt(value);
  if (isNaN(valNumber) || valNumber <= 0) {
    res
      .status(400)
      .json({ success: false, message: "value harus berupa angka positif" });
    return null;
  }
  if (type === "percentage" && valNumber > 100) {
    res
      .status(400)
      .json({ success: false, message: "value persen tidak boleh > 100" });
    return null;
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res
      .status(400)
      .json({ success: false, message: "Format tanggal tidak valid" });
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (startDate < today) {
    res
      .status(400)
      .json({ success: false, message: "Tanggal tidak boleh di masa lalu" });
    return null;
  }
  if (endDate < startDate) {
    res.status(400).json({
      success: false,
      message: "end_date harus setelah atau sama dengan start_date",
    });
    return null;
  }

  return { roomId, type, value: valNumber, startDate, endDate };
};

export const validateUpdatePeakSeasonParams = (
  params: UpdatePeakSeasonParams,
  body: UpdatePeakSeasonBody,
  res: Response
): ValidatedUpdatePeakSeasonParams | null => {
  const { id } = params;
  if (!id) {
    res.status(400).json({ success: false, message: "ID harus diisi" });
    return null;
  }
  const rateId = parseInt(id);
  if (isNaN(rateId) || rateId <= 0) {
    res
      .status(400)
      .json({ success: false, message: "ID harus berupa angka positif" });
    return null;
  }

  const { type, value, start_date, end_date } = body;
  if (
    type === undefined &&
    value === undefined &&
    start_date === undefined &&
    end_date === undefined
  ) {
    res
      .status(400)
      .json({ success: false, message: "Minimal satu field harus diupdate" });
    return null;
  }

  const result: ValidatedUpdatePeakSeasonParams = { id: rateId };
  if (type !== undefined) {
    if (type !== "percentage" && type !== "fixed") {
      res.status(400).json({
        success: false,
        message: "type harus 'percentage' atau 'fixed'",
      });
      return null;
    }
    result.type = type;
  }
  if (value !== undefined) {
    const valNum = parseInt(String(value));
    if (isNaN(valNum) || valNum <= 0) {
      res
        .status(400)
        .json({ success: false, message: "value harus angka positif" });
      return null;
    }
    if (
      result.type === "percentage" ||
      (type === undefined && value !== undefined)
    ) {
      // ketika type percentage
      const pctType = result.type === "percentage" || type === "percentage";
      if (pctType && valNum > 100) {
        res
          .status(400)
          .json({ success: false, message: "value persen tidak boleh > 100" });
        return null;
      }
    }
    result.value = valNum;
  }
  if (start_date !== undefined) {
    const sd = new Date(start_date);
    if (isNaN(sd.getTime())) {
      res
        .status(400)
        .json({ success: false, message: "Format start_date tidak valid" });
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sd.setHours(0, 0, 0, 0);
    if (sd < today) {
      res.status(400).json({
        success: false,
        message: "Tanggal tidak boleh di masa lalu",
      });
      return null;
    }
    result.startDate = sd;
  }
  if (end_date !== undefined) {
    const ed = new Date(end_date);
    if (isNaN(ed.getTime())) {
      res
        .status(400)
        .json({ success: false, message: "Format end_date tidak valid" });
      return null;
    }
    if (result.startDate && ed < result.startDate) {
      res
        .status(400)
        .json({ success: false, message: "end_date harus ≥ start_date" });
      return null;
    }
    result.endDate = ed;
  }

  // if only endDate set but startDate previously unsupplied, we will validate in query when mixing existing data.

  return result;
};

interface DeletePeakSeasonParams {
  id?: string;
}

export interface ValidatedDeletePeakSeasonParams {
  id: number;
}

export const validateDeletePeakSeasonParams = (
  params: DeletePeakSeasonParams,
  res: Response
): ValidatedDeletePeakSeasonParams | null => {
  const { id } = params;
  if (!id) {
    res.status(400).json({ success: false, message: "ID harus diisi" });
    return null;
  }
  const rateId = parseInt(id);
  if (isNaN(rateId) || rateId <= 0) {
    res
      .status(400)
      .json({ success: false, message: "ID harus berupa angka positif" });
    return null;
  }
  return { id: rateId };
};
