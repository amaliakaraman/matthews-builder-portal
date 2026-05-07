import { Resend } from "resend";
import { prisma } from "@/lib/db/prisma";
import type { NotificationKind } from "@/lib/db/types";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export interface SendNotificationInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  projectId?: string | null;
}

/**
 * Persists an in-app Notification row and best-effort sends an email via
 * Resend. If RESEND_API_KEY is unset the email is logged to stdout — the
 * portal still works end-to-end without email configured.
 */
export async function sendNotification(input: SendNotificationInput) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      projectId: input.projectId ?? null,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.email) return;

  const resend = getResend();
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Builder Portal <noreply@example.com>";

  const subject = `[Builder Portal] ${input.title}`;
  const text = `${input.title}\n\n${input.body ?? ""}\n\n— Builder Portal\n${
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  }${input.projectId ? `/projects/${input.projectId}` : ""}`;

  if (!resend) {
    console.log(
      `[email no-op] to=${user.email} subject="${subject}"\n${text}`
    );
    return;
  }

  try {
    await resend.emails.send({
      from,
      to: user.email,
      subject,
      text,
    });
  } catch (err) {
    console.error("Resend send failed:", err);
  }
}
