import multer from "multer";
import { Request, Response, NextFunction } from "express";

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa gambar (jpg, jpeg, dan png)"));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1, // Maximum 1 file per request
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");

// Middleware for multiple file uploads
export const uploadMultiple = upload.array("files", 10);

// Error handling middleware for multer
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File terlalu besar. Maksimal 5MB per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Terlalu banyak file. Maksimal 10 file per upload.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          'Field name tidak sesuai. Gunakan "file" untuk single upload atau "files" untuk multiple upload.',
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

// Validation middleware to check if file exists
export const validateFileExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      message: "File harus diupload",
    });
    return;
  }
  next();
};
