import React from 'react';
import { Order, StoreSettings } from '../../types';
import { X, Printer, CheckCircle2, ShieldCheck, Phone, MapPin, Truck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Action Header (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-200">Order Invoice & Packing Slip</span>
            <span className="text-xs bg-[#F5B800] text-[#171717] px-2 py-0.5 rounded font-black">
              #{order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-lg text-xs font-bold transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice / Slip</span>
            </button>
            <button
              id="btn-close-invoice"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice-content" className="p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {/* Top Brand & Header */}
          <div className="flex items-start justify-between border-b pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#F5B800] text-[#171717] font-black flex items-center justify-center text-lg shadow-sm">
                  AE
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">AMMI EXPRESS</h2>
                  <p className="text-xs text-gray-500 font-medium">Smart Products. Better Everyday Living.</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                <p>Support Hotline / WhatsApp: <strong>{settings.whatsappNumber || '0308-2494870'}</strong></p>
                <p>Official Online Store: <strong>www.ammiexpress.pk</strong></p>
                <p>Nationwide Delivery Service across Pakistan</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Sales Invoice</span>
              <h3 className="text-lg font-black text-gray-900 mt-0.5">{order.orderNumber}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Date: {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="mt-2 inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase border"
                style={{
                  backgroundColor: order.payment.method === 'jazzcash' ? '#FDF2F8' : '#FEF3C7',
                  color: order.payment.method === 'jazzcash' ? '#9D174D' : '#92400E',
                  borderColor: order.payment.method === 'jazzcash' ? '#FBCFE8' : '#FDE68A'
                }}
              >
                {order.payment.method === 'jazzcash' ? 'JazzCash QR Payment' : 'Cash on Delivery (COD)'}
              </div>
            </div>
          </div>

          {/* Customer & Courier Information Grid */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs">
            <div>
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                Shipping Destination
              </span>
              <p className="text-sm font-bold text-gray-900">{order.customer.fullName}</p>
              <p className="text-gray-700 mt-1 font-medium">{order.customer.address}</p>
              {order.customer.nearbyLandmark && (
                <p className="text-gray-500 italic mt-0.5">Near: {order.customer.nearbyLandmark}</p>
              )}
              <p className="text-gray-900 font-bold mt-1.5">{order.customer.city}, {order.customer.province}</p>
            </div>

            <div className="border-l border-gray-200 pl-6 space-y-2">
              <div>
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  Contact Numbers
                </span>
                <p className="text-gray-900 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Mobile: {order.customer.mobileNumber}</span>
                </p>
                {order.customer.whatsappNumber && (
                  <p className="text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp: {order.customer.whatsappNumber}</span>
                  </p>
                )}
              </div>

              {order.customer.customerNote && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    Customer Instructions
                  </span>
                  <p className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 text-[11px]">
                    "{order.customer.customerNote}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-4 text-center">SKU</th>
                  <th className="py-2.5 px-4 text-center">Variant</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {order.item.productTitle}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-500">
                    {order.item.sku || 'AE-CHOP-01'}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 font-medium">
                    {order.item.variant || 'Standard'}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900">
                    {order.item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    Rs. {order.item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    Rs. {(order.item.unitPrice * order.item.quantity).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations and Payment Details */}
          <div className="grid grid-cols-2 gap-6 items-start mb-6">
            {/* Payment & Verification Note */}
            <div className="bg-gray-50 p-4 rounded-xl border text-xs">
              <span className="font-bold text-gray-700 uppercase text-[10px] block mb-2">
                Payment Verification Notice
              </span>
              {order.payment.method === 'jazzcash' ? (
                <div className="space-y-1 text-emerald-800">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PAID VIA JAZZCASH QR</span>
                  </p>
                  <p className="font-mono text-gray-700">TID: <strong>{order.payment.transactionId || 'Pending Verification'}</strong></p>
                  <p className="text-gray-500 text-[11px]">Courier Rider: Do NOT collect cash. Parcel is prepaid.</p>
                </div>
              ) : (
                <div className="space-y-1 text-amber-900">
                  <p className="font-bold flex items-center gap-1">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>CASH ON DELIVERY (COD)</span>
                  </p>
                  <p className="text-sm font-black text-gray-900 mt-1">
                    Rider to Collect: Rs. {order.pricing.grandTotal.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-[11px]">Exact cash payment required upon doorstep delivery.</p>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="bg-gray-50 p-4 rounded-xl border text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">Rs. {order.pricing.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Nationwide Shipping:</span>
                <span className="font-medium">Rs. {order.pricing.deliveryCharge.toLocaleString()}</span>
              </div>
              {order.pricing.bundleDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Special Discount:</span>
                  <span>- Rs. {order.pricing.bundleDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-[#171717] bg-[#F5B800] px-2 py-0.5 rounded">
                  Rs. {order.pricing.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Guarantee & Return Notice */}
          <div className="border-t pt-4 text-center text-gray-500 text-[11px] space-y-1">
            <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>7-Day Checking and Replacement Guarantee Included</span>
            </div>
            <p>
              Please inspect the parcel upon arrival. If you receive any defective or damaged item, notify our WhatsApp hotline at {settings.whatsappNumber || '0308-2494870'} within 7 days.
            </p>
            <p className="text-[10px] text-gray-400">Thank you for shopping with Ammi Express Pakistan!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
