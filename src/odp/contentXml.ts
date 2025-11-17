import type { Slideshow, Slide, SlideElement } from "../schema/slideshowSchema.js";
import type { ImageMap } from "./images.js";

export function buildContentXml(
  slideshow: Slideshow,
  imageMap: ImageMap
): string {
  const slides = slideshow.slides.map((slide, idx) => 
    buildSlideXml(slide, idx, imageMap)
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content 
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
  xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  xmlns:chart="urn:oasis:names:tc:opendocument:xmlns:chart:1.0"
  xmlns:dr3d="urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0"
  xmlns:math="http://www.w3.org/1998/Math/MathML"
  xmlns:form="urn:oasis:names:tc:opendocument:xmlns:form:1.0"
  xmlns:script="urn:oasis:names:tc:opendocument:xmlns:script:1.0"
  xmlns:ooo="http://openoffice.org/2004/office"
  xmlns:ooow="http://openoffice.org/2004/writer"
  xmlns:oooc="http://openoffice.org/2004/calc"
  xmlns:dom="http://www.w3.org/2001/xml-events"
  xmlns:xforms="http://www.w3.org/2002/xforms"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:smil="urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0"
  xmlns:anim="urn:oasis:names:tc:opendocument:xmlns:animation:1.0"
  xmlns:rpt="http://openoffice.org/2005/report"
  xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:grddl="http://www.w3.org/2003/g/data-view#"
  xmlns:officeooo="http://openoffice.org/2009/office"
  xmlns:tableooo="http://openoffice.org/2009/table"
  xmlns:drawooo="http://openoffice.org/2010/draw"
  xmlns:calcext="urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0"
  xmlns:loext="urn:org:documentfoundation:names:experimental:office:xmlns:loext:1.0"
  xmlns:field="urn:openoffice:names:experimental:ooo-ms-interop:xmlns:field:1.0"
  xmlns:formx="urn:openoffice:names:experimental:ooxml-odf-interop:xmlns:form:1.0"
  xmlns:css3t="http://www.w3.org/TR/css3-text/"
  office:version="1.2">
  <office:scripts/>
  <office:automatic-styles/>
  <office:body>
    <office:presentation>
${slides}
    </office:presentation>
  </office:body>
</office:document-content>`;
}

function buildSlideXml(slide: Slide, index: number, imageMap: ImageMap): string {
  const slideName = slide.id || `slide${index + 1}`;
  const elements = slide.elements.map((el, idx) => 
    buildElementXml(el, idx, imageMap)
  ).join("\n");
  
  const notesXml = slide.notes ? buildNotesXml(slide.notes) : "";
  
  return `      <draw:page draw:name="${slideName}" draw:style-name="dp1" draw:master-page-name="Default">
${elements}
${notesXml}
      </draw:page>`;
}

function buildElementXml(element: SlideElement, index: number, imageMap: ImageMap): string {
  if (element.type === "text") {
    const isTitle = element.placeholder === "title";
    const y = isTitle ? "1cm" : "5cm";
    const height = isTitle ? "2cm" : "10cm";
    const styleName = isTitle ? "TitleStyle" : "BodyStyle";
    
    const bulletPrefix = element.bullet ? "• " : "";
    const levelIndent = element.level * 1.5;
    
    return `        <draw:frame draw:style-name="${styleName}" draw:layer="layout" svg:x="${levelIndent}cm" svg:y="${y}" svg:width="24cm" svg:height="${height}">
          <draw:text-box>
            <text:p text:style-name="P1">${escapeXml(bulletPrefix + element.text)}</text:p>
          </draw:text-box>
        </draw:frame>`;
  } else if (element.type === "image") {
    const imgData = imageMap[element.imageRef];
    if (!imgData) {
      console.warn(`Image reference ${element.imageRef} not found in imageMap`);
      return "";
    }
    
    const x = element.x !== undefined ? `${element.x}cm` : "2cm";
    const y = element.y !== undefined ? `${element.y}cm` : "8cm";
    const width = element.width !== undefined ? `${element.width}cm` : "10cm";
    const height = element.height !== undefined ? `${element.height}cm` : "8cm";
    
    return `        <draw:frame draw:style-name="ImageStyle" draw:layer="layout" svg:x="${x}" svg:y="${y}" svg:width="${width}" svg:height="${height}">
          <draw:image xlink:href="${imgData.odpPath}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
        </draw:frame>`;
  }
  
  return "";
}

function buildNotesXml(notes: { plainText?: string; paragraphs?: string[] }): string {
  const text = notes.paragraphs && notes.paragraphs.length > 0
    ? notes.paragraphs.map(p => `            <text:p>${escapeXml(p)}</text:p>`).join("\n")
    : `            <text:p>${escapeXml(notes.plainText || "")}</text:p>`;
    
  return `        <presentation:notes draw:style-name="dp1">
          <draw:page-thumbnail draw:style-name="PageThumbnail" draw:layer="layout" svg:width="14.85cm" svg:height="11.13cm" svg:x="3.68cm" svg:y="2.5cm" draw:page-number="1" presentation:class="page"/>
          <draw:frame presentation:style-name="NotesStyle" draw:layer="layout" svg:width="16.79cm" svg:height="13.33cm" svg:x="2.1cm" svg:y="14.45cm" presentation:class="notes">
            <draw:text-box>
${text}
            </draw:text-box>
          </draw:frame>
        </presentation:notes>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
