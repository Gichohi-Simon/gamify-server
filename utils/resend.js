import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResendEmails({ to, subject, html }) {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error("FROM_EMAIL is missing in env");
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is missing in env");

  return resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}
