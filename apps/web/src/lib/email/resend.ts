import { Resend } from "resend";

const client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Best-effort, jamais bloquant : un email raté (domaine pas encore vérifié,
// clé absente en dev, panne Resend) ne doit jamais faire échouer l'action
// serveur qui l'appelle — l'insert métier a déjà réussi à ce stade.
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!client || !process.env.RESEND_FROM_EMAIL) {
    console.error("[email] RESEND_API_KEY ou RESEND_FROM_EMAIL absent — envoi ignoré:", subject);
    return;
  }
  try {
    const { error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      replyTo,
    });
    if (error) console.error("[email] échec d'envoi:", subject, error);
  } catch (err) {
    console.error("[email] exception à l'envoi:", subject, err);
  }
}
