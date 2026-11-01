import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { Star, MessageSquareQuote, CheckCircle2, ShieldCheck, Plus, X, Laptop, ThumbsUp } from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form state
  const [company, setCompany] = useState('');
  const [internshipRole, setInternshipRole] = useState('');
  const [rating, setRating] = useState(5);
  const [realStipendReport, setRealStipendReport] = useState('');
  const [honestReview, setHonestReview] = useState('');
  const [perksInput, setPerksInput] = useState('');

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !internshipRole || !honestReview) return;

    const perksArray = perksInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          internshipRole,
          rating,
          realStipendReport: realStipendReport || 'Full remote fellowship setup & hardware provided',
          honestReview,
          perksHighlights: perksArray.length > 0 ? perksArray : ['100% Remote', 'Hardware Provided']
        })
      });
      const data = await res.json();
      if (data.success) {
        fireCelebrationConfetti();
        setReviews([data.data, ...reviews]);
        setShowSubmitModal(false);
        // reset
        setCompany('');
        setInternshipRole('');
        setRealStipendReport('');
        setHonestReview('');
        setPerksInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C6CF0]/10 text-xs font-semibold text-[#7C6CF0] dark:text-[#A99CFF]">
            <MessageSquareQuote className="w-3.5 h-3.5 text-[#FF8A65]" />
            <span>Workvanta Remote Community</span>
          </div>
          <h2 className="text-2xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-2">
            Real Remote Intern Reviews in India
          </h2>
          <p className="text-sm text-[#6B6880] dark:text-[#A5A0BA] mt-1 max-w-2xl leading-relaxed">
            Read honest reflections from students across India who completed remote fellowships. Learn what the async culture was actually like, what hardware was provided, and the true fellowship experience.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-6 py-3 rounded-full text-xs font-bold bg-[#7C6CF0] hover:bg-[#6a59e6] dark:bg-[#A99CFF] dark:hover:bg-[#9788f5] text-white dark:text-[#1B1826] shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Contribute a Remote Review</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#26223A] border border-[#7C6CF0]/15 dark:border-[#3D3759] cozy-card-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#7C6CF0] dark:text-[#A99CFF] uppercase tracking-wider">
                    {rev.company}
                  </div>
                  <h3 className="text-base font-bold text-[#2D2A3E] dark:text-[#F2EEFF] mt-0.5">
                    {rev.internshipRole}
                  </h3>
                  <div className="text-xs text-[#6B6880] dark:text-[#A5A0BA] font-medium mt-0.5">
                    {rev.year}
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1 bg-[#FFF8F0] dark:bg-[#1E1A2C] px-2.5 py-1 rounded-full border border-[#7C6CF0]/15">
                  <Star className="w-3.5 h-3.5 fill-[#FF8A65] text-[#FF8A65]" />
                  <span className="text-xs font-bold text-[#2D2A3E] dark:text-[#F2EEFF] tabular-nums">
                    {rev.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Verified Fellowship Report */}
              <div className="mt-4 p-3 rounded-2xl bg-[#FFF8F0] dark:bg-[#1E1A2C] border border-[#7C6CF0]/10 dark:border-[#3D3759] text-xs">
                <span className="text-[#6B6880] dark:text-[#A5A0BA] block font-medium">Remote Fellowship Culture:</span>
                <span className="font-bold text-[#006949] dark:text-[#5EE3B0] mt-0.5 block">
                  {rev.realStipendReport}
                </span>
              </div>

              {/* Review Text */}
              <p className="mt-4 text-xs sm:text-sm text-[#474554] dark:text-[#A5A0BA] leading-relaxed">
                "{rev.honestReview}"
              </p>

              {/* Perks Highlights */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {rev.perksHighlights.map((perk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7C6CF0]/10 text-[#5846ca] dark:text-[#c7bfff]"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Bar: Remote status & Recommendation */}
            <div className="pt-3 border-t border-[#7C6CF0]/10 dark:border-[#3D3759] flex items-center justify-between text-xs text-[#6B6880] dark:text-[#A5A0BA]">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#34D399]" />
                <span>Work Format: <strong className="text-[#2D2A3E] dark:text-[#F2EEFF]">100% Remote</strong></span>
              </div>

              {rev.wouldRecommend && (
                <div className="flex items-center gap-1 text-[#006949] dark:text-[#5EE3B0] font-semibold">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Submit Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FFF8F0] dark:bg-[#26223A] border border-[#7C6CF0]/25 dark:border-[#3D3759] shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2D2A3E] dark:text-[#F2EEFF]">
                  Submit Remote Intern Review
                </h3>
                <p className="text-xs text-[#6B6880] dark:text-[#A5A0BA] mt-0.5">
                  Help fellow students across India understand remote expectations and culture.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-full text-[#6B6880] hover:bg-[#7C6CF0]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linear, Figma, Canva"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                    Remote Intern Role Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineering Intern"
                    value={internshipRole}
                    onChange={(e) => setInternshipRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Remote Setup & Team Culture
                </label>
                <input
                  type="text"
                  placeholder="e.g. M3 MacBook delivered, flexible async hours, kind mentor reviews"
                  value={realStipendReport}
                  onChange={(e) => setRealStipendReport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Overall Remote Experience Rating (1 to 5)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                >
                  <option value={5}>5 - Outstanding Remote Flexibility</option>
                  <option value={4}>4 - Great Async Culture</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Needs Better Remote Tooling</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Honest Reflections (What made you feel welcomed?)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details on remote communication, GitHub PR reviews, work-life balance from home..."
                  value={honestReview}
                  onChange={(e) => setHonestReview(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D2A3E] dark:text-[#F2EEFF] mb-1">
                  Remote Perks (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% Remote, Flexible hours, Laptop provided"
                  value={perksInput}
                  onChange={(e) => setPerksInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1A2C] border border-[#7C6CF0]/20 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#6B6880]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#7C6CF0] text-white shadow-md hover:bg-[#6a59e6]"
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
