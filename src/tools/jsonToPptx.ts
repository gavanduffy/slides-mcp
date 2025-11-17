import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { SlideshowSchema } from "../schema/slideshowSchema.js";
import { buildOdpFromJson } from "../odp/index.js";
import { convertOdpToPptx } from "../libreoffice/convert.js";

export interface JsonToPptxInput {
  slideshow: unknown;
  options?: {
    returnBase64?: boolean;
  };
}

export interface JsonToPptxOutput {
  pptxPath?: string;
  pptxBase64?: string;
}

export async function jsonToPptx(input: JsonToPptxInput): Promise<JsonToPptxOutput> {
  // Validate and parse input
  const slideshow = SlideshowSchema.parse(input.slideshow);
  const returnBase64 = input.options?.returnBase64 === true;

  // Create temporary working directory
  const tmpRoot = await fs.mkdtemp(join(tmpdir(), "odp-pptx-mcp-"));

  try {
    // Build ODP from JSON
    const odpPath = await buildOdpFromJson(slideshow, tmpRoot);

    // Convert ODP to PPTX using LibreOffice
    const outDir = join(tmpRoot, "out");
    const pptxPath = await convertOdpToPptx(odpPath, outDir);

    // Return base64 if requested
    if (returnBase64) {
      const buffer = await fs.readFile(pptxPath);
      const pptxBase64 = buffer.toString("base64");
      return { pptxBase64 };
    }

    // Otherwise return file path
    return { pptxPath };
  } catch (error) {
    // Clean up temp directory on error
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}
