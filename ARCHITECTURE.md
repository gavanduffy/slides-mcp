# Architecture Documentation

## Overview

The slides-mcp server implements a complete pipeline for converting structured JSON slideshows into PowerPoint presentations through OpenDocument Presentation (ODP) format and LibreOffice.

## System Architecture

```
┌─────────────────┐
│   MCP Client    │
│  (LLM/Claude)   │
└────────┬────────┘
         │
         ↓ JSON-RPC over stdio/HTTP
┌─────────────────┐
│  MCP Server     │
│  (serverCore)   │
└────────┬────────┘
         │
         ↓ json_to_pptx tool call
┌─────────────────┐
│ JSON to ODP     │
│   Pipeline      │
└────────┬────────┘
         │
         ├→ Schema Validation (Zod)
         ├→ Image Embedding
         ├→ XML Generation
         │   ├→ content.xml
         │   ├→ styles.xml
         │   ├→ meta.xml
         │   └→ manifest.xml
         ├→ ZIP Packaging
         └→ LibreOffice Conversion
             └→ PPTX Output
```

## Component Breakdown

### 1. Schema Layer (`src/schema/`)

**Purpose**: Type-safe schema definitions using Zod

**Key Types**:
- `Slideshow`: Root object containing metadata, images, and slides
- `Slide`: Individual slide with elements and optional notes
- `SlideElement`: Discriminated union of text and image elements
- `ImageSource`: Image data as base64 or file path

**Why Zod**: Runtime validation + TypeScript types from single source

### 2. ODP Builder (`src/odp/`)

**Purpose**: Generate OpenDocument Presentation files

**Components**:

- **`index.ts`**: Main orchestrator
  - Creates directory structure
  - Coordinates all XML generation
  - Packages into ZIP

- **`images.ts`**: Image handling
  - Decodes base64 images
  - Generates unique filenames
  - Creates Pictures/ directory
  - Returns ImageMap for referencing

- **`contentXml.ts`**: Slide content generation
  - Transforms JSON slides to ODP XML
  - Creates draw:page elements
  - Handles text boxes and image frames
  - Embeds speaker notes

- **`stylesXml.ts`**: Visual styling
  - Defines text styles (title, body)
  - Creates master pages
  - Sets default fonts and sizes

- **`metaXml.ts`**: Document metadata
  - Title, author, creation date
  - Generator information

- **`manifestXml.ts`**: Package manifest
  - Lists all files in ODP
  - Specifies MIME types

- **`zip.ts`**: ZIP packaging
  - Creates .odp file (ZIP format)
  - Preserves directory structure

### 3. LibreOffice Integration (`src/libreoffice/`)

**Purpose**: Convert ODP to PPTX using LibreOffice headless mode

**Implementation**:
- Spawns `soffice` process with conversion flags
- Handles process lifecycle
- Returns PPTX file path

**Command**: 
```bash
soffice --headless --nologo --norestore \
        --convert-to pptx --outdir <dir> <odp-file>
```

### 4. MCP Tool Layer (`src/tools/`)

**Purpose**: Bridge between MCP protocol and conversion logic

**Flow**:
1. Validate input against schema
2. Create temporary working directory
3. Build ODP from JSON
4. Convert ODP to PPTX
5. Return file path or base64

### 5. Server Layer (`src/server/`)

**Components**:

- **`serverCore.ts`**: MCP protocol implementation
  - Registers tools
  - Handles tool calls
  - Formats responses

- **`stdioServer.ts`**: Standard I/O transport
  - For MCP clients (Claude Desktop, etc.)
  - JSON-RPC over stdin/stdout

- **`httpServer.ts`**: HTTP/SSE transport
  - For web integrations
  - Server-Sent Events for streaming

## Data Flow

### End-to-End Example

```javascript
// 1. LLM converts markdown to JSON
{
  "meta": { "title": "My Presentation" },
  "slides": [{
    "elements": [{
      "type": "text",
      "placeholder": "title",
      "text": "Hello World"
    }]
  }]
}

// 2. MCP tool validates and processes
↓

// 3. ODP structure created
/tmp/odp-xyz/
  ├── mimetype
  ├── content.xml      (slide content)
  ├── styles.xml       (formatting)
  ├── meta.xml         (metadata)
  ├── META-INF/
  │   └── manifest.xml (file list)
  └── Pictures/        (embedded images)

// 4. Packaged as presentation.odp

// 5. LibreOffice converts to presentation.pptx

// 6. Returned to client
{
  "pptxPath": "/tmp/odp-xyz/out/presentation.pptx"
}
```

## ODP Format Details

### XML Structure

**content.xml**:
```xml
<office:document-content>
  <office:body>
    <office:presentation>
      <draw:page>                    <!-- Slide -->
        <draw:frame>                 <!-- Text box -->
          <draw:text-box>
            <text:p>Content</text:p>
          </draw:text-box>
        </draw:frame>
        <draw:frame>                 <!-- Image -->
          <draw:image xlink:href="Pictures/img.png"/>
        </draw:frame>
        <presentation:notes>         <!-- Speaker notes -->
          <draw:page>
            <draw:frame>
              <draw:text-box>
                <text:p>Notes</text:p>
              </draw:text-box>
            </draw:frame>
          </draw:page>
        </presentation:notes>
      </draw:page>
    </office:presentation>
  </office:body>
</office:document-content>
```

### Coordinate System

- Page size: 28cm × 21cm (landscape)
- Title frame: top of slide (y=1cm)
- Content frame: below title (y=5cm)
- Image positioning: customizable x, y, width, height

## Extension Points

### Adding New Element Types

1. Add to `SlideElementSchema` in `slideshowSchema.ts`
2. Handle in `buildElementXml()` in `contentXml.ts`
3. Add corresponding styles in `stylesXml.ts`

### Custom Master Styles

1. Populate `masters` array in slideshow JSON
2. Enhanced in `buildMasterPageXml()` in `stylesXml.ts`

### Alternative Output Formats

1. Keep ODP generation as-is
2. Replace LibreOffice step with alternative converter
3. Or add direct PPTX generation (more complex)

## Testing Strategy

### Unit Tests
- Schema validation
- XML generation
- Image embedding

### Integration Tests
- ODP file creation
- LibreOffice conversion (when available)
- MCP tool invocation

### Manual Verification
- Server startup
- Tool listing
- Complete conversion pipeline

## Performance Considerations

1. **Temporary Files**: Created in system temp directory, cleaned up after use
2. **Large Images**: Consider size limits for base64 encoding
3. **LibreOffice**: Headless mode, one conversion at a time
4. **Concurrency**: Each request gets isolated temp directory

## Security Considerations

1. **Input Validation**: Zod schema prevents malformed data
2. **File Paths**: All temp files in sandboxed directories
3. **Image Data**: Base64 decoding validated
4. **Process Spawning**: LibreOffice path validated

## Deployment Options

### Local Development
```bash
npm install
npm run build
node dist/server/stdioServer.js
```

### Docker
```bash
docker build -f docker/Dockerfile -t slides-mcp .
docker run -p 3000:3000 slides-mcp
```

### MCP Client Integration
Add to client configuration:
```json
{
  "mcpServers": {
    "slides-mcp": {
      "command": "node",
      "args": ["path/to/dist/server/stdioServer.js"]
    }
  }
}
```
