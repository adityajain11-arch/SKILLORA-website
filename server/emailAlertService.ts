import crypto from 'crypto';
import nodemailer from 'nodemailer';
import * as dbQueries from '../src/db/queries.ts';

export type TrackerStage = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'archived';

export interface StatusEmailAlertInput {
  application: {
    id: string;
    userId: string;
    applicantName?: string | null;
    applicantEmail?: string | null;
    company: string;
    roleTitle: string;
    location?: string | null;
    stage: string;
    nextStepTitle?: string | null;
    nextStepDate?: string | null;
    notes?: string | null;
    offerLetter?: {
      letterId?: string;
      candidateName?: string;
      roleTitle?: string;
      company?: string;
      stipendAmount?: string;
      issuedDate?: string;
    } | null;
  };
  previousStage: string;
  newStage: string;
  extraContext?: {
    meetingLink?: string;
    interviewDate?: string;
    interviewTitle?: string;
    reviewerNotes?: string;
    offerPdfBuffer?: Buffer;
    offerFileName?: string;
  };
}

export interface EmailAlertResult {
  id: string;
  recipientEmail: string;
  recipientName: string;
  previousStage: string;
  newStage: string;
  subject: string;
  deliveryStatus: 'sent' | 'logged' | 'failed';
  provider: 'smtp' | 'resend' | 'internal-log';
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: Date;
}

const STAGE_LABELS: Record<string, string> = {
  wishlist: 'Saved / Wishlist',
  applied: 'Applied & In Review',
  interviewing: 'Interview Jam Scheduled',
  offer: 'Offer Extended',
  archived: 'Archived / Closed',
};

function formatStageLabel(stage: string): string {
  const normalized = (stage || '').toLowerCase();
  if (normalized === 'offered') return 'Offer Extended';
  return STAGE_LABELS[normalized] || stage;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStatusEmailContent(
  input: StatusEmailAlertInput,
  recipientName: string
): { subject: string; bodyText: string; bodyHtml: string } {
  const { application, previousStage, newStage, extraContext } = input;
  const normalizedNew = (newStage || '').toLowerCase();
  const prevLabel = formatStageLabel(previousStage);
  const newLabel = formatStageLabel(newStage);
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const trackerUrl = `${appUrl}/#tracker`;

  let subject = `[Workvanta Tracker] Application Status Updated: ${application.roleTitle} at ${application.company}`;
  let headline = `Your application status moved to "${newLabel}"`;
  let summaryLine = `Your internship application for ${application.roleTitle} at ${application.company} has been updated from "${prevLabel}" to "${newLabel}".`;

  if (normalizedNew === 'interviewing') {
    subject = `Interview Jam Update: ${application.roleTitle} at ${application.company}`;
    headline = `You've been invited to an Interview Jam!`;
    summaryLine = `Great news, ${recipientName}! Your application for ${application.roleTitle} at ${application.company} is now in the Interview Jam stage.`;
  } else if (normalizedNew === 'offer' || normalizedNew === 'offered') {
    subject = `Official Offer Letter Ready: ${application.roleTitle} at ${application.company}`;
    headline = `Congratulations! Your Official Offer Letter Is Ready`;
    summaryLine = `Congratulations, ${recipientName}! Your application for ${application.roleTitle} at ${application.company} has been approved and your official offer letter is now ready in your Workvanta Internship Track Record.`;
  } else if (normalizedNew === 'applied') {
    subject = `Application Confirmed: ${application.roleTitle} at ${application.company}`;
    headline = `Your application is active & under review`;
    summaryLine = `Your application for ${application.roleTitle} at ${application.company} is now in review by the admissions & engineering team.`;
  } else if (normalizedNew === 'archived') {
    subject = `Application Status Update: ${application.roleTitle} at ${application.company}`;
    headline = `Application Status Closed / Archived`;
    summaryLine = `Your application for ${application.roleTitle} at ${application.company} has been marked as "${newLabel}". You can explore new remote tracks anytime on Workvanta.`;
  }

  const detailLines: string[] = [];
  if (extraContext?.interviewTitle || application.nextStepTitle) {
    detailLines.push(`Next Step: ${extraContext?.interviewTitle || application.nextStepTitle}`);
  }
  if (extraContext?.interviewDate || application.nextStepDate) {
    const rawDate = extraContext?.interviewDate || application.nextStepDate || '';
    const parsed = new Date(rawDate);
    const formattedDate = Number.isNaN(parsed.getTime())
      ? rawDate
      : parsed.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
    detailLines.push(`Scheduled Date: ${formattedDate}`);
  }
  if (extraContext?.meetingLink) {
    detailLines.push(`Video Meeting Link: ${extraContext.meetingLink}`);
  }
  if (application.offerLetter?.letterId) {
    detailLines.push(`Offer Letter ID: ${application.offerLetter.letterId}`);
  }
  if (extraContext?.reviewerNotes) {
    detailLines.push(`Admissions Note: ${extraContext.reviewerNotes}`);
  }

  const bodyText = [
    `Hi ${recipientName},`,
    '',
    summaryLine,
    '',
    `Role: ${application.roleTitle}`,
    `Company: ${application.company}`,
    `Previous Status: ${prevLabel}`,
    `Current Status: ${newLabel}`,
    ...detailLines,
    '',
    `View your Internship Track Record: ${trackerUrl}`,
    '',
    'Best regards,',
    'Workvanta Admissions & Student Support',
  ].join('\n');

  const detailHtmlRows = detailLines
    .map((line) => {
      const [label, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      return `<tr>
        <td style="padding:6px 0;color:#6B6880;font-size:13px;width:150px;vertical-align:top;"><strong>${escapeHtml(label)}:</strong></td>
        <td style="padding:6px 0;color:#2D2A3E;font-size:13px;">${escapeHtml(value)}</td>
      </tr>`;
    })
    .join('');

  const bodyHtml = `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#FFF8F0;padding:28px 16px;color:#2D2A3E;">
      <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border:1px solid #E9E5FF;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#7C6CF0,#5E4AE3);padding:22px 26px;color:#FFFFFF;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Workvanta Internship Tracker Alert</div>
          <h1 style="margin:6px 0 0;font-size:20px;line-height:1.3;">${escapeHtml(headline)}</h1>
        </div>
        <div style="padding:24px 26px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4A4660;">${escapeHtml(summaryLine)}</p>
          <div style="background:#FAF8FF;border:1px solid #E9E5FF;border-radius:14px;padding:16px 18px;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#6B6880;font-size:13px;width:150px;"><strong>Role:</strong></td>
                <td style="padding:6px 0;color:#2D2A3E;font-size:13px;font-weight:600;">${escapeHtml(application.roleTitle)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B6880;font-size:13px;"><strong>Company:</strong></td>
                <td style="padding:6px 0;color:#2D2A3E;font-size:13px;">${escapeHtml(application.company)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B6880;font-size:13px;"><strong>Previous Status:</strong></td>
                <td style="padding:6px 0;color:#6B6880;font-size:13px;">${escapeHtml(prevLabel)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6B6880;font-size:13px;"><strong>New Status:</strong></td>
                <td style="padding:6px 0;color:#5E4AE3;font-size:13px;font-weight:700;">${escapeHtml(newLabel)}</td>
              </tr>
              ${detailHtmlRows}
            </table>
          </div>
          <a href="${escapeHtml(trackerUrl)}" style="display:inline-block;background:#7C6CF0;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;padding:11px 22px;border-radius:999px;">
            Open Internship Track Record →
          </a>
          <p style="margin:22px 0 0;font-size:12px;color:#8E8AA3;">
            This automated email alert was sent because your Workvanta application tracker status changed.
          </p>
        </div>
      </div>
    </div>
  `.trim();

  return { subject, bodyText, bodyHtml };
}

/**
 * Automated backend email alert dispatcher triggered whenever an application's
 * status/stage changes in the tracker. Delivers via Resend or SMTP when configured,
 * and always persists an auditable alert log in Cloud SQL PostgreSQL.
 */
export async function sendApplicationStatusEmailAlert(
  input: StatusEmailAlertInput
): Promise<EmailAlertResult> {
  const { application, previousStage, newStage, extraContext } = input;

  // Resolve authoritative student contact info from users & registrations tables
  const [userRecord, registrationRecord] = await Promise.all([
    dbQueries.getUserById(application.userId).catch(() => null),
    dbQueries.getRegistrationByUserId(application.userId).catch(() => null),
  ]);

  const recipientEmail =
    (application.applicantEmail || registrationRecord?.email || userRecord?.email || '').trim();
  const recipientName =
    (application.applicantName || registrationRecord?.fullName || userRecord?.name || 'Student').trim();

  const { subject, bodyText, bodyHtml } = buildStatusEmailContent(input, recipientName);
  const emailFrom = process.env.EMAIL_FROM || 'Workvanta Admissions <no-reply@workvanta.in>';
  const alertId = `alert-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  let deliveryStatus: 'sent' | 'logged' | 'failed' = 'logged';
  let provider: 'smtp' | 'resend' | 'internal-log' = 'internal-log';
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  if (!recipientEmail) {
    deliveryStatus = 'failed';
    errorMessage = 'No student email address found for this application.';
  } else if (process.env.RESEND_API_KEY) {
    provider = 'resend';
    try {
      const resendPayload: Record<string, any> = {
        from: emailFrom,
        to: [recipientEmail],
        subject,
        text: bodyText,
        html: bodyHtml,
      };
      if (extraContext?.offerPdfBuffer) {
        resendPayload.attachments = [
          {
            filename: extraContext.offerFileName || 'Workvanta_Offer_Letter.pdf',
            content: extraContext.offerPdfBuffer.toString('base64'),
          },
        ];
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });
      const data = (await res.json()) as { id?: string; message?: string };
      if (res.ok) {
        deliveryStatus = 'sent';
        providerMessageId = data.id || null;
      } else {
        deliveryStatus = 'failed';
        errorMessage = data.message || `Resend API returned HTTP ${res.status}`;
      }
    } catch (err: any) {
      deliveryStatus = 'failed';
      errorMessage = err?.message || 'Resend email request failed';
    }
  } else if (process.env.SMTP_HOST || (process.env.SMTP_USER && process.env.SMTP_PASS)) {
    provider = 'smtp';
    try {
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const smtpSecure =
        process.env.SMTP_SECURE === 'true' || smtpPort === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpSecure,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: recipientEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
        attachments: extraContext?.offerPdfBuffer
          ? [
              {
                filename: extraContext.offerFileName || 'Workvanta_Offer_Letter.pdf',
                content: extraContext.offerPdfBuffer,
                contentType: 'application/pdf',
              },
            ]
          : undefined,
      });

      deliveryStatus = 'sent';
      providerMessageId = info.messageId || null;
    } catch (err: any) {
      deliveryStatus = 'failed';
      errorMessage = err?.message || 'SMTP email dispatch failed';
    }
  } else {
    // No external SMTP / Resend secret configured; record full alert in PostgreSQL audit log
    deliveryStatus = 'logged';
    provider = 'internal-log';
    providerMessageId = `local-${alertId}`;
    console.log(
      `[EmailAlert] (${previousStage} -> ${newStage}) To: ${recipientEmail} | Subject: ${subject}`
    );
  }

  const saved = await dbQueries.createEmailAlertRecord({
    id: alertId,
    applicationId: application.id,
    userId: application.userId,
    recipientEmail: recipientEmail || 'unknown@workvanta.in',
    recipientName,
    company: application.company,
    roleTitle: application.roleTitle,
    previousStage,
    newStage,
    subject,
    bodyText,
    bodyHtml,
    deliveryStatus,
    provider,
    providerMessageId,
    errorMessage,
  });

  return {
    id: saved.id,
    recipientEmail: saved.recipientEmail,
    recipientName: saved.recipientName,
    previousStage: saved.previousStage,
    newStage: saved.newStage,
    subject: saved.subject,
    deliveryStatus: saved.deliveryStatus as 'sent' | 'logged' | 'failed',
    provider: saved.provider as 'smtp' | 'resend' | 'internal-log',
    providerMessageId: saved.providerMessageId ?? null,
    errorMessage: saved.errorMessage ?? null,
    sentAt: saved.sentAt || new Date(),
  };
}
