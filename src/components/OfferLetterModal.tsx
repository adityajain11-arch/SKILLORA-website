import React from 'react';
import { OfferLetter } from '../types';
import { X, Printer, Award, CheckCircle2, ShieldCheck, Sparkles, Building2, Calendar, MapPin, DollarSign } from 'lucide-react';

interface OfferLetterModalProps {
  offer: OfferLetter;
  onClose: () => void;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({ offer, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Action Bar (hidden in print) */}
        <div className="p-4 sm:px-6 bg-[#FFF8F0] dark:bg-[#26223A] border-b border-[#7C6CF0]/15 dark:border-[#3D3759] flex items-center justify-between gap-4 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C6CF0] to-[#FF8A65] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              ✦
            </div>
            <div>
              <span className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider block">
                Official Fellowship Appointment
              </span>
              <span className="text-xs text-[#6B6880] dark:text-[#A5A0BA]">
                Verification ID: {offer.letterId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#7C6CF0]/10 hover:bg-[#7C6CF0]/20 text-[#7C6CF0] dark:text-[#A99CFF] flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#6B6880] dark:text-[#A5A0BA] hover:bg-[#7C6CF0]/10 hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-[#1B1826] font-sans selection:bg-[#7C6CF0]/15">
          
          {/* Formal Letterhead */}
          <div className="border-b-2 border-[#1B1826] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-[#1B1826]">
                  WORKVANTA
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1B1826] text-white">
                  PARTNER GUILD
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                National Sanctuary for Remote Tech Fellowships & Early-Career Engineering · India
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-stone-600 space-y-0.5">
              <div><strong className="text-stone-900">Document No:</strong> {offer.letterId}</div>
              <div><strong className="text-stone-900">Issue Date:</strong> {offer.issuedDate}</div>
              <div><strong className="text-stone-900">Jurisdiction:</strong> India (100% Async Remote)</div>
            </div>
          </div>

          {/* Recipient Addressee */}
          <div className="mb-6 text-sm text-stone-800 space-y-1">
            <p className="font-bold text-base text-stone-900">To: {offer.candidateName}</p>
            {offer.candidateEmail && <p className="text-xs text-stone-600">{offer.candidateEmail}</p>}
            <p className="text-xs text-stone-600">Candidate for: {offer.roleTitle} at {offer.company}</p>
          </div>

          {/* Subject Line */}
          <div className="p-3.5 mb-6 rounded-xl bg-stone-100 border border-stone-200">
            <h2 className="text-sm font-bold text-stone-900">
              CONFIDENTIAL & OFFICIAL: Formal Offer of Remote Fellowship Appointment — {offer.company}
            </h2>
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-4 text-xs sm:text-sm text-stone-800 leading-relaxed">
            <p className="whitespace-pre-line font-normal">
              {offer.letterBody}
            </p>

            {/* Structured Terms Grid */}
            <div className="my-6 p-4 rounded-2xl border border-stone-300 bg-stone-50 space-y-3">
              <div className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
                <Award className="w-4 h-4 text-[#7C6CF0]" />
                <span>Fellowship Terms & Compensation Schedule</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Host Enterprise:</span>
                    <span className="text-stone-700">{offer.company}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Fellowship Terms:</span>
                    <span className="text-stone-900 font-bold">{offer.stipendAmount}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Program Start Date:</span>
                    <span className="text-stone-700">{offer.startDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Work Arrangement:</span>
                    <span className="text-stone-700">{offer.remoteLocation} (Zero Relocation Needed)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-normal">
              By confirming this offer, you agree to abide by the intellectual property, confidentiality, and remote team agreements of {offer.company}. You will receive onboarding documentation and your digital hardware credit voucher one week prior to your start date.
            </p>
          </div>

          {/* Signature Block & Verification Stamp */}
          <div className="mt-10 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="font-serif italic text-lg text-stone-900 border-b border-stone-400 pb-1 w-48">
                {offer.signerName}
              </div>
              <div className="text-xs font-bold text-stone-900">{offer.signerName}</div>
              <div className="text-[11px] text-stone-600">{offer.signerTitle}</div>
              <div className="text-[11px] text-stone-500">{offer.company} × Workvanta Admissions</div>
            </div>

            {/* Official Seal Graphic */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-[#7C6CF0]/40 bg-[#7C6CF0]/5">
              <ShieldCheck className="w-8 h-8 text-[#7C6CF0]" />
              <div className="text-left text-[10px] text-stone-700 leading-tight">
                <span className="font-bold block text-stone-900 uppercase">Cryptographically Verified</span>
                <span>Workvanta Certified Offer Letter</span>
                <span className="block text-stone-500 font-mono mt-0.5">ID: {offer.letterId}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
