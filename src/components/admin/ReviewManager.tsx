import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ThumbsUp,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  X,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { CustomerReview } from '../../types';

export const ReviewManager: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: '',
    city: 'Lahore',
    verifiedPurchase: true,
    approved: true
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproved = async (review: CustomerReview) => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !review.approved })
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, approved: !r.approved } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newReview.name.trim(),
          city: newReview.city.trim(),
          rating: Number(newReview.rating),
          comment: newReview.comment.trim(),
          verifiedPurchase: newReview.verifiedPurchase,
          approved: newReview.approved,
          date: 'Just now'
        })
      });
      if (res.ok) {
        fetchReviews();
        setIsAdding(false);
        setNewReview({
          name: '',
          rating: 5,
          comment: '',
          city: 'Lahore',
          verifiedPurchase: true,
          approved: true
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus === 'approved' && !r.approved) return false;
    if (filterStatus === 'pending' && r.approved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const approvedCount = reviews.filter((r) => r.approved).length;
  const pendingCount = reviews.filter((r) => !r.approved).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Customer Testimonials & Reviews</h1>
          <p className="text-xs text-gray-500 mt-1">
            Moderate and approve social proof displayed on the storefront to increase conversion rates across Pakistan.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Average Rating</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-gray-900">{avgRating}</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Calculated from {reviews.length} total reviews</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live on Storefront</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Approved and visible to buyers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Moderation</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Requires admin review</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, city, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'approved'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Testimonial Comment</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No reviews found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{rev.name}</span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600">{rev.city || 'Pakistan'}</td>

                    <td className="py-3 px-4">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-gray-800 line-clamp-2 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </td>

                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{rev.date || 'Recent'}</td>

                    <td className="py-3 px-4">
                      {rev.approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Eye className="w-3 h-3" />
                          <span>Live On Store</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproved(rev)}
                          title={rev.approved ? 'Hide from storefront' : 'Approve for storefront'}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            rev.approved
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {rev.approved ? 'Hide' : 'Approve'}
                        </button>

                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Review Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-black text-gray-900 text-base">Add New Customer Review</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    placeholder="e.g. Saira Khan"
                    className="w-full p-2.5 bg-gray-50 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">City in Pakistan</label>
                  <input
                    type="text"
                    value={newReview.city}
                    onChange={(e) => setNewReview({ ...newReview, city: e.target.value })}
                    placeholder="e.g. Karachi, Lahore"
                    className="w-full p-2.5 bg-gray-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Star Rating (1 - 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newReview.rating ? 'fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-gray-700 ml-2">{newReview.rating} Stars</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Testimonial Comment / Review *</label>
                <textarea
                  rows={3}
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="e.g. MashAllah bohot zabardast product hai, delivery bhi time par aayi aur chopper quality 10/10 hai..."
                  className="w-full p-2.5 bg-gray-50 border rounded-xl"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newReview.verifiedPurchase}
                    onChange={(e) => setNewReview({ ...newReview, verifiedPurchase: e.target.checked })}
                    className="w-4 h-4 text-[#F5B800] rounded"
                  />
                  <span className="font-semibold text-gray-700">Verified Buyer Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newReview.approved}
                    onChange={(e) => setNewReview({ ...newReview, approved: e.target.checked })}
                    className="w-4 h-4 text-[#F5B800] rounded"
                  />
                  <span className="font-semibold text-gray-700">Approve Immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl font-bold shadow-sm"
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
