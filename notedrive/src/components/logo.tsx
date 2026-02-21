import { BookMarked } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
      <BookMarked className="h-6 w-6 text-accent" />
      <h1 className="text-lg font-bold group-data-[collapsible=icon]:hidden">
        NoteDrive
      </h1>
    </div>
  );
}
