import React, { useEffect, useRef } from 'react';
import { Order, StoreSettings } from '../types';
import { CheckCircle2, MessageCircle, Printer, X, ShoppingBag, MapPin, Truck, ShieldCheck } from 'lucide-react';

interface OrderConfirmationProps {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationProps> = ({
  order,
  settings,
  onClose
}) => {
  const purchaseTrackedRef = useRef(false);

  // Meta Pixel Purchase Event - Triggered exclusively on Order Confirmation / Thank You view
  useEffect(() => {
    if (purchaseTrackedRef.current) return;
    purchaseTrackedRef.current = true;

    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      try {
        (window as any).fbq('track', 'Purchase', {
          value: Number(order.pricing?.grandTotal || 0),
          currency: 'PKR',
          content_name: order.item?.productTitle || 'Ammi Express Product',
          content_type: 'product',
          content_ids: [order.item?.productId || order.item?.sku || order.orderNumber],
          contents: [
            {
              id: order.item?.productId || order.item?.sku || order.orderNumber,
              quantity: order.item?.quantity || 1,
              item_price: order.item?.unitPrice || order.pricing?.grandTotal || 0
            }
          ],
          num_items: order.item?.quantity || 1,
          order_id: order.orderNumber
        });
        console.log(`[Meta Pixel] Purchase event successfully tracked for Order #${order.orderNumber} (PKR ${order.pricing?.grandTotal})`);
      } catch (err) {
        console.warn('[Meta Pixel] Purchase event tracking notice:', err);
      }
    }
  }, [order.id, order.orderNumber, order.pricing?.grandTotal, order.item]);

  // WhatsApp notification link with pre-filled order details
  const cleanNumber = (settings?.whatsappNumber || '03082494870').replace(/[^0-9]/g, '');
  const internationalNumber = cleanNumber.startsWith('0') ? '92' + cleanNumber.slice(1) : (cleanNumber || '923082494870');
  const waMessage = encodeURIComponent(
    `Assalam-o-Alaikum Ammi Express! I have placed order ${order.orderNumber} for ${order.item.productTitle} (${order.item.quantity}x, ${order.item.variant}). Total: Rs. ${order.pricing.grandTotal}. Please confirm my order.`
  );
  const whatsappUrl = `https://wa.me/${internationalNumber}?text=${waMessage}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-black p-1.5 rounded-full hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Header */}
        <div className="text-center pb-4 border-b border-neutral-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-[#F5B800] bg-neutral-900 px-3 py-1 rounded-full">
            Order Received
          </span>
          <h2 className="text-2xl font-black text-[#171717] mt-2">
            Thank You, {order.customer.fullName}!
          </h2>
          <p className="text-sm font-bold text-neutral-600 mt-1">
            Order Reference: <span className="font-mono text-[#171717]">{order.orderNumber}</span>
          </p>
        </div>

        {/* Specific Status Message (COD vs JazzCash) */}
        <div className={`my-4 p-4 rounded-2xl border text-xs sm:text-sm font-medium leading-relaxed ${
          order.payment.method === 'jazzcash'
            ? 'bg-purple-50 border-purple-200 text-purple-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          {order.payment.method === 'jazzcash' ? (
            <div>
              <strong>JazzCash Proof Submitted:</strong> Your payment proof has been submitted. Our team will verify your payment transaction ID before parcel dispatch. Status: <span className="font-bold underline">Pending Verification</span>.
            </div>
          ) : (
            <div>
              <strong>Cash on Delivery:</strong> Your order has been received! Our team will contact you on WhatsApp or phone call for final address confirmation before the courier rider departs.
            </div>
          )}
        </div>

        {/* Order Receipt Details */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Product:</span>
            <span className="font-bold text-[#171717] text-right truncate pl-4">
              {order.item.productTitle}
            </span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Variant / Quantity:</span>
            <span className="font-semibold text-neutral-800">
              {order.item.variant} ({order.item.quantity} Unit{order.item.quantity > 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Payment Method:</span>
            <span className="font-bold uppercase text-neutral-800">
              {order.payment.method === 'jazzcash' ? 'JazzCash QR' : 'Cash On Delivery'}
            </span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Delivery Destination:</span>
            <span className="font-medium text-neutral-800 text-right truncate pl-4">
              {order.customer.city}, {order.customer.province}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-black text-base text-[#171717]">
            <span>Total Payable:</span>
            <span className="text-xl">Rs. {order.pricing.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#16803D] hover:bg-[#126830] text-white py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Confirm on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-neutral-500 hover:text-black"
          >
            Back to Ammi Express Store
          </button>
        </div>

      </div>
    </div>
  );
};
