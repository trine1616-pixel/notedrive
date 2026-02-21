import {
  createGoogleDriveFolder,
  createGoogleDriveNote,
  deleteGoogleDriveItem,
  getGoogleDriveTrashData,
  getGoogleDriveData,
  moveGoogleDriveItem,
  permanentlyDeleteGoogleDriveTrashItem,
  renameGoogleDriveItem,
  restoreGoogleDriveTrashItem,
  saveGoogleDriveNote,
  setGoogleDriveFolderColor,
} from './google-drive';
import {
  createLocalFolder,
  createLocalNote,
  deleteLocalFolder,
  deleteLocalNote,
  getLocalTrashData,
  getLocalFileSystemData,
  moveLocalFolder,
  moveLocalNote,
  permanentlyDeleteLocalTrashedFolder,
  permanentlyDeleteLocalTrashedNote,
  renameLocalFolder,
  renameLocalNote,
  restoreLocalFolderFromTrash,
  restoreLocalNoteFromTrash,
  saveLocalNote,
  setLocalFolderColor,
} from './file-system';
import { Note, Folder, StorageProvider, TrashFolder, TrashNote } from './types';

export function getStorageProvider(): StorageProvider {
  return process.env.NOTEDRIVE_STORAGE_PROVIDER === 'gdrive' ? 'gdrive' : 'local';
}

export async function getStorageData(): Promise<{
  notes: Note[];
  folders: Folder[];
  trashNotes: TrashNote[];
  trashFolders: TrashFolder[];
  storageProvider: StorageProvider;
}> {
  const storageProvider = getStorageProvider();
  if (storageProvider === 'gdrive') {
    const [data, trash] = await Promise.all([getGoogleDriveData(), getGoogleDriveTrashData()]);
    return { ...data, ...trash, storageProvider };
  }
  const [data, trash] = await Promise.all([getLocalFileSystemData(), getLocalTrashData()]);
  return { ...data, ...trash, storageProvider };
}

export async function saveNoteContent(noteId: string, content: string): Promise<Note> {
  return getStorageProvider() === 'gdrive'
    ? saveGoogleDriveNote(noteId, content)
    : saveLocalNote(noteId, content);
}

export async function createNote(title: string, folderId: string): Promise<Note> {
  return getStorageProvider() === 'gdrive'
    ? createGoogleDriveNote(title, folderId)
    : createLocalNote(title, folderId);
}

export async function createFolder(name: string, parentFolderId: string): Promise<{ createdFolderId: string }> {
  const createdFolderId = getStorageProvider() === 'gdrive'
    ? await createGoogleDriveFolder(name, parentFolderId)
    : await createLocalFolder(name, parentFolderId);

  return { createdFolderId };
}

export async function renameNote(noteId: string, newTitle: string): Promise<{ renamedNoteId: string }> {
  const renamedNoteId = getStorageProvider() === 'gdrive'
    ? await renameGoogleDriveItem(noteId, newTitle, false)
    : await renameLocalNote(noteId, newTitle);

  return { renamedNoteId };
}

export async function renameFolder(folderId: string, newName: string): Promise<{ renamedFolderId: string }> {
  const renamedFolderId = getStorageProvider() === 'gdrive'
    ? await renameGoogleDriveItem(folderId, newName, true)
    : await renameLocalFolder(folderId, newName);

  return { renamedFolderId };
}

export async function deleteNote(noteId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await deleteGoogleDriveItem(noteId);
    return;
  }
  await deleteLocalNote(noteId);
}

export async function deleteFolder(folderId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await deleteGoogleDriveItem(folderId);
    return;
  }
  await deleteLocalFolder(folderId);
}

export async function restoreTrashNote(trashNoteId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await restoreGoogleDriveTrashItem(trashNoteId);
    return;
  }
  await restoreLocalNoteFromTrash(trashNoteId);
}

export async function restoreTrashFolder(trashFolderId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await restoreGoogleDriveTrashItem(trashFolderId);
    return;
  }
  await restoreLocalFolderFromTrash(trashFolderId);
}

export async function permanentlyDeleteTrashNote(trashNoteId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await permanentlyDeleteGoogleDriveTrashItem(trashNoteId);
    return;
  }
  await permanentlyDeleteLocalTrashedNote(trashNoteId);
}

export async function permanentlyDeleteTrashFolder(trashFolderId: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await permanentlyDeleteGoogleDriveTrashItem(trashFolderId);
    return;
  }
  await permanentlyDeleteLocalTrashedFolder(trashFolderId);
}

export async function setFolderColor(folderId: string, color: string): Promise<void> {
  if (getStorageProvider() === 'gdrive') {
    await setGoogleDriveFolderColor(folderId, color);
    return;
  }
  await setLocalFolderColor(folderId, color);
}

export async function moveNoteToFolder(noteId: string, targetFolderId: string): Promise<{ movedNoteId: string }> {
  if (getStorageProvider() === 'gdrive') {
    await moveGoogleDriveItem(noteId, targetFolderId);
    return { movedNoteId: noteId };
  }

  const movedNoteId = await moveLocalNote(noteId, targetFolderId);
  return { movedNoteId };
}

export async function moveFolderToFolder(folderId: string, targetParentFolderId: string): Promise<{ movedFolderId: string }> {
  if (getStorageProvider() === 'gdrive') {
    await moveGoogleDriveItem(folderId, targetParentFolderId);
    return { movedFolderId: folderId };
  }

  const movedFolderId = await moveLocalFolder(folderId, targetParentFolderId);
  return { movedFolderId };
}
