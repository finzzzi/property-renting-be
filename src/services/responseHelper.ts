import { Response } from "express";
import {
  ProcessedProperty,
  PropertyDetail,
  CategoryData,
  CalendarData,
  PaginationOptions,
  PrismaCategoryResult,
  PartialPropertyCategory,
} from "./propertyInterfaces";

export interface SearchPagination {
  current_page: number;
  total_pages: number;
  total_properties: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export const sendSuccessResponse = (
  res: Response,
  data: ProcessedProperty[],
  categories: (PartialPropertyCategory | null)[],
  pagination: SearchPagination
) => {
  // Filter dan transform categories
  const transformedCategories: CategoryData[] = categories
    .filter((cat): cat is PartialPropertyCategory => cat !== null)
    .map((cat, index) => ({
      id: index + 1, // fallback ID
      name: cat.name,
      properties_count: 0, // fallback count
    }));

  res.status(200).json({
    success: true,
    message: "Properties berhasil ditemukan",
    data,
    categories: transformedCategories,
    pagination,
  });
};

export const sendEmptyResponse = (res: Response, pageNumber: number) => {
  res.status(200).json({
    success: true,
    message: "Tidak ada property yang tersedia untuk kriteria pencarian Anda",
    data: [],
    pagination: {
      current_page: pageNumber,
      total_pages: 0,
      total_properties: 0,
      has_next_page: false,
      has_prev_page: false,
    },
  });
};

export const sendErrorResponse = (res: Response, error: Error | unknown) => {
  console.error("Error in searchProperties:", error);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server",
    error: error instanceof Error ? error.message : "Unknown error",
  });
};

export const sendPropertyDetailResponse = (
  res: Response,
  data: PropertyDetail
) => {
  res.status(200).json({
    success: true,
    message: "Detail property berhasil ditemukan",
    data,
  });
};

export const sendPropertyNotFoundResponse = (res: Response) => {
  res.status(404).json({
    success: false,
    message: "Property tidak ditemukan",
  });
};

export const sendNoAvailableRoomsResponse = (res: Response) => {
  res.status(200).json({
    success: true,
    message:
      "Property ditemukan, tetapi tidak ada kamar yang tersedia untuk kriteria Anda",
    data: null,
  });
};

export const sendCalendarResponse = (
  res: Response,
  calendarData: CalendarData
) => {
  res.status(200).json({
    status: "success",
    data: calendarData,
  });
};

export const sendCalendarNotFoundResponse = (res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Property tidak ditemukan",
  });
};

export const sendCategoriesSuccessResponse = (
  res: Response,
  categories: PrismaCategoryResult[]
) => {
  // Transform categories to include properties_count
  const transformedCategories: CategoryData[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    properties_count: 0, // Bisa ditambahkan query count jika dibutuhkan
  }));

  res.status(200).json({
    success: true,
    message: "Property categories berhasil ditemukan",
    data: transformedCategories,
    total: transformedCategories.length,
  });
};

export const sendCategoriesEmptyResponse = (res: Response) => {
  res.status(200).json({
    success: true,
    message: "Tidak ada property categories yang ditemukan",
    data: [],
    total: 0,
  });
};
