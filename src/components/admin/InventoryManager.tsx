import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  History,
  TrendingUp,
  RefreshCw,
  X,
  CheckCircle2,
  Boxes,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { Product, InventoryMovement } from '../../types';

interface InventoryManagerProps {
  products: Product[];
  onRefreshAll: () => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onRefreshAll }) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('New warehouse shipment arrived');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    setActionLoading(true);
    try {
      const qtyChange = adjustmentType === 'add' ? Math.abs(adjustmentQty) : -Math.abs(adjustmentQty);
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          quantityChange: qtyChange,
          reason: adjustmentReason
        })
      });

      if (res.ok) {
        await onRefreshAll();
        await fetchInventoryData();
        setAdjustingProduct(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalStock = products.reduce((acc, p) => acc + p.stockCount, 0);
  const lowStockCount = products.filter((p) => p.stockCount <= (p.lowStockThreshold || 10)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock tracking with automatic order deductions and audit trail movements.
          </p>
        </div>

        <button
          onClick={fetchInventoryData}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Units In Stock</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalStock}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Across {products.length} catalog items</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Low Stock Warnings</span>
          <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {lowStockCount}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Below alert threshold</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Stock Movements Logged</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{movements.length}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Recorded warehouse audit events</span>
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Current Product Stock Levels</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod) => {
                const isLow = prod.stockCount <= (prod.lowStockThreshold || 10);
                const isOut = prod.stockCount === 0;

                return (
                  <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{prod.title}</span>
                        {prod.status === 'published' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#F5B800] text-[#171717]">
                            Live
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-600">
                      {prod.sku || 'AE-CHOP-01'}
                    </td>

                    <td className="py-3 px-4 font-bold text-sm">
                      <span className={isOut ? 'text-red-700 font-black' : isLow ? 'text-red-600' : 'text-emerald-700'}>
                        {prod.stockCount} units
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {prod.lowStockThreshold || 10} units
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy Stock'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAdjustingProduct(prod);
                          setAdjustmentQty(20);
                          setAdjustmentType('add');
                          setAdjustmentReason('Warehouse shipment restock');
                        }}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition shadow-sm"
                      >
                        Adjust / Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement History */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900">Inventory Movement Audit Log</h2>
          </div>
          <span className="text-xs text-gray-400">Past stock adjustments & sales deductions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4 text-center">Change</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {new Date(mov.timestamp).toLocaleDateString('en-PK', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>

                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {mov.productTitle}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        mov.type === 'restock'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'order_deduct'
                          ? 'bg-blue-100 text-blue-800'
                          : mov.type === 'return_restock'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {mov.type.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-bold">
                    <span className={mov.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-gray-600">
                    {mov.previousStock} → <strong className="text-gray-900">{mov.newStock}</strong>
                  </td>

                  <td className="py-3 px-4 text-gray-600">
                    {mov.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Adjust Inventory</h3>
                <p className="text-xs text-gray-500">{adjustingProduct.title}</p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Current Stock: <strong>{adjustingProduct.stockCount} units</strong></span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'add'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Restock (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === 'subtract'
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    <span>Deduct (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                >
                  <option value="New warehouse shipment arrived">New warehouse shipment arrived</option>
                  <option value="Physical count correction / Audit adjustment">Physical count correction / Audit adjustment</option>
                  <option value="Damaged units written off">Damaged units written off</option>
                  <option value="Warehouse return restock">Warehouse return restock</option>
                  <option value="Sample / Marketing dispatch">Sample / Marketing dispatch</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
