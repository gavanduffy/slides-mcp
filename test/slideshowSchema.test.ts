import { describe, it, expect } from '@jest/globals';
import { SlideshowSchema } from '../src/schema/slideshowSchema.js';

describe('SlideshowSchema', () => {
  it('should parse valid slideshow with text element', () => {
    const validSlideshow = {
      meta: {
        title: 'Test Presentation',
        author: 'Test Author'
      },
      slides: [
        {
          title: 'First Slide',
          elements: [
            {
              type: 'text',
              placeholder: 'title',
              text: 'Hello World'
            }
          ]
        }
      ]
    };

    const result = SlideshowSchema.parse(validSlideshow);
    expect(result.meta.title).toBe('Test Presentation');
    expect(result.slides).toHaveLength(1);
    expect(result.slides[0].elements[0].type).toBe('text');
  });

  it('should parse slideshow with image element', () => {
    const slideshowWithImage = {
      meta: {
        title: 'Image Presentation'
      },
      images: [
        {
          id: 'img1',
          dataBase64: 'base64data',
          mimeType: 'image/png'
        }
      ],
      slides: [
        {
          elements: [
            {
              type: 'image',
              imageRef: 'img1',
              x: 2,
              y: 3,
              width: 10,
              height: 8
            }
          ]
        }
      ]
    };

    const result = SlideshowSchema.parse(slideshowWithImage);
    expect(result.images).toHaveLength(1);
    expect(result.slides[0].elements[0].type).toBe('image');
  });

  it('should parse slideshow with notes', () => {
    const slideshowWithNotes = {
      meta: {
        title: 'Notes Presentation'
      },
      slides: [
        {
          elements: [
            {
              type: 'text',
              text: 'Content'
            }
          ],
          notes: {
            plainText: 'Speaker notes here'
          }
        }
      ]
    };

    const result = SlideshowSchema.parse(slideshowWithNotes);
    expect(result.slides[0].notes?.plainText).toBe('Speaker notes here');
  });

  it('should apply default values', () => {
    const minimalSlideshow = {
      meta: {
        title: 'Minimal'
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
    };

    const result = SlideshowSchema.parse(minimalSlideshow);
    expect(result.masters).toEqual([]);
    expect(result.images).toEqual([]);
    expect(result.slides[0].title).toBe('');
    expect(result.slides[0].elements[0].type).toBe('text');
    if (result.slides[0].elements[0].type === 'text') {
      expect(result.slides[0].elements[0].bullet).toBe(false);
      expect(result.slides[0].elements[0].level).toBe(0);
    }
  });

  it('should reject invalid slideshow missing required fields', () => {
    const invalidSlideshow = {
      meta: {
        // missing title
      },
      slides: []
    };

    expect(() => SlideshowSchema.parse(invalidSlideshow)).toThrow();
  });

  it('should reject invalid element type', () => {
    const invalidElement = {
      meta: {
        title: 'Test'
      },
      slides: [
        {
          elements: [
            {
              type: 'invalid',
              text: 'Test'
            }
          ]
        }
      ]
    };

    expect(() => SlideshowSchema.parse(invalidElement)).toThrow();
  });
});
