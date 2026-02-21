import matter from 'gray-matter';
import { Folder, Note, ROOT_FOLDER_ID, TrashFolder, TrashNote } from './types';

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  appProperties?: Record<string, string>;
};

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const MIME_FOLDER = 'application/vnd.google-apps.folder';
const COLOR_KEY = 'notedriveColor';
const TRASH_MARKER_KEY = 'notedriveTrash';

function assertDriveConfig() {
  if (!DRIVE_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is required when NOTEDRIVE_STORAGE_PROVIDER=gdrive.');
  }
}

function extractHashtags(fileContent: string): string[] {
  const { data, content } = matter(fileContent);
  let hashtags: string[] = data.tags || [];

  if (typeof hashtags === 'string') {
    hashtags = [hashtags];
  }

  if (hashtags.length === 0) {
    const contentTags = content.match(/#[\w\u00C0-\u00FF\uAC00-\uD7A3-]+/g);
    if (contentTags) {
      hashtags = contentTags.map((tag) => tag.substring(1));
    }
  }

  return Array.from(new Set(hashtags));
}

export async function getGoogleDriveAccessToken(): Promise<string> {
  if (process.env.GOOGLE_DRIVE_ACCESS_TOKEN) {
    return process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  }

  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(
      'Set GOOGLE_DRIVE_ACCESS_TOKEN or GOOGLE_DRIVE_REFRESH_TOKEN + GOOGLE_DRIVE_CLIENT_ID + GOOGLE_DRIVE_CLIENT_SECRET.'
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google Drive access token: ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function driveFetch(pathname: string, init?: RequestInit): Promise<Response> {
  const accessToken = await getGoogleDriveAccessToken();
  const response = await fetch(pathname, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive request failed: ${response.status} ${errorText}`);
  }
  return response;
}

async function listChildren(parentId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,parents,appProperties)',
      orderBy: 'folder,name',
      pageSize: '1000',
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await driveFetch(`${DRIVE_API_BASE}/files?${params.toString()}`);
    const data = (await response.json()) as { files: DriveFile[]; nextPageToken?: string };
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function getGoogleDriveFileContent(fileId: string): Promise<string> {
  const response = await driveFetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`);
  return response.text();
}

export async function getGoogleDriveFileBinary(fileId: string): Promise<{ contentType: string; buffer: Buffer }> {
  const response = await driveFetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`);
  const arrayBuffer = await response.arrayBuffer();
  return {
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    buffer: Buffer.from(arrayBuffer),
  };
}

async function walkFolder(
  parentId: string,
  folders: Folder[],
  files: DriveFile[],
  parentFolderIdForUi: string
): Promise<void> {
  const children = await listChildren(parentId);
  const childFolders = children.filter((item) => item.mimeType === MIME_FOLDER);
  const childFiles = children.filter((item) => item.mimeType !== MIME_FOLDER);

  for (const folder of childFolders) {
    folders.push({
      id: folder.id,
      name: folder.name,
      parentId: parentFolderIdForUi === ROOT_FOLDER_ID ? null : parentFolderIdForUi,
      color: folder.appProperties?.[COLOR_KEY],
    });
    await walkFolder(folder.id, folders, files, folder.id);
  }

  for (const file of childFiles) {
    if (!file.name.toLowerCase().endsWith('.md') && file.mimeType !== 'text/markdown') {
      continue;
    }
    files.push(file);
  }
}

export async function getGoogleDriveData(): Promise<{ notes: Note[]; folders: Folder[] }> {
  assertDriveConfig();

  const folders: Folder[] = [];
  const fileMetas: DriveFile[] = [];
  await walkFolder(DRIVE_FOLDER_ID!, folders, fileMetas, ROOT_FOLDER_ID);

  const notes = await Promise.all(
    fileMetas.map(async (file) => {
      const content = await getGoogleDriveFileContent(file.id);
      const parentId = file.parents?.[0];
      const folderId = !parentId || parentId === DRIVE_FOLDER_ID ? ROOT_FOLDER_ID : parentId;

      return {
        id: file.id,
        title: file.name.replace(/\.md$/i, ''),
        content,
        hashtags: extractHashtags(content),
        folderId,
        createdAt: file.createdTime,
        updatedAt: file.modifiedTime,
        storageProvider: 'gdrive',
      } satisfies Note;
    })
  );

  notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { notes, folders };
}

export async function getGoogleDriveTrashData(): Promise<{ trashNotes: TrashNote[]; trashFolders: TrashFolder[] }> {
  assertDriveConfig();

  const params = new URLSearchParams({
    q: `trashed=true and appProperties has { key='${TRASH_MARKER_KEY}' and value='1' }`,
    fields: 'files(id,name,mimeType,modifiedTime)',
    pageSize: '1000',
  });
  const response = await driveFetch(`${DRIVE_API_BASE}/files?${params.toString()}`);
  const data = (await response.json()) as { files?: DriveFile[] };
  const files = data.files || [];

  const trashNotes: TrashNote[] = [];
  const trashFolders: TrashFolder[] = [];
  for (const file of files) {
    if (file.mimeType === MIME_FOLDER) {
      trashFolders.push({
        id: file.id,
        name: file.name,
        deletedAt: file.modifiedTime,
        storageProvider: 'gdrive',
      });
      continue;
    }
    if (file.name.toLowerCase().endsWith('.md') || file.mimeType === 'text/markdown') {
      trashNotes.push({
        id: file.id,
        title: file.name.replace(/\.md$/i, ''),
        deletedAt: file.modifiedTime,
        storageProvider: 'gdrive',
      });
    }
  }

  trashNotes.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  trashFolders.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  return { trashNotes, trashFolders };
}

export async function saveGoogleDriveNote(noteId: string, content: string): Promise<Note> {
  assertDriveConfig();

  await driveFetch(`${DRIVE_UPLOAD_BASE}/files/${noteId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    body: content,
  });

  const metaResponse = await driveFetch(
    `${DRIVE_API_BASE}/files/${noteId}?fields=id,name,createdTime,modifiedTime,parents`
  );
  const meta = (await metaResponse.json()) as DriveFile;
  const parentId = meta.parents?.[0];

  return {
    id: meta.id,
    title: meta.name.replace(/\.md$/i, ''),
    content,
    hashtags: extractHashtags(content),
    folderId: !parentId || parentId === DRIVE_FOLDER_ID ? ROOT_FOLDER_ID : parentId,
    createdAt: meta.createdTime,
    updatedAt: meta.modifiedTime,
    storageProvider: 'gdrive',
  };
}

function normalizeTitle(title: string): string {
  const cleaned = title.trim() || 'Untitled Note';
  return cleaned.toLowerCase().endsWith('.md') ? cleaned : `${cleaned}.md`;
}

export async function createGoogleDriveNote(title: string, folderId: string): Promise<Note> {
  assertDriveConfig();

  const fileName = normalizeTitle(title);
  const parentId = folderId === ROOT_FOLDER_ID ? DRIVE_FOLDER_ID! : folderId;
  const createResponse = await driveFetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fileName,
      mimeType: 'text/markdown',
      parents: [parentId],
    }),
  });

  const createdMeta = (await createResponse.json()) as DriveFile;
  const initialContent = `# ${fileName.replace(/\.md$/i, '')}\n\n`;

  await driveFetch(`${DRIVE_UPLOAD_BASE}/files/${createdMeta.id}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    body: initialContent,
  });

  const metaResponse = await driveFetch(
    `${DRIVE_API_BASE}/files/${createdMeta.id}?fields=id,name,createdTime,modifiedTime,parents`
  );
  const meta = (await metaResponse.json()) as DriveFile;

  return {
    id: meta.id,
    title: meta.name.replace(/\.md$/i, ''),
    content: initialContent,
    hashtags: [],
    folderId,
    createdAt: meta.createdTime,
    updatedAt: meta.modifiedTime,
    storageProvider: 'gdrive',
  };
}

export async function createGoogleDriveFolder(name: string, parentFolderId: string): Promise<string> {
  assertDriveConfig();

  const parentId = parentFolderId === ROOT_FOLDER_ID ? DRIVE_FOLDER_ID! : parentFolderId;
  const response = await driveFetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim() || 'Untitled Folder',
      mimeType: MIME_FOLDER,
      parents: [parentId],
    }),
  });

  const created = (await response.json()) as { id: string };
  return created.id;
}

export async function renameGoogleDriveItem(itemId: string, newName: string, isFolder: boolean): Promise<string> {
  assertDriveConfig();

  const safeName = isFolder
    ? (newName.trim() || 'Untitled Folder')
    : normalizeTitle(newName);

  await driveFetch(`${DRIVE_API_BASE}/files/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: safeName }),
  });

  return itemId;
}

export async function deleteGoogleDriveItem(itemId: string): Promise<void> {
  assertDriveConfig();
  await driveFetch(`${DRIVE_API_BASE}/files/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trashed: true,
      appProperties: {
        [TRASH_MARKER_KEY]: '1',
      },
    }),
  });
}

export async function restoreGoogleDriveTrashItem(itemId: string): Promise<void> {
  assertDriveConfig();
  await driveFetch(`${DRIVE_API_BASE}/files/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trashed: false,
      appProperties: {
        [TRASH_MARKER_KEY]: '0',
      },
    }),
  });
}

export async function permanentlyDeleteGoogleDriveTrashItem(itemId: string): Promise<void> {
  assertDriveConfig();
  await driveFetch(`${DRIVE_API_BASE}/files/${itemId}`, { method: 'DELETE' });
}

export async function setGoogleDriveFolderColor(folderId: string, color: string): Promise<void> {
  assertDriveConfig();

  await driveFetch(`${DRIVE_API_BASE}/files/${folderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appProperties: {
        [COLOR_KEY]: color,
      },
    }),
  });
}

export async function moveGoogleDriveItem(itemId: string, targetFolderId: string): Promise<void> {
  assertDriveConfig();

  const targetParentId = targetFolderId === ROOT_FOLDER_ID ? DRIVE_FOLDER_ID! : targetFolderId;
  const metaResponse = await driveFetch(`${DRIVE_API_BASE}/files/${itemId}?fields=parents`);
  const meta = (await metaResponse.json()) as { parents?: string[] };
  const currentParents = meta.parents || [];

  if (currentParents.includes(targetParentId)) {
    return;
  }

  const params = new URLSearchParams({
    addParents: targetParentId,
    ...(currentParents.length > 0 ? { removeParents: currentParents.join(',') } : {}),
  });

  await driveFetch(`${DRIVE_API_BASE}/files/${itemId}?${params.toString()}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
