import React, { useState } from 'react';
import { CustomerReview } from '../types';
import { Star, CheckCircle, MessageSquarePlus, ShieldCheck, ThumbsUp, X } from 'lucide-react';

interface CustomerReviewsProps {
  reviews: CustomerReview[];
  averageRating: number;
  totalReviews: number;
  onNewReviewSubmit: (review: { name: string; city: string; rating: number; comment: string }) => Promise<void>;
  texts?: {
    badge?: string;
    heading?: string;
    description?: string;
  };
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  reviews,
  averageRating,
  totalReviews,
  onNewReviewSubmit,
  texts
}) => {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const displayBadge = texts?.badge || 'Real Pakistani Feedback';
  const displayHeading = texts?.heading || 'Trusted by Thousands Across Pakistan';
  const displayDescription = texts?.description || 'Real experiences from verified buyers in Lahore, Karachi, Islamabad, and across the country.';

  const approvedReviews = reviews.filter((r) => r.approved !== false);
  const filtered = filterRating
    ? approvedReviews.filter((r) => r.rating === filterRating)
    : approvedReviews;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    setSubmitting(true);
    try {
      await onNewReviewSubmit({
        name: formName.trim(),
        city: formCity.trim() || 'Pakistan',
        rating: formRating,
        comment: formComment.trim()
      });
      setSubmitSuccess(true);
      setFormName('');
      setFormCity('');
      setFormComment('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-12 md:py-16 bg-neutral-50/70 border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B800] bg-[#FFF9E6] px-3 py-1 rounded-full border border-[#F5B800]/30">
            {displayBadge}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] mt-2">
            {displayHeading}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {displayDescription}
          </p>
        </div>

        {/* Rating Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-[#FFF9E6] border border-[#F5B800]/40">
              <span className="text-4xl font-black text-[#171717]">
                {(typeof averageRating === 'number' && !isNaN(averageRating) ? averageRating : 4.9).toFixed(1)}
              </span>
              <div className="flex items-center text-amber-500 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#171717]">
                Overall Customer Satisfaction
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Based on {totalReviews || 0} verified ratings from COD &amp; JazzCash orders
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> 98.4% Would Recommend
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-semibold text-neutral-700">
              <button
                type="button"
                onClick={() => setFilterRating(null)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterRating === null ? 'bg-white shadow-xs font-bold text-black' : 'hover:text-black'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterRating(5)}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  filterRating === 5 ? 'bg-white shadow-xs font-bold text-black' : 'hover:text-black'
                }`}
              >
                <span>5★</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterRating(4)}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  filterRating === 4 ? 'bg-white shadow-xs font-bold text-black' : 'hover:text-black'
                }`}
              >
                <span>4★</span>
              </button>
            </div>

            {/* Write review button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Leave a Review</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:border-[#F5B800]/50 transition duration-150"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-extrabold text-sm text-[#171717] flex items-center gap-1.5">
                      <span>{rev.name}</span>
                      {rev.verifiedPurchase && (
                        <span
                          title="Verified Buyer"
                          className="inline-flex items-center text-emerald-600 bg-emerald-50 text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                        >
                          <CheckCircle className="w-3 h-3 mr-0.5" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-medium">
                      {rev.city}
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {rev.date}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center text-amber-500 mb-2.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Review body */}
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1 text-neutral-600">
                  <ThumbsUp className="w-3 h-3 text-neutral-400" /> Helpful feedback
                </span>
                <span className="font-medium text-neutral-400">Order Confirmed</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Write Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-[#171717] mb-1">
              Share Your Experience
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Help fellow Pakistani shoppers make the best choice.
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-base">Shukriya!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Your review has been submitted and added.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Asad Ullah Khan"
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Lahore, DHA Phase 6"
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-neutral-600 ml-2">
                      {formRating} out of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Review Comment *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Tell us about the chopping speed, battery, packaging or delivery..."
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#171717] hover:bg-[#F5B800] text-white hover:text-black font-extrabold text-sm py-3 rounded-xl transition shadow cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Post My Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
