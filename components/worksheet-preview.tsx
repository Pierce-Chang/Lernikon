"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Inline PDF preview that pops up after a worksheet was generated. The user
 * decides whether to download (button) or close (and lose the preview).
 *
 * Note: generation has already consumed a quota slot at the time this dialog
 * opens — re-running the form draws another slot. That's the contract.
 */
export const WorksheetPreview = ({
  url,
  filename,
  onClose,
}: {
  url: string;
  filename: string;
  onClose: () => void;
}) => {
  const triggerDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-3 p-5 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vorschau</DialogTitle>
          <DialogDescription>
            So sieht das Arbeitsblatt aus. Wenn du zufrieden bist, lade es als
            PDF herunter. Sonst Schließen und neu erstellen.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={url}
          title="Arbeitsblatt-Vorschau"
          className="border-border h-[68vh] w-full rounded-md border bg-white"
        />
        <DialogFooter className="mx-0 mb-0 rounded-b-xl border-0 bg-transparent p-0">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button onClick={triggerDownload}>Herunterladen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
