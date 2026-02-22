import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Note, Folder, ROOT_FOLDER_ID, TrashFolder, TrashNote } from './types';

const DEFAULT_LOCAL_ROOT = path.join(process.cwd(), '..', 'Obsidian_Vault');
const LOCAL_DATA_ROOT = process.env.NOTEDRIVE_LOCAL_ROOT
  ? path.resolve(process.cwd(), process.env.NOTEDRIVE_LOCAL_ROOT)
  : DEFAULT_LOCAL_ROOT;
const META_FILE_NAME = '.notedrive-meta.json';
const TRASH_DIR_NAME = '.notedrive-trash';
const TRASH_META_FILE_NAME = 'trash-meta.json';

type MetaFile = {
  folderColors?: Record<string, string>;
};

type LocalTrashEntry = {
  id: string;
  type: 'note' | 'folder';
  title: string;
  deletedAt: string;
  originalPath: string;
  trashPath: string;
  folderColorSnapshot?: Record<string, string>;
};

type LocalTrashMeta = {
  entries: LocalTrashEntry[];
};

function getMetaFilePath(): string {
  return path.join(LOCAL_DATA_ROOT, META_FILE_NAME);
}

function getTrashRootPath(): string {
  return path.join(LOCAL_DATA_ROOT, TRASH_DIR_NAME);
}

function getTrashMetaPath(): string {
  return path.join(getTrashRootPath(), TRASH_META_FILE_NAME);
}

function readMeta(): MetaFile {
  const metaPath = getMetaFilePath();
  if (!fs.existsSync(metaPath)) {
    return { folderColors: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as MetaFile;
    return {
      folderColors: parsed.folderColors || {},
    };
  } catch {
    return { folderColors: {} };
  }
}

function writeMeta(meta: MetaFile): void {
  fs.writeFileSync(getMetaFilePath(), JSON.stringify(meta, null, 2), 'utf-8');
}

function ensureTrashRootExists(): void {
  const trashRoot = getTrashRootPath();
  if (!fs.existsSync(trashRoot)) {
    fs.mkdirSync(path.join(trashRoot, 'notes'), { recursive: true });
    fs.mkdirSync(path.join(trashRoot, 'folders'), { recursive: true });
  }
}

function readTrashMeta(): LocalTrashMeta {
  ensureTrashRootExists();
  const metaPath = getTrashMetaPath();
  if (!fs.existsSync(metaPath)) {
    return { entries: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as LocalTrashMeta;
    return { entries: parsed.entries || [] };
  } catch {
    return { entries: [] };
  }
}

function writeTrashMeta(meta: LocalTrashMeta): void {
  ensureTrashRootExists();
  fs.writeFileSync(getTrashMetaPath(), JSON.stringify(meta, null, 2), 'utf-8');
}

function makeTrashEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withUniquePath(filePath: string): string {
  if (!fs.existsSync(filePath)) return filePath;
  const parsed = path.parse(filePath);
  let counter = 1;
  let next = path.join(parsed.dir, `${parsed.name}-${counter}${parsed.ext}`);
  while (fs.existsSync(next)) {
    counter += 1;
    next = path.join(parsed.dir, `${parsed.name}-${counter}${parsed.ext}`);
  }
  return next;
}

function extractHashtags(fileContent: string): string[] {
  let content = fileContent;
  let hashtags: string[] = [];

  try {
    const parsed = matter(fileContent);
    content = parsed.content;
    hashtags = parsed.data.tags || [];
  } catch {
    // Keep service resilient to malformed frontmatter in user notes.
    hashtags = [];
  }

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

function scanDirectory(
  dir: string,
  meta: MetaFile,
  parentId: string = ROOT_FOLDER_ID
): { notes: Note[]; folders: Folder[] } {
  const notes: Note[] = [];
  const folders: Folder[] = [];

  if (!fs.existsSync(dir)) {
    return { notes, folders };
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(LOCAL_DATA_ROOT, fullPath);

    if (item.isDirectory()) {
      const folderId = relativePath;
      folders.push({
        id: folderId,
        name: item.name,
        parentId: parentId === ROOT_FOLDER_ID ? null : parentId,
        color: meta.folderColors?.[folderId],
      });

      const subResult = scanDirectory(fullPath, meta, folderId);
      notes.push(...subResult.notes);
      folders.push(...subResult.folders);
      continue;
    }

    if (!item.isFile() || !item.name.endsWith('.md')) {
      continue;
    }

    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const stats = fs.statSync(fullPath);
    notes.push({
      id: relativePath,
      title: item.name.replace(/\.md$/i, ''),
      content: fileContent,
      hashtags: extractHashtags(fileContent),
      folderId: parentId,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      storageProvider: 'local',
    });
  }

  return { notes, folders };
}

function sanitizeFileName(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled-note';
}

function sanitizeFolderName(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-') || 'Untitled Folder';
}

function assertSafeUnderRoot(fullPath: string, message: string): void {
  if (!fullPath.startsWith(LOCAL_DATA_ROOT)) {
    throw new Error(message);
  }
}

export async function getLocalFileSystemData(): Promise<{ notes: Note[]; folders: Folder[] }> {
  if (!fs.existsSync(LOCAL_DATA_ROOT)) {
    fs.mkdirSync(LOCAL_DATA_ROOT, { recursive: true });
  }

  const meta = readMeta();
  const { notes, folders } = scanDirectory(LOCAL_DATA_ROOT, meta);
  notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { notes, folders };
}

export async function getLocalTrashData(): Promise<{ trashNotes: TrashNote[]; trashFolders: TrashFolder[] }> {
  const meta = readTrashMeta();
  const trashNotes: TrashNote[] = [];
  const trashFolders: TrashFolder[] = [];

  for (const entry of meta.entries) {
    if (entry.type === 'note') {
      trashNotes.push({
        id: entry.id,
        title: entry.title,
        deletedAt: entry.deletedAt,
        storageProvider: 'local',
      });
    } else {
      trashFolders.push({
        id: entry.id,
        name: entry.title,
        deletedAt: entry.deletedAt,
        storageProvider: 'local',
      });
    }
  }

  trashNotes.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  trashFolders.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  return { trashNotes, trashFolders };
}

export async function saveLocalNote(noteId: string, content: string): Promise<Note> {
  const fullPath = path.join(LOCAL_DATA_ROOT, noteId);
  assertSafeUnderRoot(fullPath, 'Invalid note path.');

  if (!fs.existsSync(fullPath)) {
    throw new Error('Note file does not exist.');
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  const stats = fs.statSync(fullPath);
  const folderPath = path.dirname(noteId);

  return {
    id: noteId,
    title: path.basename(noteId, '.md'),
    content,
    hashtags: extractHashtags(content),
    folderId: folderPath === '.' ? ROOT_FOLDER_ID : folderPath,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    storageProvider: 'local',
  };
}

export async function createLocalNote(title: string, folderId: string): Promise<Note> {
  const targetFolderPath = folderId === ROOT_FOLDER_ID ? LOCAL_DATA_ROOT : path.join(LOCAL_DATA_ROOT, folderId);
  assertSafeUnderRoot(targetFolderPath, 'Invalid folder path.');

  fs.mkdirSync(targetFolderPath, { recursive: true });

  const baseName = sanitizeFileName(title);
  let fileName = `${baseName}.md`;
  let fullPath = path.join(targetFolderPath, fileName);
  let counter = 1;

  while (fs.existsSync(fullPath)) {
    fileName = `${baseName}-${counter}.md`;
    fullPath = path.join(targetFolderPath, fileName);
    counter += 1;
  }

  const content = `# ${title}\n\n`;
  fs.writeFileSync(fullPath, content, 'utf-8');
  const stats = fs.statSync(fullPath);
  const relativePath = path.relative(LOCAL_DATA_ROOT, fullPath);

  return {
    id: relativePath,
    title,
    content,
    hashtags: [],
    folderId,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    storageProvider: 'local',
  };
}

export async function createLocalFolder(name: string, parentFolderId: string): Promise<string> {
  const safeName = sanitizeFolderName(name);
  const targetParentPath =
    parentFolderId === ROOT_FOLDER_ID
      ? LOCAL_DATA_ROOT
      : path.join(LOCAL_DATA_ROOT, parentFolderId);
  assertSafeUnderRoot(targetParentPath, 'Invalid parent folder path.');

  fs.mkdirSync(targetParentPath, { recursive: true });

  let folderPath = path.join(targetParentPath, safeName);
  let counter = 1;
  while (fs.existsSync(folderPath)) {
    folderPath = path.join(targetParentPath, `${safeName} ${counter}`);
    counter += 1;
  }

  fs.mkdirSync(folderPath, { recursive: true });
  return path.relative(LOCAL_DATA_ROOT, folderPath);
}

export async function renameLocalNote(noteId: string, newTitle: string): Promise<string> {
  const sourcePath = path.join(LOCAL_DATA_ROOT, noteId);
  assertSafeUnderRoot(sourcePath, 'Invalid note source path.');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source note not found.');
  }

  const parentDir = path.dirname(sourcePath);
  const baseName = sanitizeFileName(newTitle);
  const targetPath = path.join(parentDir, `${baseName}.md`);

  if (targetPath !== sourcePath && fs.existsSync(targetPath)) {
    throw new Error('A note with this title already exists.');
  }

  fs.renameSync(sourcePath, targetPath);
  return path.relative(LOCAL_DATA_ROOT, targetPath);
}

function rewriteMetaKeysOnFolderRenameOrMove(oldFolderId: string, newFolderId: string): void {
  const meta = readMeta();
  const colors = meta.folderColors || {};
  const next: Record<string, string> = {};

  for (const [folderId, color] of Object.entries(colors)) {
    if (folderId === oldFolderId || folderId.startsWith(`${oldFolderId}/`)) {
      const suffix = folderId.slice(oldFolderId.length);
      next[`${newFolderId}${suffix}`] = color;
    } else {
      next[folderId] = color;
    }
  }

  writeMeta({ ...meta, folderColors: next });
}

function removeMetaKeysForFolder(folderId: string): void {
  const meta = readMeta();
  const colors = meta.folderColors || {};
  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    if (key === folderId || key.startsWith(`${folderId}/`)) {
      continue;
    }
    next[key] = value;
  }

  writeMeta({ ...meta, folderColors: next });
}

export async function renameLocalFolder(folderId: string, newName: string): Promise<string> {
  if (folderId === ROOT_FOLDER_ID) {
    throw new Error('Root folder cannot be renamed.');
  }

  const sourcePath = path.join(LOCAL_DATA_ROOT, folderId);
  assertSafeUnderRoot(sourcePath, 'Invalid folder path.');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Folder not found.');
  }

  const parentPath = path.dirname(sourcePath);
  const targetPath = path.join(parentPath, sanitizeFolderName(newName));

  if (targetPath !== sourcePath && fs.existsSync(targetPath)) {
    throw new Error('A folder with this name already exists.');
  }

  fs.renameSync(sourcePath, targetPath);

  const newFolderId = path.relative(LOCAL_DATA_ROOT, targetPath);
  rewriteMetaKeysOnFolderRenameOrMove(folderId, newFolderId);
  return newFolderId;
}

export async function moveLocalNoteToTrash(noteId: string): Promise<void> {
  const fullPath = path.join(LOCAL_DATA_ROOT, noteId);
  assertSafeUnderRoot(fullPath, 'Invalid note path.');
  if (!fs.existsSync(fullPath)) {
    return;
  }

  ensureTrashRootExists();
  const trashFileName = `${Date.now()}-${path.basename(fullPath)}`;
  const destination = withUniquePath(path.join(getTrashRootPath(), 'notes', trashFileName));
  fs.renameSync(fullPath, destination);

  const meta = readTrashMeta();
  meta.entries.push({
    id: makeTrashEntryId(),
    type: 'note',
    title: path.basename(noteId, '.md'),
    deletedAt: new Date().toISOString(),
    originalPath: noteId,
    trashPath: path.relative(LOCAL_DATA_ROOT, destination),
  });
  writeTrashMeta(meta);
}

export async function moveLocalFolderToTrash(folderId: string): Promise<void> {
  if (folderId === ROOT_FOLDER_ID) {
    throw new Error('Root folder cannot be deleted.');
  }

  const fullPath = path.join(LOCAL_DATA_ROOT, folderId);
  assertSafeUnderRoot(fullPath, 'Invalid folder path.');
  if (!fs.existsSync(fullPath)) {
    return;
  }

  ensureTrashRootExists();
  const destination = withUniquePath(path.join(getTrashRootPath(), 'folders', `${Date.now()}-${path.basename(fullPath)}`));

  const allColors = readMeta().folderColors || {};
  const snapshot: Record<string, string> = {};
  for (const [key, value] of Object.entries(allColors)) {
    if (key === folderId || key.startsWith(`${folderId}/`)) {
      snapshot[key.slice(folderId.length)] = value;
    }
  }

  fs.renameSync(fullPath, destination);
  removeMetaKeysForFolder(folderId);

  const trashMeta = readTrashMeta();
  trashMeta.entries.push({
    id: makeTrashEntryId(),
    type: 'folder',
    title: path.basename(folderId),
    deletedAt: new Date().toISOString(),
    originalPath: folderId,
    trashPath: path.relative(LOCAL_DATA_ROOT, destination),
    folderColorSnapshot: snapshot,
  });
  writeTrashMeta(trashMeta);
}

function findTrashEntry(trashId: string, expectedType: 'note' | 'folder'): LocalTrashEntry {
  const meta = readTrashMeta();
  const entry = meta.entries.find((item) => item.id === trashId && item.type === expectedType);
  if (!entry) {
    throw new Error('Trash item not found.');
  }
  return entry;
}

function removeTrashEntry(trashId: string): void {
  const meta = readTrashMeta();
  meta.entries = meta.entries.filter((item) => item.id !== trashId);
  writeTrashMeta(meta);
}

export async function restoreLocalNoteFromTrash(trashId: string): Promise<void> {
  const entry = findTrashEntry(trashId, 'note');
  const sourcePath = path.join(LOCAL_DATA_ROOT, entry.trashPath);
  if (!fs.existsSync(sourcePath)) {
    removeTrashEntry(trashId);
    return;
  }

  const destination = withUniquePath(path.join(LOCAL_DATA_ROOT, entry.originalPath));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(sourcePath, destination);
  removeTrashEntry(trashId);
}

export async function restoreLocalFolderFromTrash(trashId: string): Promise<void> {
  const entry = findTrashEntry(trashId, 'folder');
  const sourcePath = path.join(LOCAL_DATA_ROOT, entry.trashPath);
  if (!fs.existsSync(sourcePath)) {
    removeTrashEntry(trashId);
    return;
  }

  const destination = withUniquePath(path.join(LOCAL_DATA_ROOT, entry.originalPath));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(sourcePath, destination);

  const restoredFolderId = path.relative(LOCAL_DATA_ROOT, destination);
  if (entry.folderColorSnapshot) {
    const meta = readMeta();
    const nextColors = { ...(meta.folderColors || {}) };
    for (const [suffix, value] of Object.entries(entry.folderColorSnapshot)) {
      nextColors[`${restoredFolderId}${suffix}`] = value;
    }
    writeMeta({ ...meta, folderColors: nextColors });
  }

  removeTrashEntry(trashId);
}

export async function permanentlyDeleteLocalTrashedNote(trashId: string): Promise<void> {
  const entry = findTrashEntry(trashId, 'note');
  const sourcePath = path.join(LOCAL_DATA_ROOT, entry.trashPath);
  if (fs.existsSync(sourcePath)) {
    fs.rmSync(sourcePath, { force: true });
  }
  removeTrashEntry(trashId);
}

export async function permanentlyDeleteLocalTrashedFolder(trashId: string): Promise<void> {
  const entry = findTrashEntry(trashId, 'folder');
  const sourcePath = path.join(LOCAL_DATA_ROOT, entry.trashPath);
  if (fs.existsSync(sourcePath)) {
    fs.rmSync(sourcePath, { recursive: true, force: true });
  }
  removeTrashEntry(trashId);
}

export async function deleteLocalNote(noteId: string): Promise<void> {
  await moveLocalNoteToTrash(noteId);
}

export async function deleteLocalFolder(folderId: string): Promise<void> {
  await moveLocalFolderToTrash(folderId);
}

export async function setLocalFolderColor(folderId: string, color: string): Promise<void> {
  if (folderId === ROOT_FOLDER_ID) {
    return;
  }

  const meta = readMeta();
  const next = {
    ...(meta.folderColors || {}),
    [folderId]: color,
  };

  writeMeta({ ...meta, folderColors: next });
}

export async function moveLocalNote(noteId: string, targetFolderId: string): Promise<string> {
  const sourcePath = path.join(LOCAL_DATA_ROOT, noteId);
  assertSafeUnderRoot(sourcePath, 'Invalid note source path.');

  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source note not found.');
  }

  const fileName = path.basename(sourcePath);
  const targetFolderPath =
    targetFolderId === ROOT_FOLDER_ID ? LOCAL_DATA_ROOT : path.join(LOCAL_DATA_ROOT, targetFolderId);
  assertSafeUnderRoot(targetFolderPath, 'Invalid target folder path.');

  fs.mkdirSync(targetFolderPath, { recursive: true });
  const targetPath = path.join(targetFolderPath, fileName);
  if (targetPath === sourcePath) {
    return noteId;
  }
  if (fs.existsSync(targetPath)) {
    throw new Error('A note with the same file name already exists in the destination folder.');
  }

  fs.renameSync(sourcePath, targetPath);
  return path.relative(LOCAL_DATA_ROOT, targetPath);
}

export async function moveLocalFolder(folderId: string, targetParentFolderId: string): Promise<string> {
  if (folderId === ROOT_FOLDER_ID) {
    throw new Error('Root folder cannot be moved.');
  }
  if (targetParentFolderId === folderId || targetParentFolderId.startsWith(`${folderId}/`)) {
    throw new Error('Cannot move a folder into itself or one of its descendants.');
  }

  const sourcePath = path.join(LOCAL_DATA_ROOT, folderId);
  assertSafeUnderRoot(sourcePath, 'Invalid source folder path.');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source folder not found.');
  }

  const targetParentPath =
    targetParentFolderId === ROOT_FOLDER_ID
      ? LOCAL_DATA_ROOT
      : path.join(LOCAL_DATA_ROOT, targetParentFolderId);
  assertSafeUnderRoot(targetParentPath, 'Invalid target folder path.');

  fs.mkdirSync(targetParentPath, { recursive: true });
  const targetPath = path.join(targetParentPath, path.basename(sourcePath));
  if (targetPath === sourcePath) {
    return folderId;
  }
  if (fs.existsSync(targetPath)) {
    throw new Error('A folder with the same name already exists in the destination.');
  }

  fs.renameSync(sourcePath, targetPath);
  const newFolderId = path.relative(LOCAL_DATA_ROOT, targetPath);
  rewriteMetaKeysOnFolderRenameOrMove(folderId, newFolderId);
  return newFolderId;
}

export function getLocalDataRoot(): string {
  return LOCAL_DATA_ROOT;
}
