import React, { useState } from 'react';
import { OfferLetter } from '../types';
import { X, Printer, Download } from 'lucide-react';

interface OfferLetterModalProps {
  offer: OfferLetter;
  applicationId?: string;
  onClose: () => void;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
  offer,
  applicationId,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!applicationId) {
      window.print();
      return;
    }
    setDownloading(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('workvanta_auth_token') : null;
      const res = await fetch(`/api/applications/${applicationId}/offer-letter.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        window.print();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = offer.candidateName.replace(/[^a-zA-Z0-9_-]+/g, '_');
      link.href = url;
      link.download = `offer_letter_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const domain = offer.roleTitle || 'Software Engineering';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Action Bar (hidden in print) */}
        <div className="p-4 sm:px-6 bg-[#FFF8F0] dark:bg-[#26223A] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-4 print:hidden shrink-0">
          <div>
            <span className="text-xs font-bold text-[#6E8B6E] dark:text-[#A9C7A9] uppercase tracking-wider block">
              Skillora Internship Offer Letter
            </span>
            <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
              Issued to {offer.candidateName} · {offer.issuedDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {applicationId && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#006949] dark:text-[#5EE3B0] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#7C6CF0]/10 hover:bg-[#7C6CF0]/20 text-[#7C6CF0] dark:text-[#A99CFF] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Skillora Official Offer Letter Document */}
        <div className="relative flex-1 overflow-y-auto bg-white text-[#23262F] font-sans p-8 sm:p-14 selection:bg-[#9bb38f]/25">
          {/* Top-Right Geometric Accent Corner */}
          <svg
            width="210"
            height="170"
            viewBox="0 0 210 170"
            className="absolute top-0 right-0 pointer-events-none select-none"
            aria-hidden="true"
          >
            {/* Subtle Dot Grid */}
            {Array.from({ length: 7 }).map((_, r) =>
              Array.from({ length: 7 }).map((__, c) =>
                r + c >= 5 ? (
                  <circle
                    key={`tr-${r}-${c}`}
                    cx={118 + c * 13}
                    cy={14 + r * 13}
                    r="1.6"
                    fill="#cad5c0"
                  />
                ) : null
              )
            )}
            <circle cx="118" cy="22" r="56" fill="#aab89f" />
            <circle cx="182" cy="48" r="38" fill="#d8c690" />
            <circle cx="88" cy="-4" r="30" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="88" cy="-4" r="42" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="88" cy="-4" r="54" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="88" cy="-4" r="66" fill="none" stroke="#2c303a" strokeWidth="2.8" />
          </svg>

          {/* Bottom-Left Geometric Accent Corner */}
          <svg
            width="210"
            height="170"
            viewBox="0 0 210 170"
            className="absolute bottom-0 left-0 pointer-events-none select-none"
            aria-hidden="true"
          >
            {Array.from({ length: 7 }).map((_, r) =>
              Array.from({ length: 7 }).map((__, c) =>
                r + c <= 6 ? (
                  <circle
                    key={`bl-${r}-${c}`}
                    cx={14 + c * 13}
                    cy={68 + r * 13}
                    r="1.6"
                    fill="#cad5c0"
                  />
                ) : null
              )
            )}
            <circle cx="96" cy="150" r="56" fill="#aab89f" />
            <circle cx="32" cy="126" r="38" fill="#d8c690" />
            <circle cx="122" cy="176" r="30" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="122" cy="176" r="42" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="122" cy="176" r="54" fill="none" stroke="#2c303a" strokeWidth="2.8" />
            <circle cx="122" cy="176" r="66" fill="none" stroke="#2c303a" strokeWidth="2.8" />
          </svg>

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Skillora Brand Header */}
            <div className="flex items-center gap-3.5 pt-2 pb-5">
              <svg width="52" height="52" viewBox="0 0 56 56" aria-hidden="true">
                <defs>
                  <linearGradient id="skilloraRibbonA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d8c587" />
                    <stop offset="50%" stopColor="#9cc3b5" />
                    <stop offset="100%" stopColor="#6eaeb8" />
                  </linearGradient>
                  <linearGradient id="skilloraRibbonB" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#72b0be" />
                    <stop offset="55%" stopColor="#a7c9ab" />
                    <stop offset="100%" stopColor="#d9c687" />
                  </linearGradient>
                </defs>
                <path
                  d="M 14 14 C 14 7 40 6 44 14 C 46 18 39 22 28 24 C 18 26 12 22 14 14 Z"
                  fill="url(#skilloraRibbonA)"
                />
                <path
                  d="M 12 23 C 16 19 36 24 42 30 C 46 34 39 40 28 38 C 17 36 8 28 12 23 Z"
                  fill="url(#skilloraRibbonB)"
                />
                <path
                  d="M 12 40 C 12 34 21 31 31 33 C 41 35 45 41 42 46 C 38 51 12 49 12 40 Z"
                  fill="url(#skilloraRibbonA)"
                />
              </svg>
              <span className="text-4xl font-extrabold tracking-tight text-[#a9c9c4]">
                Skillora
              </span>
            </div>

            {/* Gold Rule with End Dots */}
            <div className="relative flex items-center my-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2c303a] shrink-0" />
              <div className="flex-1 h-[1.5px] bg-[#d4c287]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2c303a] shrink-0" />
            </div>

            {/* Centered Title */}
            <h1 className="text-center text-2xl sm:text-[28px] font-extrabold tracking-wide text-[#a7b999] my-6 uppercase">
              INTERNSHIP OFFER LETTER
            </h1>

            {/* Addressee & Issue Date */}
            <div className="flex items-start justify-between gap-4 text-sm text-[#2c303a] mb-8">
              <div>
                <div className="font-bold">To:</div>
                <div className="font-bold">{offer.candidateName}</div>
              </div>
              <div className="font-medium text-right">{offer.issuedDate}</div>
            </div>

            {/* Exact Skillora Offer Letter Body */}
            <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-[#252830]">
              <p>Dear Candidate,</p>

              <p>
                Congratulations! We’re pleased to inform you that you have successfully registered for the{' '}
                {domain} Internship Program at Skillora.
              </p>

              <p>
                At Skillora, we believe that every new skill is an opportunity to grow, explore, and build something meaningful. We’re glad to have you take this step toward your professional journey. This internship is designed to help you strengthen your knowledge, gain practical exposure, and develop skills that will be valuable in your future career.
              </p>

              <p>
                Throughout the program, we encourage you to stay curious, learn by doing, and make the most of the opportunities available to you. We hope your experience with Skillora will be both rewarding and a stepping stone toward your career goals.
              </p>

              <p>
                Thank you for choosing Skillora to be a part of your learning journey. We look forward to having you with us and wish you the very best for the journey ahead.
              </p>

              <div className="pt-1 space-y-0.5">
                <p>Welcome to Skillora!</p>
                <p>Warm regards,</p>
                <p>Team Skillora</p>
                <p>Skillora — Learn, Grow, Succeed.</p>
              </div>
            </div>

            {/* Bottom Signature & Contact Block */}
            <div className="mt-14 mb-6 flex items-end justify-between gap-6">
              <div className="text-sm text-[#2c303a]">
                <div className="font-bold">Aditya Jain</div>
                <div className="font-bold">Founder</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs sm:text-sm text-[#2c303a] leading-snug">
                  <div>6394050860</div>
                  <div>adityajain22112006@gmail.com</div>
                </div>
                <div className="flex flex-col items-center h-14 justify-between py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4c287]" />
                  <div className="w-[1.5px] flex-1 bg-[#d4c287]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4c287]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
