'use server';

import { summarizeNote, type SummarizeNoteInput, type SummarizeNoteOutput } from "@/ai/flows/summarize-note-flow";
import { classifyNote, type ClassifyNoteInput, type ClassifyNoteOutput } from "@/ai/flows/classify-note-flow";
import { organizeNote, type OrganizeNoteInput, type OrganizeNoteOutput } from "@/ai/flows/organize-note-flow";
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getStorageData,
  moveFolderToFolder,
  moveNoteToFolder,
  permanentlyDeleteTrashFolder,
  permanentlyDeleteTrashNote,
  renameFolder,
  renameNote,
  restoreTrashFolder,
  restoreTrashNote,
  saveNoteContent,
  setFolderColor,
} from '@/lib/storage';
import { ROOT_FOLDER_ID, type Note, type TrashFolder, type TrashNote } from '@/lib/types';

type DataPayload = {
  notes?: Note[];
  folders?: { id: string; name: string; parentId: string | null; color?: string }[];
  trashNotes?: TrashNote[];
  trashFolders?: TrashFolder[];
  error?: string;
};

async function refreshedData(extra: Record<string, unknown> = {}): Promise<DataPayload & Record<string, unknown>> {
  const { notes, folders, trashNotes, trashFolders } = await getStorageData();
  return { notes, folders, trashNotes, trashFolders, ...extra };
}

export async function summarizeNoteAction(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
  try {
    const result = await summarizeNote(input);
    return result;
  } catch (error: any) {
    console.error("Summarization failed:", error);
    return { summary: `Error: ${error.message || "Could not generate summary."}` };
  }
}

export async function classifyNoteAction(input: ClassifyNoteInput): Promise<ClassifyNoteOutput> {
  try {
    const result = await classifyNote(input);
    return result;
  } catch (error: any) {
    console.error("Classification failed:", error);
    return {
      suggestedTags: [],
      suggestedFolder: "",
      reason: `Error: ${error.message || "Could not classify note."}`
    };
  }
}

export async function organizeNoteAction(input: OrganizeNoteInput): Promise<OrganizeNoteOutput> {
  try {
    const result = await organizeNote(input);
    return result;
  } catch (error: any) {
    console.error("Organization failed:", error);
    return {
      organizedContent: input.noteContent,
      changesMade: `Error: ${error.message || "Could not organize note."}`
    };
  }
}

export async function saveNoteAction(input: { noteId: string; content: string }): Promise<{ note?: Note; error?: string }> {
  try {
    const note = await saveNoteContent(input.noteId, input.content);
    return { note };
  } catch (error: any) {
    console.error('Save note failed:', error);
    return { error: error.message || 'Failed to save note.' };
  }
}

export async function createNoteAction(input: {
  title: string;
  folderId?: string | null;
}): Promise<{ note?: Note; error?: string }> {
  try {
    const note = await createNote(input.title, input.folderId || ROOT_FOLDER_ID);
    return { note };
  } catch (error: any) {
    console.error('Create note failed:', error);
    return { error: error.message || 'Failed to create note.' };
  }
}

export async function createFolderAction(input: {
  name: string;
  parentFolderId?: string | null;
}): Promise<DataPayload> {
  try {
    await createFolder(input.name, input.parentFolderId || ROOT_FOLDER_ID);
    return await refreshedData();
  } catch (error: any) {
    console.error('Create folder failed:', error);
    return { error: error.message || 'Failed to create folder.' };
  }
}

export async function renameNoteAction(input: {
  noteId: string;
  newTitle: string;
}): Promise<DataPayload & { renamedNoteId?: string }> {
  try {
    const { renamedNoteId } = await renameNote(input.noteId, input.newTitle);
    return await refreshedData({ renamedNoteId });
  } catch (error: any) {
    console.error('Rename note failed:', error);
    return { error: error.message || 'Failed to rename note.' };
  }
}

export async function renameFolderAction(input: {
  folderId: string;
  newName: string;
}): Promise<DataPayload & { renamedFolderId?: string }> {
  try {
    const { renamedFolderId } = await renameFolder(input.folderId, input.newName);
    return await refreshedData({ renamedFolderId });
  } catch (error: any) {
    console.error('Rename folder failed:', error);
    return { error: error.message || 'Failed to rename folder.' };
  }
}

export async function deleteNoteAction(input: {
  noteId: string;
}): Promise<DataPayload> {
  try {
    await deleteNote(input.noteId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Delete note failed:', error);
    return { error: error.message || 'Failed to delete note.' };
  }
}

export async function deleteFolderAction(input: {
  folderId: string;
}): Promise<DataPayload> {
  try {
    await deleteFolder(input.folderId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Delete folder failed:', error);
    return { error: error.message || 'Failed to delete folder.' };
  }
}

export async function setFolderColorAction(input: {
  folderId: string;
  color: string;
}): Promise<DataPayload> {
  try {
    await setFolderColor(input.folderId, input.color);
    return await refreshedData();
  } catch (error: any) {
    console.error('Set folder color failed:', error);
    return { error: error.message || 'Failed to set folder color.' };
  }
}

export async function setFolderColorsAction(input: {
  folderIds: string[];
  color: string;
}): Promise<DataPayload> {
  try {
    for (const folderId of input.folderIds) {
      await setFolderColor(folderId, input.color);
    }
    return await refreshedData();
  } catch (error: any) {
    console.error('Set folder colors failed:', error);
    return { error: error.message || 'Failed to set folder colors.' };
  }
}

export async function moveNoteAction(input: {
  noteId: string;
  targetFolderId: string;
}): Promise<DataPayload & { movedNoteId?: string }> {
  try {
    const { movedNoteId } = await moveNoteToFolder(input.noteId, input.targetFolderId);
    return await refreshedData({ movedNoteId });
  } catch (error: any) {
    console.error('Move note failed:', error);
    return { error: error.message || 'Failed to move note.' };
  }
}

export async function moveFolderAction(input: {
  folderId: string;
  targetParentFolderId: string;
}): Promise<DataPayload & { movedFolderId?: string }> {
  try {
    const { movedFolderId } = await moveFolderToFolder(input.folderId, input.targetParentFolderId);
    return await refreshedData({ movedFolderId });
  } catch (error: any) {
    console.error('Move folder failed:', error);
    return { error: error.message || 'Failed to move folder.' };
  }
}

export async function restoreTrashNoteAction(input: {
  trashNoteId: string;
}): Promise<DataPayload> {
  try {
    await restoreTrashNote(input.trashNoteId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Restore trash note failed:', error);
    return { error: error.message || 'Failed to restore note from trash.' };
  }
}

export async function restoreTrashFolderAction(input: {
  trashFolderId: string;
}): Promise<DataPayload> {
  try {
    await restoreTrashFolder(input.trashFolderId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Restore trash folder failed:', error);
    return { error: error.message || 'Failed to restore folder from trash.' };
  }
}

export async function permanentlyDeleteTrashNoteAction(input: {
  trashNoteId: string;
}): Promise<DataPayload> {
  try {
    await permanentlyDeleteTrashNote(input.trashNoteId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Permanent delete trash note failed:', error);
    return { error: error.message || 'Failed to permanently delete note.' };
  }
}

export async function permanentlyDeleteTrashFolderAction(input: {
  trashFolderId: string;
}): Promise<DataPayload> {
  try {
    await permanentlyDeleteTrashFolder(input.trashFolderId);
    return await refreshedData();
  } catch (error: any) {
    console.error('Permanent delete trash folder failed:', error);
    return { error: error.message || 'Failed to permanently delete folder.' };
  }
}
