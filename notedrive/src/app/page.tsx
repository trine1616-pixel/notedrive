import { Dashboard } from "@/components/dashboard";
import { getStorageData } from "@/lib/storage";

export const dynamic = 'force-dynamic'; // Disable caching to see changes immediately

export default async function Home() {
  const { notes, folders, trashNotes, trashFolders, storageProvider } = await getStorageData();
  return (
    <Dashboard
      initialNotes={notes}
      initialFolders={folders}
      initialTrashNotes={trashNotes}
      initialTrashFolders={trashFolders}
      storageProvider={storageProvider}
    />
  );
}
