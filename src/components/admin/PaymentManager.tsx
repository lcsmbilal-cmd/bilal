import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import { Order, StoreSettings } from '../../types';

interface PaymentManagerProps {
  orders: Order[];
  settings: StoreSettings;
  onRefreshOrders: () => Promise<void>;
  onOpenOrder: (order: Order) => void;
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({
  orders,
  settings,
  onRefreshOrders,
  onOpenOrder
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction ID not reflected in JazzCash account');
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter JazzCash orders
  const jazzCashOrders = orders.filter((o) => o.payment.method === 'jazzcash');

  const filteredOrders = jazzCashOrders.filter((order) => {
    if (filterStatus === 'pending' && order.payment.status !== 'pending_verification') return false;
    if (filterStatus === 'confirmed' && order.payment.status !== 'confirmed') return false;
    if (filterStatus === 'rejected' && order.payment.status !== 'rejected') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.fullName.toLowerCase().includes(q) ||
        (order.payment.transactionId && order.payment.transactionId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = jazzCashOrders.filter((o) => o.payment.status === 'pending_verification').length;
  const confirmedCount = jazzCashOrders.filter((o) => o.payment.status === 'confirmed').length;
  const totalVerifiedRevenue = jazzCashOrders
    .filter((o) => o.payment.status === 'confirmed')
    .reduce((sum, o) => sum + o.pricing.grandTotal, 0);

  const handleVerify = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payments/${orderId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Verified in JazzCash Merchant Till 984210573' })
      });
      if (res.ok) {
        await onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setActionLoading(true);
    try {
      const finalReason = customReason.trim() || rejectReason;
      const res = await fetch(`/api/payments/${rejectingOrder.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason })
      });
      if (res.ok) {
        await onRefreshOrders();
        setRejectingOrder(null);
        setCustomReason('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openWhatsApp = (order: Order) => {
    const raw = order.customer.whatsappNumber || order.customer.mobileNumber;
    let cleanPhone = raw.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);

    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${order.customer.fullName},\n\nThis is Ammi Express regarding your JazzCash payment for Order #${order.orderNumber}.\nTID: ${order.payment.transactionId || 'None'}\nAmount: Rs. ${order.pricing.grandTotal.toLocaleString()}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">JazzCash QR Payment Verification</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-900 border border-pink-200">
              Till ID: {settings.jazzCashPayment?.tillId || '984210573'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Review customer payment screenshots, match 10-digit transaction IDs, and verify incoming funds.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 text-pink-600" />
            <span>{pendingCount} Pending Payment Proofs to Verify</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Verification</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Awaiting merchant check</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Confirmed Payments</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{confirmedCount}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Successfully credited</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total JazzCash Volume</span>
          <p className="text-2xl font-black text-gray-900 mt-1">Rs. {totalVerifiedRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Verified prepaid orders</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
          {[
            { id: 'all', label: 'All JazzCash' },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'rejected', label: 'Rejected' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                filterStatus === st.id
                  ? 'bg-gray-900 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search TID, customer, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Transaction ID (TID)</th>
                <th className="py-3 px-4 text-center">Payment Proof</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No JazzCash payment records found for current filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-pink-50/20 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 block">#{order.orderNumber}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{order.customer.fullName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-gray-500 font-mono text-[11px]">{order.customer.mobileNumber}</span>
                        <button
                          onClick={() => openWhatsApp(order)}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      Rs. {order.pricing.grandTotal.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      {order.payment.transactionId ? (
                        <span className="font-mono font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                          {order.payment.transactionId}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No TID provided</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {order.payment.screenshotUrl ? (
                        <button
                          onClick={() => setZoomImage(order.payment.screenshotUrl!)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">No image</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          order.payment.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : order.payment.status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {order.payment.status === 'confirmed' ? '✓ Verified' : order.payment.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.payment.status === 'pending_verification' && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleVerify(order.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm active:scale-95 disabled:opacity-50"
                              title="Approve & confirm order"
                            >
                              Verify
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => setRejectingOrder(order)}
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-xs transition"
                              title="Reject payment"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onOpenOrder(order)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs transition"
                        >
                          Order
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

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-xl w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-sm text-gray-900">Payment Proof Screenshot</span>
              <button onClick={() => setZoomImage(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-100 rounded-xl p-2 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img src={zoomImage} alt="Zoom proof" className="max-h-[65vh] w-auto object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Reject JazzCash Payment</h3>
              <button onClick={() => setRejectingOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Rejecting payment for <strong>Order #{rejectingOrder.orderNumber}</strong> ({rejectingOrder.customer.fullName}).
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                Reason for Rejection
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
              >
                <option value="Transaction ID not reflected in JazzCash account">
                  Transaction ID not reflected in JazzCash account
                </option>
                <option value="Transferred amount does not match order grand total">
                  Transferred amount does not match order grand total
                </option>
                <option value="Payment screenshot is unreadable or blurry">
                  Payment screenshot is unreadable or blurry
                </option>
                <option value="Duplicate transaction ID already used on another order">
                  Duplicate transaction ID already used on another order
                </option>
                <option value="Other">Other Custom Reason</option>
              </select>

              {rejectReason === 'Other' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify custom reason..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl mt-2 text-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
