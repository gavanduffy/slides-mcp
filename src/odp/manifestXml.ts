import type { ImageMap } from "./images.js";

export function buildManifestXml(imageMap: ImageMap): string {
  const imageEntries = Object.values(imageMap)
    .map(img => 
      `  <manifest:file-entry manifest:full-path="${img.odpPath}" manifest:media-type="${img.mimeType}"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest 
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
${imageEntries}
</manifest:manifest>`;
}
