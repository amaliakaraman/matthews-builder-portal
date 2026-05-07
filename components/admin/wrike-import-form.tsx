"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/brand/status-chip";
import { importFromWrikeAction } from "@/lib/wrike/import-server";

export function WrikeImportForm({
  wrikeConfigured,
}: {
  wrikeConfigured: boolean;
}) {
  const [mode, setMode] = useState<"project" | "folder">("project");
  const [id, setId] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{
    imported?: number;
    skipped?: number;
    error?: string;
  } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const res = await importFromWrikeAction({ mode, wrikeId: id });
      setResult(
        res?.ok
          ? { imported: res.imported, skipped: res.skipped }
          : { error: res?.error ?? "Import failed." }
      );
      if (res?.ok) setId("");
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-5 space-y-4 max-w-2xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Manual import</h3>
        <StatusChip variant={wrikeConfigured ? "success" : "warning"}>
          {wrikeConfigured ? "Wrike token configured" : "Stub mode"}
        </StatusChip>
      </div>
      <p className="text-sm text-matthews-deep/70">
        Paste a Wrike folder or project ID. The portal will create records
        flagged "imported, needs classification". Classification dimensions
        are not imported — they must be resolved in the wizard or by PX
        admin.
      </p>
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "project" | "folder")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Project / folder ID</SelectItem>
              <SelectItem value="folder">Folder (list children)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label>Wrike ID</Label>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            placeholder="IEAGS6BIL3KW…"
          />
        </div>
      </div>
      {result?.error ? (
        <p className="text-sm text-[var(--color-danger)]">{result.error}</p>
      ) : null}
      {result?.imported !== undefined ? (
        <p className="text-sm text-matthews-deep/70">
          Imported {result.imported}, skipped {result.skipped} (already in
          portal).
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !id}>
        {pending ? "Importing…" : "Import"}
      </Button>
    </form>
  );
}
