import { Response } from "express";

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
}

export interface ValidatedMyPropertiesParams {
  page: number;
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
  query: any,
  params: any,
  res: Response
): ValidatedCalendarParams | null => {
  const { propertyId } = params;
  const { year, month } = query;

  // Validate propertyId
  const parsedPropertyId = parseInt(propertyId);
  if (isNaN(parsedPropertyId) || parsedPropertyId <= 0) {
    res.status(400).json({
      status: "error",
      message: "Property ID harus berupa angka positif",
    });
    return null;
  }

  // Validate year
  const parsedYear = parseInt(year);
  if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2030) {
    res.status(400).json({
      status: "error",
      message: "Year harus berupa angka antara 2020-2030",
    });
    return null;
  }

  // Validate month
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

  // tenant_id adalah optional, jika ada validasi format UUID
  if (tenant_id && typeof tenant_id !== "string") {
    res.status(400).json({
      success: false,
      message: "tenant_id harus berupa string UUID yang valid",
    });
    return null;
  }

  // Validasi format UUID jika tenant_id ada
  if (tenant_id) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenant_id)) {
      res.status(400).json({
        success: false,
        message: "tenant_id harus berupa UUID yang valid",
      });
      return null;
    }
  }

  return {
    tenantId: tenant_id,
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
  const { page } = query;

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
}

export interface ValidatedOwnedRoomsParams {
  page: number;
}

export const validateOwnedRoomsParams = (
  query: OwnedRoomsParams,
  res: Response
): ValidatedOwnedRoomsParams | null => {
  const { page } = query;

  // Validasi page number
  const pageNumber = parseInt(page as string) || 1;
  if (pageNumber < 1) {
    res.status(400).json({
      success: false,
      message: "Page number harus lebih besar dari 0",
    });
    return null;
  }

  return {
    page: pageNumber,
  };
};
