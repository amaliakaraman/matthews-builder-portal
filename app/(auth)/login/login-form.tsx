"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage("Check your email — we sent a magic link.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong sending your magic link."
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@matthews.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sending" || status === "sent"}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={status === "sending" || status === "sent"}
      >
        {status === "sending"
          ? "Sending…"
          : status === "sent"
            ? "Magic link sent"
            : "Send magic link"}
      </Button>
      {message ? (
        <p
          role="status"
          className={
            status === "error"
              ? "text-sm text-[var(--color-danger)]"
              : "text-sm text-matthews-deep/70"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
