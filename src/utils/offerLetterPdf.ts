import { Application } from '../types';

function escapePdfWinAnsi(text: string): string {
  let out = '';
  for (const ch of text) {
    if (ch === '\\') out += '\\\\';
    else if (ch === '(') out += '\\(';
    else if (ch === ')') out += '\\)';
    else if (ch === '’' || ch === '‘') out += '\\222';
    else if (ch === '—') out += '\\227';
    else if (ch === '–') out += '\\226';
    else if (ch.charCodeAt(0) <= 126) out += ch;
    else out += ' ';
  }
  return out;
}

function wrapTextLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatOfferDate(rawDate?: string): string {
  if (rawDate && rawDate.trim()) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime()) && /\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return rawDate.trim();
  }
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function stringToLatin1Bytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function buildClientOfferLetterPdfBytes(params: {
  candidateName: string;
  issuedDate: string;
  domain: string;
}): Uint8Array {
  const name = (params.candidateName || 'Candidate').trim();
  const dateStr = formatOfferDate(params.issuedDate);
  const domain = (params.domain || 'Software Engineering').trim();

  const W = 595;
  const H = 842;

  const ops: string[] = [];

  // White background
  ops.push('1 1 1 rg 0 0 595 842 re f');

  // Subtle decorative dots (top-right & bottom-left)
  ops.push('0.78 0.82 0.75 rg');
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (r + c <= 5) {
        ops.push(`${520 + c * 11} ${820 - r * 11} 2.2 2.2 re f`);
        ops.push(`${18 + c * 11} ${20 + r * 11} 2.2 2.2 re f`);
      }
    }
  }

  const pushCircleFill = (cx: number, cy: number, rad: number, rgb: string) => {
    const k = 0.5522847498 * rad;
    ops.push(`${rgb} rg`);
    ops.push(`${cx} ${cy + rad} m`);
    ops.push(`${cx + k} ${cy + rad} ${cx + rad} ${cy + k} ${cx + rad} ${cy} c`);
    ops.push(`${cx + rad} ${cy - k} ${cx + k} ${cy - rad} ${cx} ${cy - rad} c`);
    ops.push(`${cx - k} ${cy - rad} ${cx - rad} ${cy - k} ${cx - rad} ${cy} c`);
    ops.push(`${cx - rad} ${cy + k} ${cx - k} ${cy + rad} ${cx} ${cy + rad} c f`);
  };

  const pushCircleStroke = (cx: number, cy: number, rad: number, rgb: string, lw: number) => {
    const k = 0.5522847498 * rad;
    ops.push(`${lw} w ${rgb} RG`);
    ops.push(`${cx} ${cy + rad} m`);
    ops.push(`${cx + k} ${cy + rad} ${cx + rad} ${cy + k} ${cx + rad} ${cy} c`);
    ops.push(`${cx + rad} ${cy - k} ${cx + k} ${cy - rad} ${cx} ${cy - rad} c`);
    ops.push(`${cx - k} ${cy - rad} ${cx - rad} ${cy - k} ${cx - rad} ${cy} c`);
    ops.push(`${cx - rad} ${cy + k} ${cx - k} ${cy + rad} ${cx} ${cy + rad} c S`);
  };

  // Top-right decorative circles & concentric charcoal rings
  pushCircleFill(498, 804, 48, '0.67 0.73 0.62');
  pushCircleFill(555, 780, 32, '0.84 0.77 0.55');
  for (const r of [24, 34, 44, 54]) {
    pushCircleStroke(465, 836, r, '0.18 0.21 0.25', 2.2);
  }

  // Bottom-left decorative circles & concentric charcoal rings
  pushCircleFill(98, 36, 48, '0.67 0.73 0.62');
  pushCircleFill(42, 60, 32, '0.84 0.77 0.55');
  for (const r of [24, 34, 44, 54]) {
    pushCircleStroke(130, 4, r, '0.18 0.21 0.25', 2.2);
  }

  // Top-left Skillora Logo emblem + wordmark
  ops.push('0.45 0.71 0.69 rg 74 756 18 10 re f');
  ops.push('0.64 0.77 0.64 rg 70 766 22 11 re f');
  ops.push('0.82 0.76 0.54 rg 78 746 18 10 re f');
  ops.push('BT /F2 30 Tf 0.65 0.77 0.71 rg 104 752 Td (Skillora) Tj ET');

  // Gold horizontal divider with dark end dots
  ops.push('1 w 0.80 0.73 0.48 RG 55 712 m 540 712 l S');
  pushCircleFill(55, 712, 2.2, '0.18 0.21 0.25');
  pushCircleFill(540, 712, 2.2, '0.18 0.21 0.25');

  // Centered Heading: INTERNSHIP OFFER LETTER
  ops.push('BT /F2 22 Tf 0.66 0.73 0.58 rg 146 675 Td (INTERNSHIP OFFER LETTER) Tj ET');

  // Recipient & Date row
  ops.push('BT /F2 11.5 Tf 0.18 0.21 0.25 rg 60 632 Td (To:) Tj ET');
  ops.push(`BT /F2 11.5 Tf 0.18 0.21 0.25 rg 60 616 Td (${escapePdfWinAnsi(name)}) Tj ET`);
  const dateApproxWidth = dateStr.length * 6;
  const dateX = Math.max(360, 535 - dateApproxWidth);
  ops.push(`BT /F1 11.5 Tf 0.18 0.21 0.25 rg ${dateX} 632 Td (${escapePdfWinAnsi(dateStr)}) Tj ET`);

  // Exact Skillora Offer Letter paragraphs (only domain changes)
  const paragraphs = [
    'Dear Candidate,',
    `Congratulations! We’re pleased to inform you that you have successfully registered for the ${domain} Internship Program at Skillora.`,
    'At Skillora, we believe that every new skill is an opportunity to grow, explore, and build something meaningful. We’re glad to have you take this step toward your professional journey. This internship is designed to help you strengthen your knowledge, gain practical exposure, and develop skills that will be valuable in your future career.',
    'Throughout the program, we encourage you to stay curious, learn by doing, and make the most of the opportunities available to you. We hope your experience with Skillora will be both rewarding and a stepping stone toward your career goals.',
    'Thank you for choosing Skillora to be a part of your learning journey. We look forward to having you with us and wish you the very best for the journey ahead.',
    'Welcome to Skillora!',
    'Warm regards,',
    'Team Skillora',
    'Skillora — Learn, Grow, Succeed.',
  ];

  let cursorY = 576;
  for (let idx = 0; idx < paragraphs.length; idx++) {
    const lines = wrapTextLines(paragraphs[idx], 76);
    for (const line of lines) {
      ops.push(`BT /F1 11.5 Tf 0.16 0.18 0.22 rg 50 ${cursorY} Td (${escapePdfWinAnsi(line)}) Tj ET`);
      cursorY -= 17;
    }
    cursorY -= idx >= 5 ? 2 : 5;
  }

  // Bottom-left Founder signature block
  ops.push('BT /F2 11.5 Tf 0.18 0.21 0.25 rg 60 144 Td (Aditya Jain) Tj ET');
  ops.push('BT /F2 11 Tf 0.18 0.21 0.25 rg 60 127 Td (Founder) Tj ET');

  // Bottom-right Contact block + vertical gold bar
  ops.push('BT /F1 10.5 Tf 0.18 0.21 0.25 rg 446 112 Td (6394050860) Tj ET');
  ops.push('BT /F1 10.5 Tf 0.18 0.21 0.25 rg 372 96 Td (adityajain22112006@gmail.com) Tj ET');
  ops.push('1 w 0.80 0.73 0.48 RG 534 78 m 534 128 l S');
  pushCircleFill(534, 78, 1.8, '0.80 0.73 0.48');
  pushCircleFill(534, 128, 1.8, '0.80 0.73 0.48');

  const contentStream = ops.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return stringToLatin1Bytes(pdf);
}

export function downloadOfferLetterPdfFromApplication(
  app: Application,
  fallbackCandidateName?: string
): void {
  const candidateName =
    app.offerLetter?.candidateName ||
    app.applicantName ||
    fallbackCandidateName ||
    'Candidate';
  const issuedDate = formatOfferDate(
    app.offerLetter?.issuedDate || app.nextStepDate || app.appliedDate
  );
  const domain = app.offerLetter?.roleTitle || app.roleTitle || 'Software Engineering';

  const pdfBytes = buildClientOfferLetterPdfBytes({
    candidateName,
    issuedDate,
    domain,
  });

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = candidateName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  link.href = url;
  link.download = `offer_letter_${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
