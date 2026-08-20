import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Max dimensions and quality targets per use-case.
// Images are resized to fit within the box (never stretched), converted to
// WebP (smaller than JPEG/PNG at equal quality), and stripped of EXIF data.
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 82; // WebP quality — good visual fidelity, ~60–75% smaller than raw

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSize = buffer.length;

    // Resize (only if larger than max), convert to WebP, strip EXIF
    const compressed = await sharp(buffer)
      .rotate() // auto-rotate from EXIF before stripping it
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();

    const compressedSize = compressed.length;
    const saving = Math.round((1 - compressedSize / originalSize) * 100);

    // Build a filename: keep the original name but force .webp extension
    const originalName = (file.name || 'image').replace(/\.[^.]+$/, '');
    const outputName = originalName + '.webp';

    return new NextResponse(compressed, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': `attachment; filename="${outputName}"`,
        'X-Original-Size': String(originalSize),
        'X-Compressed-Size': String(compressedSize),
        'X-Size-Saving': String(saving) + '%',
      },
    });
  } catch (err) {
    console.error('[compress-image]', err);
    return NextResponse.json(
      { error: 'Compression failed: ' + (err.message || 'unknown error') },
      { status: 500 }
    );
  }
}
