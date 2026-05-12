"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatGradeShort } from "@/lib/format/grade";
import { ChildProfileEditor } from "./child-profile-editor";
import { deleteChildProfile } from "./profile-actions";

export interface ChildRowData {
  id: string;
  name: string;
  grade: number;
  theme_preference: string;
}

export const ChildProfileRow = ({
  child,
  isPaid,
}: {
  child: ChildRowData;
  isPaid: boolean;
}) => {
  const [editing, setEditing] = useState(false),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    if (!window.confirm(`Kinderprofil „${child.name}" wirklich löschen?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteChildProfile({ id: child.id });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-medium">{child.name}</div>
          <div className="text-muted-foreground text-sm">
            {formatGradeShort(child.grade)} · Thema {child.theme_preference}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Schließen" : "Bearbeiten"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={pending}
            className="text-destructive hover:text-destructive"
          >
            {pending ? "Löschen…" : "Löschen"}
          </Button>
        </div>
      </div>
      {editing && (
        <div className="border-border mt-4 border-t pt-4">
          <ChildProfileEditor
            childId={child.id}
            initialName={child.name}
            initialGrade={child.grade}
            initialTheme={child.theme_preference}
            isPaid={isPaid}
          />
        </div>
      )}
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
};
