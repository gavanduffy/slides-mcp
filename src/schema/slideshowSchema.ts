import { z } from "zod";

export const ImageSourceSchema = z.object({
  id: z.string().optional(),              // logical id used in slides
  href: z.string().optional(),            // optional URL or file path
  dataBase64: z.string().optional(),      // optional base64 content
  mimeType: z.string().default("image/png")
});

export const NoteSchema = z.object({
  plainText: z.string().default(""),
  paragraphs: z.array(z.string()).optional()
});

export const SlideElementTextSchema = z.object({
  type: z.literal("text"),
  placeholder: z.string().optional(),     // "title", "content" etc
  text: z.string(),
  bullet: z.boolean().default(false),
  level: z.number().int().min(0).max(3).default(0)
});

export const SlideElementImageSchema = z.object({
  type: z.literal("image"),
  placeholder: z.string().optional(),
  imageRef: z.string(),                   // references ImageSource.id
  altText: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

export const SlideElementSchema = z.discriminatedUnion("type", [
  SlideElementTextSchema,
  SlideElementImageSchema
]);

export const SlideSchema = z.object({
  id: z.string().optional(),
  title: z.string().default(""),
  elements: z.array(SlideElementSchema),
  notes: NoteSchema.optional(),
  backgroundColor: z.string().optional(),
  layoutName: z.string().optional()       // custom layout name
});

export const MasterStyleSchema = z.object({
  name: z.string(),
  backgroundColor: z.string().optional()
});

export const SlideshowSchema = z.object({
  meta: z.object({
    title: z.string(),
    author: z.string().optional()
  }),
  masters: z.array(MasterStyleSchema).default([]),
  images: z.array(ImageSourceSchema).default([]),
  slides: z.array(SlideSchema)
});

export type ImageSource = z.infer<typeof ImageSourceSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type SlideElementText = z.infer<typeof SlideElementTextSchema>;
export type SlideElementImage = z.infer<typeof SlideElementImageSchema>;
export type SlideElement = z.infer<typeof SlideElementSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type MasterStyle = z.infer<typeof MasterStyleSchema>;
export type Slideshow = z.infer<typeof SlideshowSchema>;
