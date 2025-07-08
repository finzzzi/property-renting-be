import { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { storageService } from "../services/storageService";

const prisma = new PrismaClient();

// Helper functions for responses
const createSuccessResponse = (data: any) => ({
  success: true,
  data: data,
});

const createErrorResponse = (message: string) => ({
  success: false,
  message: message,
});

// Helper function to handle database constraint errors
const handleDatabaseError = (
  error: any
): { status: number; message: string } => {
  // Handle main picture constraint
  if (
    error.message &&
    (error.message.includes(
      "Only one picture can be marked as main for a property"
    ) ||
      error.message.includes("Only one picture can be marked as main"))
  ) {
    return {
      status: 400,
      message:
        "Hanya satu foto yang dapat dijadikan foto utama untuk setiap properti",
    };
  }

  // Handle picture limit constraint
  if (
    error.message &&
    error.message.includes(
      "Only up to 4 non-main pictures are allowed per property"
    )
  ) {
    return {
      status: 400,
      message: "Setiap properti maksimal 5 foto (1 utama dan 4 tambahan)",
    };
  }

  // Handle room picture constraint
  if (
    error.message &&
    error.message.includes("Each room can have only one picture")
  ) {
    return {
      status: 400,
      message: "Setiap room hanya dapat memiliki satu foto",
    };
  }

  // Handle Prisma constraint errors
  if (error.code === "P0001") {
    if (error.message.includes("Only one picture can be marked as main")) {
      return {
        status: 400,
        message:
          "Hanya satu foto yang dapat dijadikan foto utama untuk setiap properti",
      };
    }
    if (error.message.includes("Only up to 4 non-main pictures are allowed")) {
      return {
        status: 400,
        message: "Setiap properti maksimal 5 foto (1 utama dan 4 tambahan)",
      };
    }
    if (error.message.includes("Each room can have only one picture")) {
      return {
        status: 400,
        message: "Setiap room hanya dapat memiliki satu foto",
      };
    }
    // Handle other P0001 errors
    return {
      status: 400,
      message: "Terjadi kesalahan constraint database",
    };
  }

  // Handle foreign key constraint
  if (error.code === "P2003") {
    return {
      status: 400,
      message: "Data yang direferensikan tidak ditemukan",
    };
  }

  // Handle unique constraint
  if (error.code === "P2002") {
    return {
      status: 400,
      message: "Data sudah ada, tidak dapat menduplikasi",
    };
  }

  // Default error
  return {
    status: 500,
    message: "Terjadi kesalahan internal server",
  };
};

export class PictureController {
  // === PROPERTY PICTURES ===

  // Upload property picture
  async uploadPropertyPicture(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { isMain } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json(createErrorResponse("File harus diupload"));
        return;
      }

      // Validate property exists and user owns it
      const property = await prisma.properties.findFirst({
        where: {
          id: parseInt(propertyId),
          tenant_id: req.user?.id,
        },
      });

      if (!property) {
        res
          .status(404)
          .json(
            createErrorResponse(
              "Properti tidak ditemukan atau Anda tidak memiliki akses"
            )
          );
        return;
      }

      // Get access token from request header
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      // Upload file to storage
      const uploadResult = await storageService.uploadPropertyPicture(
        file,
        property.id,
        accessToken
      );

      // Save to database
      const picture = await prisma.property_pictures.create({
        data: {
          property_id: property.id,
          file_path: uploadResult.filePath,
          is_main: isMain === "true" || isMain === true,
        },
      });

      res.status(201).json(
        createSuccessResponse({
          id: picture.id,
          file_path: picture.file_path,
          public_url: uploadResult.publicUrl,
          is_main: picture.is_main,
          created_at: picture.created_at,
        })
      );
    } catch (error: any) {
      console.error("Error uploading property picture:", error);

      const errorResult = handleDatabaseError(error);
      res
        .status(errorResult.status)
        .json(createErrorResponse(errorResult.message));
    }
  }

  // Get property pictures
  async getPropertyPictures(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;

      // Validate property exists
      const property = await prisma.properties.findFirst({
        where: {
          id: parseInt(propertyId),
        },
      });

      if (!property) {
        res.status(404).json(createErrorResponse("Properti tidak ditemukan"));
        return;
      }

      const pictures = await prisma.property_pictures.findMany({
        where: { property_id: parseInt(propertyId) },
        orderBy: [{ is_main: "desc" }, { created_at: "asc" }],
      });

      // Add public URLs
      const picturesWithUrls = pictures.map((picture: any) => ({
        ...picture,
        public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/property-pictures/${picture.file_path}`,
      }));

      res.json(createSuccessResponse(picturesWithUrls));
    } catch (error) {
      console.error("Error getting property pictures:", error);
      res
        .status(500)
        .json(createErrorResponse("Gagal mengambil foto properti"));
    }
  }

  // Delete property picture
  async deletePropertyPicture(req: Request, res: Response): Promise<void> {
    try {
      const { pictureId } = req.params;

      // Find picture and validate ownership
      const picture = await prisma.property_pictures.findFirst({
        where: { id: parseInt(pictureId) },
        include: {
          properties: {
            select: {
              tenant_id: true,
            },
          },
        },
      });

      if (!picture) {
        res.status(404).json(createErrorResponse("Foto tidak ditemukan"));
        return;
      }

      if (picture.properties.tenant_id !== req.user?.id) {
        res
          .status(403)
          .json(
            createErrorResponse(
              "Anda tidak memiliki akses untuk menghapus foto ini"
            )
          );
        return;
      }

      // Get access token from request header
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      // Delete from storage
      await storageService.deletePropertyPicture(
        picture.file_path,
        accessToken
      );

      // Delete from database
      await prisma.property_pictures.delete({
        where: { id: parseInt(pictureId) },
      });

      res.json(createSuccessResponse({ message: "Foto berhasil dihapus" }));
    } catch (error) {
      console.error("Error deleting property picture:", error);
      res
        .status(500)
        .json(createErrorResponse("Gagal menghapus foto properti"));
    }
  }

  // === ROOM PICTURES ===

  // Upload room picture
  async uploadRoomPicture(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json(createErrorResponse("File harus diupload"));
        return;
      }

      // Validate room exists and user owns the property
      const room = await prisma.rooms.findFirst({
        where: {
          id: parseInt(roomId),
        },
        include: {
          properties: {
            select: {
              tenant_id: true,
            },
          },
        },
      });

      if (!room) {
        res.status(404).json(createErrorResponse("Room tidak ditemukan"));
        return;
      }

      if (room.properties?.tenant_id !== req.user?.id) {
        res
          .status(403)
          .json(
            createErrorResponse("Anda tidak memiliki akses untuk room ini")
          );
        return;
      }

      // Get access token from request header
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      // Upload file to storage
      const uploadResult = await storageService.uploadRoomPicture(
        file,
        room.id,
        accessToken
      );

      // Save to database
      const picture = await prisma.room_pictures.create({
        data: {
          room_id: room.id,
          file_path: uploadResult.filePath,
        },
      });

      res.status(201).json(
        createSuccessResponse({
          id: picture.id,
          file_path: picture.file_path,
          public_url: uploadResult.publicUrl,
          created_at: picture.created_at,
        })
      );
    } catch (error: any) {
      console.error("Error uploading room picture:", error);

      const errorResult = handleDatabaseError(error);
      res
        .status(errorResult.status)
        .json(createErrorResponse(errorResult.message));
    }
  }

  // Get room pictures
  async getRoomPictures(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      // Validate room exists
      const room = await prisma.rooms.findFirst({
        where: {
          id: parseInt(roomId),
        },
      });

      if (!room) {
        res.status(404).json(createErrorResponse("Room tidak ditemukan"));
        return;
      }

      const pictures = await prisma.room_pictures.findMany({
        where: { room_id: parseInt(roomId) },
        orderBy: { created_at: "asc" },
      });

      // Add public URLs
      const picturesWithUrls = pictures.map((picture: any) => ({
        ...picture,
        public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/room-pictures/${picture.file_path}`,
      }));

      res.json(createSuccessResponse(picturesWithUrls));
    } catch (error) {
      console.error("Error getting room pictures:", error);
      res.status(500).json(createErrorResponse("Gagal mengambil foto room"));
    }
  }

  // Delete room picture
  async deleteRoomPicture(req: Request, res: Response): Promise<void> {
    try {
      const { pictureId } = req.params;

      // Find picture and validate ownership
      const picture = await prisma.room_pictures.findFirst({
        where: { id: parseInt(pictureId) },
        include: {
          rooms: {
            include: {
              properties: {
                select: {
                  tenant_id: true,
                },
              },
            },
          },
        },
      });

      if (!picture) {
        res.status(404).json(createErrorResponse("Foto tidak ditemukan"));
        return;
      }

      if (picture.rooms?.properties?.tenant_id !== req.user?.id) {
        res
          .status(403)
          .json(
            createErrorResponse(
              "Anda tidak memiliki akses untuk menghapus foto ini"
            )
          );
        return;
      }

      // Get access token from request header
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      // Delete from storage
      if (picture.file_path) {
        await storageService.deleteRoomPicture(picture.file_path, accessToken);
      }

      // Delete from database
      await prisma.room_pictures.delete({
        where: { id: parseInt(pictureId) },
      });

      res.json(createSuccessResponse({ message: "Foto berhasil dihapus" }));
    } catch (error) {
      console.error("Error deleting room picture:", error);
      res.status(500).json(createErrorResponse("Gagal menghapus foto room"));
    }
  }

  // === HELPER METHODS ===

  // Get properties list for dropdown
  async getPropertiesList(req: Request, res: Response): Promise<void> {
    try {
      const properties = await prisma.properties.findMany({
        where: {
          tenant_id: req.user?.id,
        },
        select: {
          id: true,
          name: true,
          location: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json(createSuccessResponse(properties));
    } catch (error) {
      console.error("Error getting properties list:", error);
      res
        .status(500)
        .json(createErrorResponse("Gagal mengambil daftar properti"));
    }
  }

  // Get rooms list for dropdown
  async getRoomsList(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;

      const rooms = await prisma.rooms.findMany({
        where: {
          property_id: parseInt(propertyId),
          properties: {
            tenant_id: req.user?.id,
          },
        },
        select: {
          id: true,
          name: true,
          max_guests: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json(createSuccessResponse(rooms));
    } catch (error) {
      console.error("Error getting rooms list:", error);
      res.status(500).json(createErrorResponse("Gagal mengambil daftar room"));
    }
  }

  // === LIST ALL PICTURES ===

  // Get all property pictures from user's properties (with optional property_id filter)
  async getAllPropertyPictures(req: Request, res: Response): Promise<void> {
    try {
      const { property_id } = req.query;

      // Build where condition
      const whereCondition: any = {
        properties: {
          tenant_id: req.user?.id,
        },
      };

      // Add property_id filter if provided
      if (property_id) {
        const propertyIdInt = parseInt(property_id as string);
        if (isNaN(propertyIdInt)) {
          res
            .status(400)
            .json(createErrorResponse("Property ID harus berupa angka"));
          return;
        }
        whereCondition.property_id = propertyIdInt;
      }

      const pictures = await prisma.property_pictures.findMany({
        where: whereCondition,
        include: {
          properties: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: [
          { properties: { name: "asc" } },
          { is_main: "desc" },
          { created_at: "asc" },
        ],
      });

      // Add public URLs
      const picturesWithUrls = pictures.map((picture: any) => ({
        id: picture.id,
        property_id: picture.property_id,
        file_path: picture.file_path,
        is_main: picture.is_main,
        created_at: picture.created_at,
        public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/property-pictures/${picture.file_path}`,
        property: picture.properties,
      }));

      res.json(createSuccessResponse(picturesWithUrls));
    } catch (error) {
      console.error("Error getting all property pictures:", error);
      res
        .status(500)
        .json(createErrorResponse("Gagal mengambil semua foto properti"));
    }
  }

  // Get all rooms with their pictures from user's properties (with optional property_id filter)
  async getAllRoomPictures(req: Request, res: Response): Promise<void> {
    try {
      const { property_id } = req.query;

      // If property_id filter is provided, handle specific property case
      if (property_id) {
        const propertyIdInt = parseInt(property_id as string);
        if (isNaN(propertyIdInt)) {
          res
            .status(400)
            .json(createErrorResponse("Property ID harus berupa angka"));
          return;
        }

        // First, check if property exists and user owns it
        const property = await prisma.properties.findFirst({
          where: {
            id: propertyIdInt,
            tenant_id: req.user?.id,
          },
          select: {
            id: true,
            name: true,
            location: true,
          },
        });

        if (!property) {
          res
            .status(404)
            .json(
              createErrorResponse(
                "Properti tidak ditemukan atau Anda tidak memiliki akses"
              )
            );
          return;
        }

        // Get rooms for this property
        const rooms = await prisma.rooms.findMany({
          where: {
            property_id: propertyIdInt,
          },
          include: {
            room_pictures: {
              orderBy: {
                created_at: "asc",
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        // If no rooms found, return property info with empty rooms
        if (rooms.length === 0) {
          res.json(
            createSuccessResponse({
              property: property,
              rooms: [],
              message: "Properti ini belum memiliki room",
            })
          );
          return;
        }

        // Format rooms with picture data
        const roomsWithPictureData = rooms.map((room: any) => {
          const pictures = room.room_pictures.map((picture: any) => ({
            id: picture.id,
            file_path: picture.file_path,
            created_at: picture.created_at,
            public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/room-pictures//${picture.file_path}`,
          }));

          return {
            id: room.id,
            name: room.name,
            max_guests: room.max_guests,
            property_id: room.property_id,
            property: property,
            pictures: pictures,
            has_pictures: pictures.length > 0,
          };
        });

        res.json(
          createSuccessResponse({
            property: property,
            rooms: roomsWithPictureData,
          })
        );
        return;
      }

      // If no property_id filter, get all rooms from all user's properties
      const rooms = await prisma.rooms.findMany({
        where: {
          properties: {
            tenant_id: req.user?.id,
          },
        },
        include: {
          properties: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          room_pictures: {
            orderBy: {
              created_at: "asc",
            },
          },
        },
        orderBy: [{ properties: { name: "asc" } }, { name: "asc" }],
      });

      // Format response with picture data
      const roomsWithPictureData = rooms.map((room: any) => {
        const pictures = room.room_pictures.map((picture: any) => ({
          id: picture.id,
          file_path: picture.file_path,
          created_at: picture.created_at,
          public_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/room-pictures/${picture.file_path}`,
        }));

        return {
          id: room.id,
          name: room.name,
          max_guests: room.max_guests,
          property_id: room.property_id,
          property: room.properties,
          pictures: pictures,
          has_pictures: pictures.length > 0,
        };
      });

      res.json(createSuccessResponse(roomsWithPictureData));
    } catch (error) {
      console.error("Error getting all rooms with pictures:", error);
      res
        .status(500)
        .json(createErrorResponse("Gagal mengambil data room dengan foto"));
    }
  }
}

export const pictureController = new PictureController();
