import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { join } from 'path';
import { buildOdpFromJson } from '../src/odp/index.js';
import type { Slideshow } from '../src/schema/slideshowSchema.js';

describe('ODP Builder', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(join(tmpdir(), 'odp-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it('should create ODP file from slideshow', async () => {
    const slideshow: Slideshow = {
      meta: {
        title: 'Test Presentation',
        author: 'Test Author'
      },
      masters: [],
      images: [],
      slides: [
        {
          title: 'First Slide',
          elements: [
            {
              type: 'text',
              placeholder: 'title',
              text: 'Hello World',
              bullet: false,
              level: 0
            }
          ]
        }
      ]
    };

    const odpPath = await buildOdpFromJson(slideshow, testDir);

    // Check that ODP file exists
    const stats = await fs.stat(odpPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should include image in ODP', async () => {
    // Create a simple 1x1 PNG base64
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const slideshow: Slideshow = {
      meta: {
        title: 'Image Test'
      },
      masters: [],
      images: [
        {
          id: 'testimg',
          dataBase64: pngBase64,
          mimeType: 'image/png'
        }
      ],
      slides: [
        {
          title: '',
          elements: [
            {
              type: 'image',
              imageRef: 'testimg',
              x: 2,
              y: 3,
              width: 10,
              height: 8
            }
          ]
        }
      ]
    };

    const odpPath = await buildOdpFromJson(slideshow, testDir);

    // Verify ODP was created
    const stats = await fs.stat(odpPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should include notes in ODP', async () => {
    const slideshow: Slideshow = {
      meta: {
        title: 'Notes Test'
      },
      masters: [],
      images: [],
      slides: [
        {
          title: '',
          elements: [
            {
              type: 'text',
              text: 'Slide content',
              bullet: false,
              level: 0
            }
          ],
          notes: {
            plainText: 'These are speaker notes',
            paragraphs: ['Paragraph 1', 'Paragraph 2']
          }
        }
      ]
    };

    const odpPath = await buildOdpFromJson(slideshow, testDir);

    // Verify ODP was created
    const stats = await fs.stat(odpPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});
