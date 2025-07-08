import { Response } from "express";
import { ProcessedProperty, PropertyDetail } from "./propertyProcessor";

export const sendSuccessResponse = (
  res: Response,
  data: ProcessedProperty[],
  categories: any[],
  pagination: any
) => {
  res.status(200).json({
    success: true,
    message: "Properties berhasil ditemukan",
    data,
    categories,
    pagination,
  });
};

export const sendEmptyResponse = (res: Response, pageNumber: number) => {
  res.status(404).json({
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

export const sendErrorResponse = (res: Response, error: any) => {
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

export const sendCalendarResponse = (res: Response, calendarData: any) => {
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
  categories: any[]
) => {
  res.status(200).json({
    success: true,
    message: "Property categories berhasil ditemukan",
    data: categories,
    total: categories.length,
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
