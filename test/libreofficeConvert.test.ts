import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { join } from 'path';
import { buildOdpFromJson } from '../src/odp/index.js';
import { convertOdpToPptx } from '../src/libreoffice/convert.js';
import type { Slideshow } from '../src/schema/slideshowSchema.js';

describe('LibreOffice Converter', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(join(tmpdir(), 'lo-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it('should convert ODP to PPTX', async () => {
    const slideshow: Slideshow = {
      meta: {
        title: 'Conversion Test',
        author: 'Test'
      },
      masters: [],
      images: [],
      slides: [
        {
          title: '',
          elements: [
            {
              type: 'text',
              placeholder: 'title',
              text: 'Test Slide',
              bullet: false,
              level: 0
            }
          ]
        }
      ]
    };

    // Build ODP
    const odpPath = await buildOdpFromJson(slideshow, testDir);

    // Convert to PPTX
    const outDir = join(testDir, 'output');
    let pptxPath: string;
    
    try {
      pptxPath = await convertOdpToPptx(odpPath, outDir);
    } catch (error) {
      // If LibreOffice is not installed, skip this test
      if (error instanceof Error && error.message.includes('LibreOffice')) {
        console.log('LibreOffice not available, skipping conversion test');
        return;
      }
      throw error;
    }

    // Verify PPTX was created
    const stats = await fs.stat(pptxPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for LibreOffice conversion
});
