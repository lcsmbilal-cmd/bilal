import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Printer,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  DollarSign,
  QrCode,
  Calendar,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react';
import { Order, StoreSettings } from '../../types';
import { InvoiceModal } from './InvoiceModal';
import { adminFetch } from '../../utils/adminApi';
import { deleteOrderFromFirestore, deleteAllOrdersFromFirestore } from '../../firebaseClient';

interface OrderManagerProps {
  orders: Order[];
  settings: StoreSettings;
  onRefreshOrders: () => Promise<void>;
  selectedOrder?: Order | null;
  onCloseDetail?: () => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders,
  settings,
  onRefreshOrders,
  selectedOrder: initialSelectedOrder,
  onCloseDetail
}) => {
  // Synchronized local orders state
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(initialSelectedOrder || null);
  const [showInvoice, setShowInvoice] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  // Delete & Error Feedback States
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [feedbackAlert, setFeedbackAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Keep local state in sync when parent orders change
  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Auto-dismiss feedback alert after 6 seconds
  React.useEffect(() => {
    if (feedbackAlert) {
      const timer = setTimeout(() => {
        setFeedbackAlert(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [feedbackAlert]);

  // Extract unique cities from local orders for filter dropdown
  const uniqueCities = Array.from(new Set(localOrders.map((o) => o.customer.city).filter(Boolean)));

  const filteredOrders = localOrders.filter((order) => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterPayment !== 'all' && order.payment.method !== filterPayment) return false;
    if (filterCity !== 'all' && order.customer.city.toLowerCase() !== filterCity.toLowerCase()) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customer.fullName.toLowerCase().includes(q) ||
        order.customer.mobileNumber.includes(q) ||
        (order.payment.transactionId && order.payment.transactionId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (orderId: string, newStatus: Order['status'], note?: string) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: note || `Status manually changed to ${newStatus}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder(data.order);
        }
        await onRefreshOrders();
        setStatusUpdateNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (orderId: string) => {
    if (!newNote.trim()) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder(data.order);
        }
        setNewNote('');
        await onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 1. Firestore Real Delete:
   * Permanently removes the order document from Cloud Firestore.
   * Awaits completion and only updates local state after verified removal.
   */
  const handleDeleteOrder = async (orderId: string, orderNumber?: string) => {
    setActionLoading(true);
    try {
      console.log(`[Firestore Real Delete] Permanently removing order ${orderId} from Firestore...`);

      // 1. Direct Cloud Firestore deleteDoc removal
      await deleteOrderFromFirestore(orderId);

      // 2. Synchronize with backend API
      try {
        await adminFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      } catch (backendErr) {
        console.warn('Backend sync delete note:', backendErr);
      }

      // 3. Update local state ONLY after successful database removal
      setLocalOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (activeOrder && activeOrder.id === orderId) {
        setActiveOrder(null);
      }

      // 4. Re-sync live orders
      await onRefreshOrders();

      setOrderToDelete(null);
      setFeedbackAlert({
        type: 'success',
        message: `Order #${orderNumber || orderId} has been permanently deleted from Cloud Firestore database.`
      });
    } catch (err: any) {
      console.error('[Firestore Real Delete Error]:', err);
      setFeedbackAlert({
        type: 'error',
        message: `Failed to delete order from Cloud Firestore: ${err?.message || 'Permission denied or network failure.'}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 2. Bulk Delete / Clear All Fake Orders:
   * Uses Cloud Firestore batched writes to permanently delete all orders from the collection.
   */
  const handleDeleteAllOrders = async () => {
    setActionLoading(true);
    try {
      console.log(`[Firestore Bulk Delete] Initiating batch removal of all ${localOrders.length} orders from Cloud Firestore...`);

      // 1. Batch delete all orders directly from Firestore
      const result = await deleteAllOrdersFromFirestore();

      // 2. Synchronize with backend database
      try {
        await adminFetch('/api/orders', { method: 'DELETE' });
      } catch (backendErr) {
        console.warn('Backend bulk delete sync note:', backendErr);
      }

      // 3. Update local state ONLY after successful database removal
      setLocalOrders([]);
      setActiveOrder(null);
      await onRefreshOrders();

      setShowDeleteAllModal(false);
      setFeedbackAlert({
        type: 'success',
        message: `Successfully cleared all ${result.count} orders permanently from Cloud Firestore!`
      });
    } catch (err: any) {
      console.error('[Firestore Bulk Delete Error]:', err);
      setFeedbackAlert({
        type: 'error',
        message: `Failed to clear orders from Cloud Firestore: ${err?.message || 'Database deletion error.'}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openWhatsApp = (order: Order) => {
    const raw = order.customer.whatsappNumber || order.customer.mobileNumber;
    let cleanPhone = raw.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const message = encodeURIComponent(
      `Assalam-o-Alaikum ${order.customer.fullName},\n\nThis is regarding your Ammi Express order #${order.orderNumber} for "${order.item.productTitle}".\nStatus: ${order.status.toUpperCase()}\nGrand Total: Rs. ${order.pricing.grandTotal.toLocaleString()}\n\nThank you for choosing Ammi Express!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert Banner */}
      {feedbackAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-sm transition animate-fadeIn ${
            feedbackAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackAlert.message}</span>
          </div>
          <button
            onClick={() => setFeedbackAlert(null)}
            className="p-1.5 hover:bg-black/5 rounded-lg text-gray-500 hover:text-gray-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Order Management Hub</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track customer orders, confirm dispatch, print invoices, and manage payment verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} Found
          </div>

          {/* Dedicated Bulk Delete Button for Admin */}
          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={localOrders.length === 0 || actionLoading}
            className="px-3.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-bold flex items-center gap-1.5 transition text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Permanently delete all orders from Cloud Firestore"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Orders</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'new', label: 'New' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'dispatched', label: 'Dispatched' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
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

        {/* Secondary Filter dropdowns and search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
          <div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, name, phone..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#F5B800]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="jazzcash">JazzCash QR Payment</option>
            </select>
          </div>

          <div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Cities ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Order # & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Ordered Product</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    No orders match your selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    className="hover:bg-amber-50/40 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 block">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-PK', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{order.customer.fullName}</span>
                      <span className="text-gray-500 text-[11px] font-mono">{order.customer.mobileNumber}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800 block">{order.customer.city}</span>
                      <span className="text-gray-400 text-[10px] line-clamp-1">{order.customer.address}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-semibold text-gray-900 line-clamp-1">
                        {order.item.productTitle}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        Qty: <strong>{order.item.quantity}</strong> | Variant: {order.item.variant || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      Rs. {order.pricing.grandTotal.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.payment.method === 'jazzcash'
                              ? 'bg-pink-100 text-pink-800 border border-pink-200'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.payment.method === 'jazzcash' ? 'JazzCash QR' : 'COD'}
                        </span>
                        {order.payment.method === 'jazzcash' && (
                          <span className={`block text-[9px] font-semibold ${order.payment.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {order.payment.status === 'confirmed' ? '✓ Verified' : '● Verification Pending'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          order.status === 'new'
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : order.status === 'dispatched'
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            : 'bg-red-100 text-red-900 border-red-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openWhatsApp(order)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Contact Customer via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setShowInvoice(order)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Print Invoice / Packing Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setActiveOrder(order)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Delete Order Permanently from Firestore"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Order Detail Drawer / Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft text-xs">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">Order #{activeOrder.orderNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    activeOrder.status === 'new' ? 'bg-amber-400 text-[#171717]' :
                    activeOrder.status === 'confirmed' ? 'bg-blue-400 text-[#171717]' :
                    activeOrder.status === 'dispatched' ? 'bg-purple-400 text-white' :
                    activeOrder.status === 'delivered' ? 'bg-emerald-400 text-[#171717]' :
                    'bg-red-400 text-white'
                  }`}
                >
                  {activeOrder.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInvoice(activeOrder)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => {
                    setActiveOrder(null);
                    if (onCloseDetail) onCloseDetail();
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Status Bar */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Update Order Status
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['new', 'confirmed', 'dispatched', 'delivered', 'cancelled'] as Order['status'][]).map((st) => (
                    <button
                      key={st}
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(activeOrder.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                        activeOrder.status === st
                          ? 'bg-[#F5B800] text-[#171717] shadow font-black'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 uppercase text-[10px]">Customer & Delivery Details</span>
                  <button
                    onClick={() => openWhatsApp(activeOrder)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-gray-400 text-[10px] block">Customer Name</span>
                    <span className="font-bold text-gray-900 text-sm">{activeOrder.customer.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Mobile / WhatsApp</span>
                    <span className="font-bold text-gray-900 font-mono text-sm">{activeOrder.customer.mobileNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 text-[10px] block">Delivery Address</span>
                    <span className="font-medium text-gray-800">{activeOrder.customer.address}</span>
                    {activeOrder.customer.nearbyLandmark && (
                      <span className="text-gray-500 italic block mt-0.5">Near: {activeOrder.customer.nearbyLandmark}</span>
                    )}
                    <span className="text-gray-900 font-bold block mt-1">{activeOrder.customer.city}, {activeOrder.customer.province}</span>
                  </div>
                  {activeOrder.customer.customerNote && (
                    <div className="col-span-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                      <span className="font-bold block text-[10px] uppercase">Special Instructions from Customer:</span>
                      <p className="mt-0.5 italic">"{activeOrder.customer.customerNote}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Item Snapshot */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-700 uppercase text-[10px] block">
                  Product Item Ordered
                </span>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{activeOrder.item.productTitle}</h3>
                    <div className="text-gray-500 text-xs mt-0.5 space-x-3">
                      <span>SKU: <strong className="font-mono text-gray-800">{activeOrder.item.sku || 'AE-CHOP-01'}</strong></span>
                      <span>Variant: <strong className="text-gray-800">{activeOrder.item.variant || 'Standard'}</strong></span>
                      <span>Qty: <strong className="text-gray-900">{activeOrder.item.quantity}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm">
                      Rs. {(activeOrder.item.unitPrice * activeOrder.item.quantity).toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-[10px] block">
                      (Rs. {activeOrder.item.unitPrice.toLocaleString()} each)
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>Rs. {activeOrder.pricing.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Nationwide Delivery:</span>
                    <span>Rs. {activeOrder.pricing.deliveryCharge.toLocaleString()}</span>
                  </div>
                  {activeOrder.pricing.bundleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>- Rs. {activeOrder.pricing.bundleDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t">
                    <span>Grand Total:</span>
                    <span className="text-[#171717] bg-[#F5B800] px-2 py-0.5 rounded">
                      Rs. {activeOrder.pricing.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-700 uppercase text-[10px] block">Payment Information</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900">
                      {activeOrder.payment.method === 'jazzcash' ? 'JazzCash QR Payment' : 'Cash on Delivery (COD)'}
                    </span>
                    {activeOrder.payment.transactionId && (
                      <span className="block font-mono text-xs text-gray-600 mt-0.5">
                        Transaction ID: <strong>{activeOrder.payment.transactionId}</strong>
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      activeOrder.payment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      activeOrder.payment.status === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {activeOrder.payment.status.toUpperCase()}
                  </span>
                </div>

                {activeOrder.payment.screenshotUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 text-[10px] block mb-1">Attached Payment Proof:</span>
                    <img
                      src={activeOrder.payment.screenshotUrl}
                      alt="Payment proof"
                      className="w-48 h-48 rounded-xl object-contain border bg-white p-2"
                    />
                  </div>
                )}
              </div>

              {/* Order Status History Timeline */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-700 uppercase text-[10px] block">Order Audit Log & History</span>
                <div className="space-y-3">
                  {activeOrder.history?.map((h) => (
                    <div key={h.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#F5B800] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 uppercase text-[11px]">{h.status}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.timestamp).toLocaleDateString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5">{h.note}</p>
                        <span className="text-[10px] text-gray-400 block font-semibold">By: {h.author}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Internal Note */}
                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add internal order note..."
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                  <button
                    disabled={actionLoading || !newNote.trim()}
                    onClick={() => handleAddNote(activeOrder.id)}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(activeOrder)}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Order Delete Confirmation Modal (Red Warning) */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-xs">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Delete Order #{orderToDelete.orderNumber}?</h3>
                <p className="text-red-600 font-bold">Cloud Firestore Permanent Removal</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete order <strong className="text-gray-900">#{orderToDelete.orderNumber}</strong> for <strong className="text-gray-900">{orderToDelete.customer.fullName}</strong> ({orderToDelete.customer.city}) with Grand Total of <strong className="text-gray-900">Rs. {orderToDelete.pricing?.grandTotal?.toLocaleString()}</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-[11px] text-red-900">
              ⚠️ This operation calls <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-red-200">deleteDoc(doc(db, &apos;orders&apos;, id))</code> directly on Cloud Firestore and cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteOrder(orderToDelete.id, orderToDelete.orderNumber)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Deleting from Firestore...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete / Clear All Orders Confirmation Modal (Clear Red Warning) */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-300 text-xs">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Clear All {localOrders.length} Orders?</h3>
                <p className="text-red-600 font-bold">Irreversible Database Action</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              You are about to delete <strong>all {localOrders.length} existing orders</strong> directly from the <strong>Cloud Firestore</strong> database.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 space-y-1.5 text-[11px] text-red-900">
              <div className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanent Deletion Warning:</span>
              </div>
              <p className="text-red-800">
                • Executes an atomic Firestore <code className="bg-white px-1 py-0.2 rounded font-mono text-[10px] border border-red-200">writeBatch</code> across the <code className="bg-white px-1 py-0.2 rounded font-mono text-[10px] border border-red-200">orders</code> collection.
              </p>
              <p className="text-red-800">
                • Clears all customer addresses, test orders, and order histories permanently.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteAllOrders}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Clearing Firestore...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete All Orders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          order={showInvoice}
          settings={settings}
          onClose={() => setShowInvoice(null)}
        />
      )}
    </div>
  );
};
