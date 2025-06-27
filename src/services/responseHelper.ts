import { Response } from "express";
import { ProcessedProperty } from "./propertyProcessor";

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

export const sendErrorResponse = (res: Response, error: any) => {
  console.error("Error in searchProperties:", error);
  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan server",
    error: error instanceof Error ? error.message : "Unknown error",
  });
};
