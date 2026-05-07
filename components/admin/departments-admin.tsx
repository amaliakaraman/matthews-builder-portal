"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/brand/data-table";
import { StatusChip } from "@/components/brand/status-chip";
import {
  toggleDepartmentActiveAction,
  upsertDepartmentAction,
} from "@/lib/admin/admin-server";

interface Department {
  id: string;
  name: string;
  coreJobsDescription: string | null;
  isActive: boolean;
}

export function DepartmentsAdmin({
  departments,
}: {
  departments: Department[];
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await upsertDepartmentAction({
        id: editing?.id,
        name: editing ? editing.name : name,
        coreJobsDescription: editing ? editing.coreJobsDescription : desc,
        isActive: editing ? editing.isActive : true,
      });
      if (res?.ok) {
        setName("");
        setDesc("");
        setEditing(null);
      } else setError(res?.error ?? "Could not save.");
    });
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      isLeading: true,
      cell: (d) => (
        <button
          type="button"
          onClick={() => setEditing(d)}
          className="font-medium text-matthews-deep hover:text-electric-light text-left"
        >
          {d.name}
        </button>
      ),
    },
    {
      key: "coreJobsDescription",
      header: "Core jobs",
      cell: (d) => (
        <span className="text-matthews-deep/70">
          {d.coreJobsDescription ?? "—"}
        </span>
      ),
      align: "left",
    },
    {
      key: "isActive",
      header: "Status",
      cell: (d) => (
        <StatusChip variant={d.isActive ? "success" : "muted"}>
          {d.isActive ? "Active" : "Inactive"}
        </StatusChip>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (d) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            start(async () => {
              await toggleDepartmentActiveAction({
                id: d.id,
                isActive: !d.isActive,
              });
            })
          }
        >
          {d.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <DataTable
          columns={columns}
          rows={departments}
          rowKey={(d) => d.id}
          emptyState="No departments yet."
        />
      </div>
      <form
        onSubmit={onSave}
        className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-5 space-y-4 self-start"
      >
        <h3 className="font-bold text-matthews-deep">
          {editing ? `Edit "${editing.name}"` : "Add department"}
        </h3>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={editing ? editing.name : name}
            onChange={(e) =>
              editing
                ? setEditing({ ...editing, name: e.target.value })
                : setName(e.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Core jobs description</Label>
          <Textarea
            value={
              editing
                ? (editing.coreJobsDescription ?? "")
                : desc
            }
            onChange={(e) =>
              editing
                ? setEditing({
                    ...editing,
                    coreJobsDescription: e.target.value,
                  })
                : setDesc(e.target.value)
            }
            rows={3}
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          {editing ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditing(null)}
              disabled={pending}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save" : "Add department"}
          </Button>
        </div>
      </form>
    </div>
  );
}
