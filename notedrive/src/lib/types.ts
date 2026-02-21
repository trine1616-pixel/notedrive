export type StorageProvider = 'local' | 'gdrive';
export const ROOT_FOLDER_ID = '__root__';

export interface Note {
  id: string;
  title: string;
  content: string;
  hashtags: string[];
  folderId: string;
  createdAt: string;
  updatedAt: string;
  storageProvider: StorageProvider;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
}

export interface TrashNote {
  id: string;
  title: string;
  deletedAt: string;
  storageProvider: StorageProvider;
}

export interface TrashFolder {
  id: string;
  name: string;
  deletedAt: string;
  storageProvider: StorageProvider;
}

export interface DashboardProps {
  initialNotes: Note[];
  initialFolders: Folder[];
  initialTrashNotes: TrashNote[];
  initialTrashFolders: TrashFolder[];
  storageProvider: StorageProvider;
}
