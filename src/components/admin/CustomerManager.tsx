import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  ShoppingBag,
  DollarSign,
  MapPin,
  Calendar,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Award,
  X
} from 'lucide-react';
import { Customer, Order } from '../../types';

interface CustomerManagerProps {
  onOpenOrder: (order: Order) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ onOpenOrder }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.mobileNumber.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;

  const openWhatsApp = (c: Customer) => {
    let clean = (c.whatsappNumber || c.mobileNumber).replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.substring(1);
    const msg = encodeURIComponent(`Assalam-o-Alaikum ${c.fullName},\n\nGreetings from Ammi Express! How can we assist you today?`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Customer Database</h1>
          <p className="text-xs text-gray-500 mt-1">
            Pakistani customer profiles, order histories, addresses, and lifetime values.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Unique Customers</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{customers.length}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Registered in Pakistan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Repeat Buyers</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{repeatCustomers}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Placed &gt; 1 order</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customer LTV</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">Rs. {totalSpent.toLocaleString()}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Cumulative gross spend</span>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">City / Region</th>
                <th className="py-3 px-4 text-center">Orders Placed</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No customer records match your query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-amber-50/30 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{c.fullName}</span>
                        {c.orderCount > 1 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black">
                            <Award className="w-2.5 h-2.5 text-amber-600" />
                            VIP Repeat
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-700">
                      {c.mobileNumber}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {c.city}, {c.province}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                      {c.orderCount}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      Rs. {c.totalSpent.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {new Date(c.lastOrderDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openWhatsApp(c)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          title="View Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">{selectedCustomer.fullName}</h3>
                <span className="text-xs text-gray-500 font-mono">{selectedCustomer.mobileNumber}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Orders</span>
                <span className="text-lg font-black text-gray-900">{selectedCustomer.orderCount}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Lifetime Value (LTV)</span>
                <span className="text-lg font-black text-emerald-700">Rs. {selectedCustomer.totalSpent.toLocaleString()}</span>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Saved Delivery Address</span>
                <p className="text-gray-800 font-medium mt-0.5">{selectedCustomer.address}</p>
                <p className="text-gray-600 font-bold mt-0.5">{selectedCustomer.city}, {selectedCustomer.province}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => openWhatsApp(selectedCustomer)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
