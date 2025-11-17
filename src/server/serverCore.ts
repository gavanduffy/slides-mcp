import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { SlideshowSchema } from "../schema/slideshowSchema.js";
import { jsonToPptx } from "../tools/jsonToPptx.js";

const JsonToPptxInputSchema = z.object({
  slideshow: SlideshowSchema,
  options: z.object({
    returnBase64: z.boolean().optional()
  }).optional()
});

export function createServer() {
  const server = new Server(
    {
      name: "slides-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "json_to_pptx",
          description: "Builds an ODP from structured JSON and converts it to PPTX using LibreOffice headless. The slideshow JSON must contain meta (title, author), slides array with elements (text/image), and optional images array. Text elements can have placeholder, text, bullet, and level. Image elements need imageRef, and optional x, y, width, height. Slides can have optional notes.",
          inputSchema: {
            type: "object",
            properties: {
              slideshow: {
                type: "object",
                description: "Structured slideshow data conforming to the Slideshow schema",
                properties: {
                  meta: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      author: { type: "string" }
                    },
                    required: ["title"]
                  },
                  masters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        backgroundColor: { type: "string" }
                      },
                      required: ["name"]
                    }
                  },
                  images: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        href: { type: "string" },
                        dataBase64: { type: "string" },
                        mimeType: { type: "string" }
                      }
                    }
                  },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        elements: {
                          type: "array",
                          items: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  type: { const: "text" },
                                  placeholder: { type: "string" },
                                  text: { type: "string" },
                                  bullet: { type: "boolean" },
                                  level: { type: "number" }
                                },
                                required: ["type", "text"]
                              },
                              {
                                type: "object",
                                properties: {
                                  type: { const: "image" },
                                  placeholder: { type: "string" },
                                  imageRef: { type: "string" },
                                  altText: { type: "string" },
                                  x: { type: "number" },
                                  y: { type: "number" },
                                  width: { type: "number" },
                                  height: { type: "number" }
                                },
                                required: ["type", "imageRef"]
                              }
                            ]
                          }
                        },
                        notes: {
                          type: "object",
                          properties: {
                            plainText: { type: "string" },
                            paragraphs: {
                              type: "array",
                              items: { type: "string" }
                            }
                          }
                        },
                        backgroundColor: { type: "string" },
                        layoutName: { type: "string" }
                      },
                      required: ["elements"]
                    }
                  }
                },
                required: ["meta", "slides"]
              },
              options: {
                type: "object",
                properties: {
                  returnBase64: {
                    type: "boolean",
                    description: "If true, returns PPTX as base64 string instead of file path"
                  }
                }
              }
            },
            required: ["slideshow"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "json_to_pptx") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const input = JsonToPptxInputSchema.parse(request.params.arguments);
    const result = await jsonToPptx(input);

    const returnBase64 = input.options?.returnBase64 === true;

    if (returnBase64 && result.pptxBase64) {
      return {
        content: [
          {
            type: "text",
            text: `PPTX generated successfully (${result.pptxBase64.length} bytes base64)`
          },
          {
            type: "text",
            text: result.pptxBase64
          }
        ]
      };
    } else if (result.pptxPath) {
      return {
        content: [
          {
            type: "text",
            text: `PPTX generated successfully at: ${result.pptxPath}`
          },
          {
            type: "resource",
            resource: {
              uri: `file://${result.pptxPath}`,
              mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              text: `Generated PPTX presentation`
            }
          }
        ]
      };
    }

    throw new Error("Failed to generate PPTX");
  });

  return server;
}
