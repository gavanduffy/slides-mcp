import type { Slideshow } from "../schema/slideshowSchema.js";

export function buildMetaXml(slideshow: Slideshow): string {
  const title = escapeXml(slideshow.meta.title);
  const author = slideshow.meta.author ? escapeXml(slideshow.meta.author) : "";
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta 
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:ooo="http://openoffice.org/2004/office"
  xmlns:grddl="http://www.w3.org/2003/g/data-view#"
  office:version="1.2">
  <office:meta>
    <meta:generator>slides-mcp 1.0.0</meta:generator>
    <dc:title>${title}</dc:title>
    ${author ? `<dc:creator>${author}</dc:creator>` : ""}
    <meta:creation-date>${now}</meta:creation-date>
    <dc:date>${now}</dc:date>
  </office:meta>
</office:document-meta>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
