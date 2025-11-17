import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { join } from 'path';
import { jsonToPptx } from '../src/tools/jsonToPptx.js';

describe('jsonToPptx Tool', () => {
  it('should generate PPTX from valid slideshow JSON', async () => {
    const input = {
      slideshow: {
        meta: {
          title: 'Tool Test Presentation',
          author: 'Test'
        },
        slides: [
          {
            elements: [
              {
                type: 'text',
                placeholder: 'title',
                text: 'Test Title'
              }
            ]
          }
        ]
      }
    };

    let result;
    try {
      result = await jsonToPptx(input);
    } catch (error) {
      // If LibreOffice is not installed, skip
      if (error instanceof Error && error.message.includes('LibreOffice')) {
        console.log('LibreOffice not available, skipping tool test');
        return;
      }
      throw error;
    }

    expect(result.pptxPath).toBeDefined();
    if (result.pptxPath) {
      const stats = await fs.stat(result.pptxPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  }, 30000);

  it('should return base64 when requested', async () => {
    const input = {
      slideshow: {
        meta: {
          title: 'Base64 Test'
        },
        slides: [
          {
            elements: [
              {
                type: 'text',
                text: 'Test'
              }
            ]
          }
        ]
      },
      options: {
        returnBase64: true
      }
    };

    let result;
    try {
      result = await jsonToPptx(input);
    } catch (error) {
      // If LibreOffice is not installed, skip
      if (error instanceof Error && error.message.includes('LibreOffice')) {
        console.log('LibreOffice not available, skipping base64 test');
        return;
      }
      throw error;
    }

    expect(result.pptxBase64).toBeDefined();
    expect(result.pptxPath).toBeUndefined();
    if (result.pptxBase64) {
      expect(result.pptxBase64.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should reject invalid slideshow schema', async () => {
    const invalidInput = {
      slideshow: {
        // Missing required 'meta' field
        slides: []
      }
    };

    await expect(jsonToPptx(invalidInput)).rejects.toThrow();
  });
});
