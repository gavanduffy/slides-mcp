import { promises as fs } from "fs";
import { join } from "path";
import type { Slideshow } from "../schema/slideshowSchema.js";
import { embedImages } from "./images.js";
import { buildContentXml } from "./contentXml.js";
import { buildStylesXml } from "./stylesXml.js";
import { buildMetaXml } from "./metaXml.js";
import { buildManifestXml } from "./manifestXml.js";
import { createOdpZip } from "./zip.js";

export async function buildOdpFromJson(
  slideshow: Slideshow,
  workDir: string
): Promise<string> {
  // Create ODP directory structure
  const odpRoot = join(workDir, "odp");
  await fs.mkdir(odpRoot, { recursive: true });
  
  const metaInfDir = join(odpRoot, "META-INF");
  await fs.mkdir(metaInfDir, { recursive: true });
  
  const picturesDir = join(odpRoot, "Pictures");
  await fs.mkdir(picturesDir, { recursive: true });

  // Embed images and get mapping
  const imageMap = await embedImages(slideshow.images, picturesDir);

  // Generate XML files
  const contentXml = buildContentXml(slideshow, imageMap);
  await fs.writeFile(join(odpRoot, "content.xml"), contentXml, "utf-8");

  const stylesXml = buildStylesXml(slideshow);
  await fs.writeFile(join(odpRoot, "styles.xml"), stylesXml, "utf-8");

  const metaXml = buildMetaXml(slideshow);
  await fs.writeFile(join(odpRoot, "meta.xml"), metaXml, "utf-8");

  const manifestXml = buildManifestXml(imageMap);
  await fs.writeFile(join(metaInfDir, "manifest.xml"), manifestXml, "utf-8");

  // Create mimetype file (must be first in ZIP, uncompressed)
  await fs.writeFile(
    join(odpRoot, "mimetype"),
    "application/vnd.oasis.opendocument.presentation",
    "utf-8"
  );

  // Create ODP zip file
  const odpPath = join(workDir, "presentation.odp");
  await createOdpZip(odpRoot, odpPath);

  return odpPath;
}
