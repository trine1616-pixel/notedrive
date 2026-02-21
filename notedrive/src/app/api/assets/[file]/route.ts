import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getLocalDataRoot } from '@/lib/file-system';

function inferContentType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const decoded = decodeURIComponent(file);
  const assetsRoot = path.join(getLocalDataRoot(), 'assets');
  const targetPath = path.join(assetsRoot, decoded);

  if (!targetPath.startsWith(assetsRoot)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!fs.existsSync(targetPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(targetPath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': inferContentType(decoded),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
