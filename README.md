# Slides MCP Server

A Model Context Protocol (MCP) server that converts structured JSON slideshows to PowerPoint presentations (PPTX) via LibreOffice.

## Overview

This MCP server enables LLMs to generate PowerPoint presentations by:

1. Converting markdown outlines to structured JSON (done by LLM)
2. Building OpenDocument Presentation (ODP) files from JSON
3. Converting ODP to PPTX using LibreOffice headless mode
4. Returning the presentation file or base64-encoded data

## Prerequisites

- Node.js 18 or higher
- LibreOffice (for ODP to PPTX conversion)

### Installing LibreOffice

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install libreoffice-impress
```

**macOS:**
```bash
brew install --cask libreoffice
```

**Windows:**
Download and install from [LibreOffice website](https://www.libreoffice.org/download/download/)

## Installation

```bash
npm install
npm run build
```

## Usage

### Stdio Mode (for MCP clients)

```bash
npm start:stdio
```

Or directly:
```bash
node dist/server/stdioServer.js
```

### HTTP Mode (for web integration)

```bash
npm start:http
```

The server will start on `http://localhost:3000` (or the port specified by the `PORT` environment variable).

## MCP Tool: `json_to_pptx`

### Input Schema

```json
{
  "slideshow": {
    "meta": {
      "title": "Presentation Title",
      "author": "Author Name (optional)"
    },
    "masters": [
      {
        "name": "Master Name",
        "backgroundColor": "#ffffff (optional)"
      }
    ],
    "images": [
      {
        "id": "img1",
        "dataBase64": "base64-encoded-image-data",
        "mimeType": "image/png"
      }
    ],
    "slides": [
      {
        "id": "slide1 (optional)",
        "title": "Slide Title (optional)",
        "elements": [
          {
            "type": "text",
            "placeholder": "title or content (optional)",
            "text": "Text content",
            "bullet": false,
            "level": 0
          },
          {
            "type": "image",
            "imageRef": "img1",
            "x": 2,
            "y": 3,
            "width": 10,
            "height": 8
          }
        ],
        "notes": {
          "plainText": "Speaker notes",
          "paragraphs": ["Para 1", "Para 2"]
        }
      }
    ]
  },
  "options": {
    "returnBase64": false
  }
}
```

### Output

- **File mode** (default): Returns path to generated PPTX file
- **Base64 mode**: Returns base64-encoded PPTX data

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run watch
```

### Run tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Docker

### Build Docker image

```bash
docker build -f docker/Dockerfile -t slides-mcp .
```

### Run with HTTP transport

```bash
docker run -p 3000:3000 slides-mcp
```

### Run with stdio transport

```bash
docker run -i slides-mcp node dist/server/stdioServer.js
```

## Architecture

```
User markdown
  → LLM parsing prompt
    → slideshow JSON
      → MCP tool json_to_pptx(slideshow JSON)
        → ODP package
          → LibreOffice headless
            → PPTX file
```

### Project Structure

```
src/
  schema/
    slideshowSchema.ts    # Zod schema and types
  odp/
    index.ts              # ODP orchestrator
    contentXml.ts         # Slide content generation
    stylesXml.ts          # Master styles and formatting
    metaXml.ts            # Document metadata
    manifestXml.ts        # ODP package manifest
    images.ts             # Image embedding
    zip.ts                # ODP ZIP packaging
  libreoffice/
    convert.ts            # ODP to PPTX converter
  tools/
    jsonToPptx.ts         # MCP tool implementation
  server/
    serverCore.ts         # Core MCP server logic
    stdioServer.ts        # Stdio transport
    httpServer.ts         # HTTP transport
```

## License

MIT