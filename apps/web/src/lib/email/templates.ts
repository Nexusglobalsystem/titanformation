const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const NAVY = "#003366";
const GOLD = "#d4af37";
const INK = "#0b1c30";
const MUTED = "#4b5b6e";
const BORDER = "#dde3ea";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f8f9fa;font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="background:${NAVY};padding:20px 28px;">
                <span style="font-size:18px;font-weight:700;color:${GOLD};letter-spacing:0.02em;">Titan Kinetic</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:18px;line-height:1.4;color:${INK};">${escapeHtml(title)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
                  Titan Kinetic — organisme de formation certifié Qualiopi.<br />
                  Une question ? <a href="mailto:contact@titankinetic.fr" style="color:${NAVY};">contact@titankinetic.fr</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${INK};">${text}</p>`;
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${MUTED};">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};">
    ${rows}
  </table>`;
}

export function enrollmentConfirmationEmail(params: {
  recipientName: string;
  trainingTitle: string;
  sessionReference: string;
  startsOn: string;
  endsOn: string;
}) {
  const { recipientName, trainingTitle, sessionReference, startsOn, endsOn } = params;
  const body =
    paragraph(`Bonjour ${escapeHtml(recipientName)},`) +
    paragraph(
      `Votre préinscription à la formation <strong>${escapeHtml(trainingTitle)}</strong> a bien été enregistrée.`,
    ) +
    detailsTable(
      detailRow("Session", escapeHtml(sessionReference)) +
        detailRow("Début", escapeHtml(formatDate(startsOn))) +
        detailRow("Fin", escapeHtml(formatDate(endsOn))),
    ) +
    paragraph("Un gestionnaire vous contactera pour finaliser l'inscription et confirmer votre place.");
  return { subject: `Préinscription confirmée — ${trainingTitle}`, html: emailShell("Préinscription confirmée", body) };
}

export function quoteAcknowledgementEmail(params: {
  recipientName: string;
  reference: string;
  trainingTitle: string;
  quantity: number;
  totalHt: number;
}) {
  const { recipientName, reference, trainingTitle, quantity, totalHt } = params;
  const body =
    paragraph(`Bonjour ${escapeHtml(recipientName)},`) +
    paragraph(`Votre demande de devis pour <strong>${escapeHtml(trainingTitle)}</strong> a bien été reçue.`) +
    detailsTable(
      detailRow("Référence", escapeHtml(reference)) +
        detailRow("Participants", String(quantity)) +
        detailRow("Montant estimé", `${totalHt.toLocaleString("fr-FR")} € HT`),
    ) +
    paragraph("Notre équipe vous recontactera prochainement pour finaliser les modalités.");
  return { subject: `Demande de devis reçue — ${reference}`, html: emailShell("Demande de devis reçue", body) };
}

export function quoteStaffAlertEmail(params: {
  companyName: string;
  reference: string;
  trainingTitle: string;
  totalHt: number;
}) {
  const { companyName, reference, trainingTitle, totalHt } = params;
  const body =
    paragraph(`<strong>${escapeHtml(companyName)}</strong> a demandé un devis.`) +
    detailsTable(
      detailRow("Référence", escapeHtml(reference)) +
        detailRow("Formation", escapeHtml(trainingTitle)) +
        detailRow("Montant estimé", `${totalHt.toLocaleString("fr-FR")} € HT`),
    ) +
    paragraph(`À traiter dans l'espace admin : <a href="https://titankinetic.fr/admin/devis" style="color:${NAVY};">/admin/devis</a>`);
  return { subject: `Nouvelle demande de devis — ${companyName}`, html: emailShell("Nouvelle demande de devis", body) };
}

export function employeeAddedEmail(params: { recipientName: string; companyName: string }) {
  const { recipientName, companyName } = params;
  const body =
    paragraph(`Bonjour ${escapeHtml(recipientName)},`) +
    paragraph(
      `Vous avez été rattaché·e au compte entreprise de <strong>${escapeHtml(companyName)}</strong> sur Titan Kinetic.`,
    ) +
    paragraph(
      "Votre responsable peut désormais vous inscrire directement à des formations depuis le catalogue. Retrouvez vos formations dans votre espace personnel.",
    );
  return { subject: `Rattaché·e à ${companyName} sur Titan Kinetic`, html: emailShell("Compte entreprise", body) };
}
