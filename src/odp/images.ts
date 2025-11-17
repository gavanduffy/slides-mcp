import { promises as fs } from "fs";
import { join } from "path";
import type { ImageSource } from "../schema/slideshowSchema.js";

export type ImageMap = Record<string, { odpPath: string; mimeType: string }>;

export async function embedImages(
  images: ImageSource[],
  picturesDir: string
): Promise<ImageMap> {
  const imageMap: ImageMap = {};

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const id = img.id || `img${i + 1}`;
    
    // Determine file extension from mime type
    const ext = getExtensionFromMimeType(img.mimeType);
    const filename = `${id}.${ext}`;
    const filePath = join(picturesDir, filename);
    
    // Write image data to file
    if (img.dataBase64) {
      const buffer = Buffer.from(img.dataBase64, "base64");
      await fs.writeFile(filePath, buffer);
    } else if (img.href) {
      // For local file paths, copy the file
      try {
        await fs.copyFile(img.href, filePath);
      } catch (error) {
        console.warn(`Could not copy image from ${img.href}:`, error);
        continue;
      }
    } else {
      console.warn(`Image ${id} has no data source`);
      continue;
    }
    
    imageMap[id] = {
      odpPath: `Pictures/${filename}`,
      mimeType: img.mimeType
    };
  }
  
  return imageMap;
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/webp": "webp"
  };
  
  return mimeToExt[mimeType] || "png";
}
