"use server";

import fs from 'fs';
import path from 'path';
import { getLocalDataRoot } from '@/lib/file-system';

export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file uploaded');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dataRoot = getLocalDataRoot();
    const assetsDir = path.join(dataRoot, 'assets');

    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = path.join(assetsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      url: `/api/assets/${encodeURIComponent(fileName)}`,
      filePath,
    };
  } catch (error: any) {
    console.error('Upload Error:', error);
    return { success: false, error: error.message };
  }
}
