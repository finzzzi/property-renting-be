import { supabase } from "./supabaseConfig";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export interface UploadFileOptions {
  file: Express.Multer.File;
  bucket: string;
  folder: string;
  prefix: string;
  id: number;
  accessToken?: string;
}

export interface UploadResult {
  filePath: string;
  publicUrl: string;
  fileName: string;
}

export class StorageService {
  private generateFileName(
    prefix: string,
    id: number,
    originalName: string
  ): string {
    const timestamp = Date.now();
    const randomId = uuidv4().slice(0, 8);
    const extension = path.extname(originalName).toLowerCase();
    return `${prefix}_${id}_${timestamp}_${randomId}${extension}`;
  }

  private getPublicUrl(bucket: string, filePath: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  private getSupabaseClient(accessToken?: string) {
    if (accessToken) {
      // Create authenticated client
      return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );
    }

    // For server-side operations, use service role
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { file, bucket, folder, prefix, id, accessToken } = options;

    // Get appropriate Supabase client
    const client = this.getSupabaseClient(accessToken);

    // Generate unique filename
    const fileName = this.generateFileName(prefix, id, file.originalname);
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const publicUrl = this.getPublicUrl(bucket, filePath);

    return {
      filePath,
      publicUrl,
      fileName,
    };
  }

  async deleteFile(
    bucket: string,
    filePath: string,
    accessToken?: string
  ): Promise<void> {
    const client = this.getSupabaseClient(accessToken);

    const { error } = await client.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async listFiles(
    bucket: string,
    folder: string,
    accessToken?: string
  ): Promise<string[]> {
    const client = this.getSupabaseClient(accessToken);

    const { data, error } = await client.storage.from(bucket).list(folder);

    if (error) {
      throw new Error(`List files failed: ${error.message}`);
    }

    return data?.map((file) => file.name) || [];
  }

  // Helper methods for specific use cases
  async uploadPropertyPicture(
    file: Express.Multer.File,
    propertyId: number,
    accessToken?: string
  ): Promise<UploadResult> {
    return this.uploadFile({
      file,
      bucket: "property-pictures",
      folder: "properties",
      prefix: "property",
      id: propertyId,
      accessToken,
    });
  }

  async uploadRoomPicture(
    file: Express.Multer.File,
    roomId: number,
    accessToken?: string
  ): Promise<UploadResult> {
    return this.uploadFile({
      file,
      bucket: "room-pictures",
      folder: "rooms",
      prefix: "room",
      id: roomId,
      accessToken,
    });
  }

  async deletePropertyPicture(
    filePath: string,
    accessToken?: string
  ): Promise<void> {
    return this.deleteFile("property-pictures", filePath, accessToken);
  }

  async deleteRoomPicture(
    filePath: string,
    accessToken?: string
  ): Promise<void> {
    return this.deleteFile("room-pictures", filePath, accessToken);
  }

  // Avatar upload methods
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
    accessToken?: string
  ): Promise<UploadResult> {
    // Use userId directly since it's a string
    const timestamp = Date.now();
    const randomId = uuidv4().slice(0, 8);
    const extension = path.extname(file.originalname).toLowerCase();
    const fileName = `avatar_${userId}_${timestamp}_${randomId}${extension}`;
    const filePath = `avatars/${fileName}`;

    // Get appropriate Supabase client
    const client = this.getSupabaseClient(accessToken);

    // Upload file to Supabase storage
    const { data, error } = await client.storage
      .from("avatars")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload avatar error:", error);
      throw new Error(`Upload avatar failed: ${error.message}`);
    }

    // Get public URL
    const publicUrl = this.getPublicUrl("avatars", filePath);

    return {
      filePath,
      publicUrl,
      fileName,
    };
  }

  async deleteAvatar(filePath: string, accessToken?: string): Promise<void> {
    return this.deleteFile("avatars", filePath, accessToken);
  }
}

export const storageService = new StorageService();
