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
import { DataTable, type Column } from "@/components/brand/data-table";
import { StatusChip } from "@/components/brand/status-chip";
import {
  toggleSponsorActiveAction,
  upsertSponsorAction,
} from "@/lib/admin/admin-server";
import { AUDIENCE_LABELS } from "@/lib/db/types";

interface Sponsor {
  id: string;
  email: string;
  name: string;
  audienceType: string;
  isActive: boolean;
}

const AUDIENCE_KEYS = Object.keys(AUDIENCE_LABELS);

export function SponsorsAdmin({ sponsors }: { sponsors: Sponsor[] }) {
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [draft, setDraft] = useState({
    email: "",
    name: "",
    audienceType: AUDIENCE_KEYS[0],
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const data = editing
        ? {
            id: editing.id,
            email: editing.email,
            name: editing.name,
            audienceType: editing.audienceType,
            isActive: editing.isActive,
          }
        : {
            email: draft.email,
            name: draft.name,
            audienceType: draft.audienceType,
            isActive: true,
          };
      const res = await upsertSponsorAction(
        data as {
          id?: string;
          email: string;
          name: string;
          audienceType:
            | "agents"
            | "market_leaders"
            | "financiers"
            | "marketers"
            | "sales_ops";
          isActive?: boolean;
        }
      );
      if (res?.ok) {
        setEditing(null);
        setDraft({ email: "", name: "", audienceType: AUDIENCE_KEYS[0] });
      } else setError(res?.error ?? "Could not save.");
    });
  };

  const columns: Column<Sponsor>[] = [
    {
      key: "name",
      header: "Name",
      isLeading: true,
      cell: (s) => (
        <button
          type="button"
          onClick={() => setEditing(s)}
          className="font-medium hover:text-electric-light text-left"
        >
          {s.name}
        </button>
      ),
    },
    { key: "email", header: "Email", align: "left" },
    {
      key: "audienceType",
      header: "Audience",
      cell: (s) => AUDIENCE_LABELS[s.audienceType] ?? s.audienceType,
    },
    {
      key: "isActive",
      header: "Status",
      cell: (s) => (
        <StatusChip variant={s.isActive ? "success" : "muted"}>
          {s.isActive ? "Active" : "Inactive"}
        </StatusChip>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            start(async () => {
              await toggleSponsorActiveAction({
                id: s.id,
                isActive: !s.isActive,
              });
            })
          }
        >
          {s.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DataTable
          columns={columns}
          rows={sponsors}
          rowKey={(s) => s.id}
          emptyState="No sponsors yet."
        />
      </div>
      <form
        onSubmit={onSave}
        className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-5 space-y-4 self-start"
      >
        <h3 className="font-bold">
          {editing ? `Edit ${editing.name}` : "Add sponsor"}
        </h3>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={editing ? editing.name : draft.name}
            onChange={(e) =>
              editing
                ? setEditing({ ...editing, name: e.target.value })
                : setDraft({ ...draft, name: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={editing ? editing.email : draft.email}
            onChange={(e) =>
              editing
                ? setEditing({ ...editing, email: e.target.value })
                : setDraft({ ...draft, email: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Audience type</Label>
          <Select
            value={editing ? editing.audienceType : draft.audienceType}
            onValueChange={(v) =>
              editing
                ? setEditing({ ...editing, audienceType: v })
                : setDraft({ ...draft, audienceType: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {AUDIENCE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save" : "Add sponsor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
