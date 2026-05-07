"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils";
import { addCommentAction } from "@/lib/projects/project-server";

interface Props {
  projectId: string;
  comments: Array<{
    id: string;
    body: string;
    authorName: string;
    createdAt: string;
  }>;
  currentUserName: string;
}

export function CommentsThread({ projectId, comments, currentUserName }: Props) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    start(async () => {
      const res = await addCommentAction({ projectId, body });
      if (res?.ok) setBody("");
      else setError(res?.error ?? "Could not add comment.");
    });
  };

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-3">
        Comments
      </h3>
      <ul className="space-y-4 mb-5">
        {comments.length === 0 ? (
          <li className="text-sm text-matthews-deep/50">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-[var(--radius-matthews)] bg-platinum p-3"
            >
              <div className="flex items-center justify-between text-xs text-matthews-deep/60 mb-1">
                <span className="font-medium">{c.authorName}</span>
                <span>{formatRelative(c.createdAt)}</span>
              </div>
              <p className="text-sm text-matthews-deep/85 whitespace-pre-wrap">
                {c.body}
              </p>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Comment as ${currentUserName}…`}
          required
        />
        {error ? (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending || !body.trim()} size="sm">
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
