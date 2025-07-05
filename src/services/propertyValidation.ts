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
