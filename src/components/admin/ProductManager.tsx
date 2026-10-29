import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image,
  Upload,
  Layers,
  Sparkles,
  Zap,
  List,
  Tag,
  DollarSign,
  Boxes,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  X,
  Save,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Star,
  SlidersHorizontal,
  Heart,
  ShieldCheck,
  Droplets,
  BatteryCharging,
  Flame,
  Clock,
  Award,
  Truck,
  ThumbsUp,
  Video,
  Play
} from 'lucide-react';
import { Product, BenefitItem, FeatureItem, SpecificationItem, ProductVariant, ProductBenefitsSection } from '../../types';
import { adminFetch } from '../../utils/adminApi';

interface ProductManagerProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
  onProductPublished: (product: Product) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onRefreshProducts,
  onProductPublished
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<'basics' | 'pricing' | 'images' | 'benefits' | 'specs' | 'variants'>('basics');
  const [publishModalProduct, setPublishModalProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [permanentDeleteConfirmProduct, setPermanentDeleteConfirmProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const countAll = products.filter((p) => p.status !== 'trash').length;
  const countPublished = products.filter((p) => p.status === 'published').length;
  const countDraft = products.filter((p) => p.status === 'draft').length;
  const countArchived = products.filter((p) => p.status === 'archived').length;
  const countTrash = products.filter((p) => p.status === 'trash').length;

  const filteredProducts = products.filter((p) => {
    if (filterStatus === 'all') {
      if (p.status === 'trash') return false;
    } else if (p.status !== filterStatus) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    }
    return true;
  });

  const handlePublishClick = (prod: Product) => {
    setPublishModalProduct(prod);
  };

  const confirmPublish = async () => {
    if (!publishModalProduct) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${publishModalProduct.id}/publish`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');

      showNotification('success', `"${publishModalProduct.title}" published to live storefront catalog!`);
      if (onProductPublished) onProductPublished(data.publishedProduct);
      await onRefreshProducts();
      setPublishModalProduct(null);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetHero = async (prod: Product) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${prod.id}/set-hero`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set as hero product');
      showNotification('success', `"${prod.title}" is now the Featured / Hero Product!`);
      if (onProductPublished) onProductPublished(data.heroProduct);
      await onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${id}/unpublish`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Product unpublished to Draft');
        await onRefreshProducts();
      }
    } catch (err) {
      showNotification('error', 'Failed to unpublish product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${id}/archive`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Product archived successfully');
        await onRefreshProducts();
      }
    } catch (err) {
      showNotification('error', 'Failed to archive');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Product restored to Draft successfully!');
        await onRefreshProducts();
      }
    } catch (err) {
      showNotification('error', 'Failed to restore product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Product duplicated as draft');
        await onRefreshProducts();
      }
    } catch (err) {
      showNotification('error', 'Failed to duplicate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!deleteConfirmProduct) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${deleteConfirmProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to move product to trash');
      }
      showNotification('success', `"${deleteConfirmProduct.title}" moved to Trash. It is now hidden from customer storefront.`);
      setDeleteConfirmProduct(null);
      await onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteConfirmProduct) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/products/${permanentDeleteConfirmProduct.id}?permanent=true`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to permanently delete product');
      }
      showNotification('success', `"${permanentDeleteConfirmProduct.title}" permanently erased from database.`);
      setPermanentDeleteConfirmProduct(null);
      await onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProduct = async (productData: Product) => {
    setActionLoading(true);
    try {
      const isNew = isCreating;
      const url = isNew ? '/api/products' : `/api/products/${productData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      showNotification('success', isNew ? 'Product created successfully!' : 'Product updated successfully!');
      setEditingProduct(null);
      setIsCreating(false);
      await onRefreshProducts();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startCreate = () => {
    const newProd: Product = {
      id: '',
      title: '',
      slug: '',
      sku: `AE-${Math.floor(1000 + Math.random() * 9000)}`,
      headline: 'Smart Products. Better Everyday Living.',
      badge: '🔥 New Arrival in Pakistan',
      rating: 5.0,
      reviewCount: 0,
      shortDescription: '',
      regularPrice: 2850,
      salePrice: 1699,
      costPrice: 850,
      currency: 'Rs.',
      stockCount: 50,
      lowStockThreshold: 10,
      status: 'draft',
      images: [
        'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1000&q=85'
      ],
      benefitsSection: {
        eyebrow: 'ENGINEERED FOR DAILY USE',
        heading: 'Why Every Pakistani Kitchen Needs This',
        description: 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.'
      },
      benefits: [
        { id: 'b1', icon: 'Zap', title: 'Ultra-Fast Performance', description: 'Engineered for rapid everyday kitchen efficiency.' },
        { id: 'b2', icon: 'BatteryCharging', title: 'Long Battery Life', description: 'Rechargeable USB lithium battery.' }
      ],
      features: [
        { id: 'f1', icon: 'Cpu', title: 'High-Power Motor', description: 'Pure copper winding for prolonged heavy-duty longevity.', highlight: true }
      ],
      detailedDescription: {
        intro: '',
        bulletPoints: ['High durability', 'Easy to clean', 'Premium Pakistani household essential'],
        highlightBox: '⭐ 100% Genuine Quality Guarantee by Ammi Express',
        sections: []
      },
      howItWorks: [],
      specifications: [
        { label: 'Warranty', value: '7-Day Check & Replacement Guarantee' },
        { label: 'Packaging', value: 'Reinforced Box with USB Cable & Manual' }
      ],
      variants: [
        { id: 'v1', name: 'Standard Edition', inStock: true }
      ]
    };
    setEditingProduct(newProd);
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-red-900 text-red-100 border border-red-700'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Product Catalog & Storefront Publisher</h1>
          <p className="text-xs text-gray-500 mt-1">
            Single-product store model: Publish any item to switch your live storefront immediately.
          </p>
        </div>

        <button
          id="btn-add-new-product"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Products', count: countAll },
            { id: 'published', label: 'Live Storefront', count: countPublished },
            { id: 'draft', label: 'Drafts', count: countDraft },
            { id: 'archived', label: 'Archived', count: countArchived },
            { id: 'trash', label: 'Trash', count: countTrash, isTrash: true }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === tab.id
                  ? tab.isTrash
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-gray-900 text-white shadow'
                  : tab.isTrash && tab.count > 0
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.isTrash && <Trash2 className="w-3 h-3" />}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filterStatus === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.isTrash && tab.count > 0
                    ? 'bg-red-200/60 text-red-700 font-black'
                    : 'bg-gray-200/80 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {filterStatus === 'trash' ? (
                        <>
                          <Trash2 className="w-8 h-8 text-gray-300" />
                          <p className="font-bold text-sm text-gray-700">Trash is empty</p>
                          <p className="text-xs text-gray-400">Products moved to trash will appear here.</p>
                        </>
                      ) : (
                        <>
                          <Package className="w-8 h-8 text-gray-300" />
                          <p className="font-bold text-sm text-gray-700">No products found</p>
                          <p className="text-xs text-gray-400">Try changing your search query or filter tab.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isPublished = prod.status === 'published';
                  const isTrash = prod.status === 'trash';
                  const isLow = prod.stockCount <= (prod.lowStockThreshold || 10);

                  return (
                    <tr
                      key={prod.id}
                      className={
                        isTrash
                          ? 'bg-red-50/30 hover:bg-red-50/60 transition'
                          : isPublished
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 transition'
                          : 'hover:bg-gray-50/80 transition'
                      }
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=150&q=80'}
                            alt={prod.title}
                            className={`w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-white ${
                              isTrash ? 'grayscale opacity-75' : ''
                            }`}
                          />
                          <div className="max-w-md">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 line-clamp-1">{prod.title}</span>
                              {prod.isFeatured && (
                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-amber-950 shadow-xs">
                                  <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
                                  Hero Product
                                </span>
                              )}
                              {isPublished && !prod.isFeatured && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#F5B800] text-[#171717]">
                                  Live Store
                                </span>
                              )}
                              {isTrash && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700">
                                  In Trash
                                </span>
                              )}
                              {(prod.productVideoLink || prod.videoUrl) && (
                                <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                  <Video className="w-2.5 h-2.5 text-indigo-600" />
                                  Video
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">{prod.shortDescription}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{prod.category || 'General'}</span>
                              <span className="text-gray-300">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setEditorInitialTab('benefits');
                                  setIsCreating(false);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="Manage Product Benefits / Key Features"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{(prod.benefits || []).length} Key Benefits</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-gray-600 font-semibold">
                        {prod.sku || 'AE-01'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block">Rs. {prod.salePrice?.toLocaleString()}</span>
                        {prod.regularPrice > prod.salePrice && (
                          <span className="text-gray-400 line-through text-[11px]">Rs. {prod.regularPrice?.toLocaleString()}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                          {prod.stockCount} in stock
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-red-500 font-semibold">Low Stock</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isTrash
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : prod.status === 'archived'
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPublished ? '● Published' : isTrash ? '🗑️ In Trash' : prod.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isTrash ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRestore(prod.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
                              title="Restore to Draft"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => setPermanentDeleteConfirmProduct(prod)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
                              title="Delete Permanently from Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* If Published & Not Hero: Option to Set as Hero */}
                            {isPublished && !prod.isFeatured && (
                              <button
                                onClick={() => handleSetHero(prod)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-xs transition shadow-xs cursor-pointer"
                                title="Set this product as the Hero / Featured Product"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span>Set as Hero</span>
                              </button>
                            )}

                            {!isPublished && prod.status !== 'archived' && (
                              <button
                                id={`btn-publish-${prod.id}`}
                                onClick={() => handlePublishClick(prod)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-lg font-bold text-xs transition shadow-sm cursor-pointer"
                                title="Publish to public storefront catalog"
                              >
                                Publish Live
                              </button>
                            )}

                            {isPublished && (
                              <button
                                onClick={() => handleUnpublish(prod.id)}
                                disabled={actionLoading}
                                className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                                title="Unpublish to Draft"
                              >
                                Unpublish
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsCreating(false);
                              }}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDuplicate(prod.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                              title="Duplicate Product"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {prod.status !== 'archived' ? (
                              !isPublished && (
                                <button
                                  onClick={() => handleArchive(prod.id)}
                                  disabled={actionLoading}
                                  className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Archive Product"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleRestore(prod.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Restore to Draft"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Move to Trash - allowed for all products */}
                            <button
                              onClick={() => setDeleteConfirmProduct(prod)}
                              disabled={actionLoading}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {publishModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#F5B800]" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Publish Product to Storefront?</h3>
              <p className="text-xs text-gray-600 mt-2">
                You are about to publish <strong>"{publishModalProduct.title}"</strong> to the live customer store.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>What will happen:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                <li>This product will become <strong>Live</strong> in your storefront Product Catalog.</li>
                <li>Customers can browse, view details, and place Cash on Delivery orders.</li>
                <li>You can feature it in the top Hero section or unpublish it anytime.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalProduct(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-publish-action"
                type="button"
                onClick={confirmPublish}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Publishing...' : 'Yes, Make Live on Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Move Product to Trash?</h3>
              <p className="text-xs text-gray-600 mt-2">
                Are you sure you want to move <strong>"{deleteConfirmProduct.title}"</strong> to the trash?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 text-left mt-3">
                <p className="font-bold">What happens next:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-900/80">
                  <li>Immediately removed from your live customer storefront</li>
                  <li>All prices, stock, specs, and details are safely preserved in the Trash</li>
                  <li>You can restore it anytime with one click from the <strong>Trash</strong> tab</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveToTrash}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Moving...' : 'Move to Trash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {permanentDeleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Permanently Delete Forever</h3>
              <p className="text-xs text-gray-600 mt-2">
                Are you sure you want to permanently erase <strong>"{permanentDeleteConfirmProduct.title}"</strong> from the database?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[11px] text-red-800 text-left mt-3">
                <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                <p className="mt-1 text-red-700">
                  This product will be permanently wiped from the database and cannot be restored.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPermanentDeleteConfirmProduct(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Deleting...' : 'Delete Forever'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Product Editor Modal */}
      {editingProduct && (
        <ProductEditorModal
          product={editingProduct}
          isNew={isCreating}
          initialTab={editorInitialTab}
          onClose={() => {
            setEditingProduct(null);
            setIsCreating(false);
            setEditorInitialTab('basics');
          }}
          onSave={handleSaveProduct}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

interface ProductEditorModalProps {
  product: Product;
  isNew: boolean;
  initialTab?: 'basics' | 'pricing' | 'images' | 'benefits' | 'specs' | 'variants';
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  loading: boolean;
}

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  isNew,
  initialTab = 'basics',
  onClose,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState<Product>(() => {
    const rawBenefits = Array.isArray(product.benefits) ? product.benefits : [];
    const normalizedBenefits: BenefitItem[] = rawBenefits.map((b, idx) => {
      const text = (b.text || b.title || '').trim();
      return {
        id: b.id || `ben-${Date.now()}-${idx}`,
        productId: b.productId || product.id,
        text: text,
        title: b.title || text,
        description: b.description || '',
        icon: b.icon || 'CheckCircle2',
        enabled: b.enabled !== false,
        displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : (idx + 1),
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString()
      };
    }).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const initialBenefitsSection = {
      eyebrow: product.benefitsSection?.eyebrow !== undefined
        ? product.benefitsSection.eyebrow
        : (product.id === 'prod-ammi-01' ? 'ENGINEERED FOR DAILY USE' : (product.badge || 'ENGINEERED FOR DAILY USE')),
      heading: product.benefitsSection?.heading !== undefined
        ? product.benefitsSection.heading
        : (product.id === 'prod-ammi-01' ? 'Why Every Pakistani Kitchen Needs This' : (product.headline || 'Why Every Household Needs This')),
      description: product.benefitsSection?.description !== undefined
        ? product.benefitsSection.description
        : (product.id === 'prod-ammi-01' ? 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.' : (product.shortDescription || 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.'))
    };

    return {
      ...product,
      benefitsSection: initialBenefitsSection,
      benefits: normalizedBenefits
    };
  });
  const [activeSubTab, setActiveSubTab] = useState<'basics' | 'pricing' | 'images' | 'benefits' | 'specs' | 'variants'>(initialTab);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [editorNotification, setEditorNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setEditorNotification({ type, message });
    setTimeout(() => setEditorNotification(null), 4000);
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.warn('Failed to load categories in product editor:', err));
  }, []);

  const handleFieldChange = (field: keyof Product, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const addImage = () => {
    if (!newImageUrl) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  const removeImage = async (index: number) => {
    const targetImg = formData.images[index];
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    if (targetImg && targetImg.startsWith('/uploads/')) {
      const filename = targetImg.replace('/uploads/', '');
      try {
        await adminFetch(`/api/images/${filename}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete image on server:', err);
      }
    }
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.images.length) return;
    const next = [...formData.images];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, images: next }));
  };

  const makePrimaryImage = (index: number) => {
    if (index === 0) return;
    const next = [...formData.images];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    setFormData((prev) => ({ ...prev, images: next }));
  };

  // Client-side image compression for fast uploads and permanent storage
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImageUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedDataUrl = await compressImageFile(file);
        if (!compressedDataUrl) continue;

        const res = await adminFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: compressedDataUrl,
            filename: file.name.replace(/\.[^/.]+$/, ''),
            category: 'products'
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.url]
          }));
          showNotification('success', `Image "${file.name}" uploaded and saved permanently.`);
        } else {
          showNotification('error', data.error || `Failed to upload image "${file.name}"`);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setImageUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // --- Dedicated Product Benefits Handlers ---
  const handleAddBenefit = (presetText?: string) => {
    const current = formData.benefits || [];
    const text = presetText || '';
    const newBen: BenefitItem = {
      id: `ben-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      productId: formData.id,
      text: text,
      title: text,
      description: '',
      icon: 'CheckCircle2',
      enabled: true,
      displayOrder: current.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setFormData((prev) => ({
      ...prev,
      benefits: [...(prev.benefits || []), newBen]
    }));
  };

  const handleUpdateBenefitText = (index: number, val: string) => {
    setFormData((prev) => {
      const next = [...(prev.benefits || [])];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        text: val,
        title: val,
        updatedAt: new Date().toISOString()
      };
      return { ...prev, benefits: next };
    });
  };

  const handleUpdateBenefitDesc = (index: number, val: string) => {
    setFormData((prev) => {
      const next = [...(prev.benefits || [])];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        description: val,
        updatedAt: new Date().toISOString()
      };
      return { ...prev, benefits: next };
    });
  };

  const handleToggleBenefitEnabled = (index: number) => {
    setFormData((prev) => {
      const next = [...(prev.benefits || [])];
      if (!next[index]) return prev;
      const curEnabled = next[index].enabled !== false;
      next[index] = {
        ...next[index],
        enabled: !curEnabled,
        updatedAt: new Date().toISOString()
      };
      return { ...prev, benefits: next };
    });
  };

  const handleDeleteBenefit = (index: number) => {
    setFormData((prev) => {
      const filtered = (prev.benefits || []).filter((_, idx) => idx !== index);
      const reindexed = filtered.map((b, i) => ({
        ...b,
        displayOrder: i + 1
      }));
      return { ...prev, benefits: reindexed };
    });
  };

  const handleMoveBenefit = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const list = [...(prev.benefits || [])];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      const reindexed = list.map((b, i) => ({
        ...b,
        displayOrder: i + 1
      }));
      return { ...prev, benefits: reindexed };
    });
  };

  const handleBenefitsSectionChange = (field: keyof ProductBenefitsSection, val: string) => {
    setFormData((prev) => ({
      ...prev,
      benefitsSection: {
        ...(prev.benefitsSection || {}),
        [field]: val
      }
    }));
  };

  const handleUpdateBenefitIcon = (index: number, val: string) => {
    setFormData((prev) => {
      const next = [...(prev.benefits || [])];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        icon: val,
        updatedAt: new Date().toISOString()
      };
      return { ...prev, benefits: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Product title is required.');
      return;
    }
    const cleanedBenefits = (formData.benefits || []).map((b, idx) => ({
      ...b,
      productId: formData.id,
      text: (b.text || b.title || '').trim(),
      title: (b.title || b.text || '').trim(),
      displayOrder: idx + 1,
      enabled: b.enabled !== false
    }));

    onSave({
      ...formData,
      benefitsSection: formData.benefitsSection,
      benefits: cleanedBenefits
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#F5B800]" />
            <h2 className="font-bold text-sm">
              {isNew ? 'Create New E-Commerce Product' : `Edit Product: ${formData.title}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto text-xs font-bold uppercase tracking-wider text-gray-500">
          {[
            { id: 'basics', label: 'Basic Info' },
            { id: 'pricing', label: 'Pricing & Stock' },
            { id: 'images', label: 'Images Gallery', count: formData.images?.length },
            {
              id: 'benefits',
              label: 'Product Benefits / Key Features',
              badge: `${(formData.benefits || []).filter((b) => b.enabled !== false).length}/${(formData.benefits || []).length}`
            },
            {
              id: 'specs',
              label: 'Specifications Table',
              badge: `${(formData.specifications || []).length}`
            },
            { id: 'variants', label: 'Color Variants', count: formData.variants?.length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === tab.id || (tab.id === 'benefits' && (activeSubTab as any) === 'features')
                  ? 'border-[#F5B800] text-gray-900 bg-white shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSubTab === tab.id || (tab.id === 'benefits' && (activeSubTab as any) === 'features')
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeSubTab === 'basics' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Ammi Express Smart Wireless Chopper"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => handleFieldChange('sku', e.target.value)}
                    placeholder="AE-CHOP-01"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Storefront Headline / Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => handleFieldChange('headline', e.target.value)}
                    placeholder="Smart Products. Better Everyday Living."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Product Category
                  </label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                        category: selectedCat ? selectedCat.name : prev.category
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F5B800]"
                  >
                    <option value="">-- Uncategorized / General --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Badge Tag (shown in hero header)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => handleFieldChange('badge', e.target.value)}
                    placeholder="🔥 2025 Bestseller in Pakistan"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Description (Key Hook)
                </label>
                <textarea
                  rows={3}
                  value={formData.shortDescription}
                  onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
                  placeholder="Summarize the product key selling benefit..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sale Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.salePrice}
                    onChange={(e) => handleFieldChange('salePrice', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-emerald-700"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Customer checkout price</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Original Price (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.regularPrice}
                    onChange={(e) => handleFieldChange('regularPrice', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs line-through text-gray-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Shown crossed out</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Cost of Goods (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.costPrice || 0}
                    onChange={(e) => handleFieldChange('costPrice', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-700"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">For net profit tracking</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Available Stock Count *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stockCount}
                    onChange={(e) => handleFieldChange('stockCount', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Units available for sale</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.lowStockThreshold || 10}
                    onChange={(e) => handleFieldChange('lowStockThreshold', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Trigger warning badge when stock drops below this</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'images' && (
            <div className="space-y-4">
              {/* Product Video Link (Optional) */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-600" />
                    <span>Product Video Link</span>
                  </label>
                  {(formData.productVideoLink || formData.videoUrl) && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Active Video Configured
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://files.catbox.moe/example.mp4 or https://youtube.com/watch?v=..."
                  value={formData.productVideoLink || formData.videoUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFieldChange('productVideoLink', val);
                    handleFieldChange('videoUrl', val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-indigo-400 font-mono shadow-xs"
                />
                <p className="text-[11px] text-gray-600">
                  Paste direct MP4 link (e.g. Catbox/Streamable) or YouTube URL.
                </p>
                {(formData.productVideoLink || formData.videoUrl) && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                      {(formData.productVideoLink || formData.videoUrl || '').includes('youtu')
                        ? '✓ YouTube Embed Player Ready'
                        : '✓ Direct MP4 Video Player Ready'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('productVideoLink', '');
                        handleFieldChange('videoUrl', '');
                      }}
                      className="text-[10px] text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                    >
                      Clear Video Link
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Add Image by URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Or Upload Image from Computer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider">
                    Or Upload Images from Device (Permanent Cloud Storage)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Compressed &amp; Cloud Saved
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200"
                />
                {imageUploading && (
                  <p className="text-[11px] font-bold text-amber-700 mt-1 animate-pulse">
                    Uploading &amp; saving image permanently to Cloud Firestore...
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider">
                    Current Gallery Images ({formData.images.length})
                  </label>
                  <span className="text-[11px] text-gray-500">
                    First image is the <b>Primary Card Image</b> displayed on storefront cards.
                  </span>
                </div>

                {formData.images.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                    No images added yet. Add an image URL or upload from your device.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border ${
                          idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-gray-200'
                        } aspect-square bg-gray-100 shadow-xs`}
                      >
                        <img src={img} alt="preview" className="w-full h-full object-cover" />

                        {idx === 0 && (
                          <span className="absolute top-2 left-2 z-10 bg-[#F5B800] text-[#171717] px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Primary
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              title="Delete Image"
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-black/40 backdrop-blur-xs p-1 rounded-lg">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, 'left')}
                                title="Move Left"
                                className="p-1 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-25"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formData.images.length - 1}
                                onClick={() => moveImage(idx, 'right')}
                                title="Move Right"
                                className="p-1 bg-white/20 text-white rounded hover:bg-white/40 disabled:opacity-25"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => makePrimaryImage(idx)}
                                title="Set as Primary Image"
                                className="px-1.5 py-0.5 bg-[#F5B800] text-black text-[9px] font-black rounded hover:bg-amber-400"
                              >
                                Make Main
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeSubTab === 'benefits' || (activeSubTab as any) === 'features') && (
            <div className="space-y-6">
              {/* Product Benefits Section Header & Instructions */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5B800] text-[#171717] flex items-center justify-center font-black shrink-0">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <span>Why Every Household / Kitchen Needs This (Product Benefits)</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-300">
                        Per-Product Custom
                      </span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Edit the Small Label (Eyebrow), Main Heading, and Description for this product, along with its dynamic Benefit Cards.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        benefitsSection: {
                          eyebrow: 'ENGINEERED FOR DAILY USE',
                          heading: 'Why Every Pakistani Kitchen Needs This',
                          description: 'Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.'
                        }
                      }));
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-xs transition"
                  >
                    Reset Kitchen Defaults
                  </button>
                </div>
              </div>

              {/* 1. Small Label (Eyebrow) & 2. Main Heading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">1</span>
                      <span>Small Label / Eyebrow Badge</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Example: &quot;ENGINEERED FOR DAILY USE&quot;</span>
                  </label>
                  <input
                    type="text"
                    value={formData.benefitsSection?.eyebrow ?? ''}
                    onChange={(e) => handleBenefitsSectionChange('eyebrow', e.target.value)}
                    placeholder="e.g. ENGINEERED FOR DAILY USE"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-[#F5B800]"
                  />
                  <p className="text-[10px] text-gray-400">
                    Pill tag text displayed right above the section heading on customer storefront.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">2</span>
                      <span>Section Main Heading</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Example: &quot;Why Every Pakistani Kitchen Needs This&quot;</span>
                  </label>
                  <input
                    type="text"
                    value={formData.benefitsSection?.heading ?? ''}
                    onChange={(e) => handleBenefitsSectionChange('heading', e.target.value)}
                    placeholder="e.g. Why Every Pakistani Kitchen Needs This"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:ring-2 focus:ring-[#F5B800]"
                  />
                  <p className="text-[10px] text-gray-400">
                    Primary section heading customized per product.
                  </p>
                </div>

                {/* 3. Description / Subtitle */}
                <div className="sm:col-span-2 space-y-1.5 pt-2 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#F5B800] text-[#171717] text-[10px] font-black inline-flex items-center justify-center">3</span>
                      <span>Section Description / Subtitle</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Example: &quot;Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords.&quot;</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.benefitsSection?.description ?? ''}
                    onChange={(e) => handleBenefitsSectionChange('description', e.target.value)}
                    placeholder="e.g. Say goodbye to painful manual chopping, burning eyes, and tangled electrical cords."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>
              </div>

              {/* 4. Benefit Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                      4. Product Benefit Cards ({(formData.benefits || []).length})
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      Individual benefit blocks with icons and descriptions displayed under the main heading.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddBenefit()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Benefit Card</span>
                  </button>
                </div>

                {formData.benefits.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-xs">
                    No benefit cards added yet. Click &quot;+ Add Benefit Card&quot; above to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.benefits.map((b, i) => (
                      <div
                        key={b.id || i}
                        className={`p-3.5 rounded-xl border transition ${
                          b.enabled !== false
                            ? 'bg-white border-gray-200 shadow-xs'
                            : 'bg-gray-100/60 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center">
                              #{i + 1}
                            </span>
                            <span className="font-bold text-gray-800 text-xs">
                              {b.title || `Benefit #${i + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-600 mr-2">
                              <input
                                type="checkbox"
                                checked={b.enabled !== false}
                                onChange={() => handleToggleBenefitEnabled(i)}
                                className="rounded text-[#F5B800] focus:ring-[#F5B800] w-3.5 h-3.5"
                              />
                              <span>Enabled</span>
                            </label>

                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => handleMoveBenefit(i, 'up')}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={i === formData.benefits.length - 1}
                              onClick={() => handleMoveBenefit(i, 'down')}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBenefit(i)}
                              className="p-1 text-red-500 hover:text-red-700 ml-1"
                              title="Delete Benefit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Icon
                            </label>
                            <select
                              value={b.icon || 'CheckCircle2'}
                              onChange={(e) => handleUpdateBenefitIcon(i, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                            >
                              <option value="Zap">⚡ Lightning / Speed (Zap)</option>
                              <option value="Sparkles">✨ Sparkles / Magic</option>
                              <option value="CheckCircle2">✓ Verified Checkmark</option>
                              <option value="ShieldCheck">🛡️ Shield / Guarantee</option>
                              <option value="Heart">❤️ Heart / Quality</option>
                              <option value="Star">⭐ Star / Rating</option>
                              <option value="Award">🏆 Award / Best</option>
                              <option value="Droplets">💧 Water / Washable</option>
                              <option value="BatteryCharging">🔋 Battery / Wireless</option>
                              <option value="Flame">🔥 Fire / Hot</option>
                              <option value="Clock">⏱️ Clock / Fast</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Benefit Title
                            </label>
                            <input
                              type="text"
                              value={b.title || b.text || ''}
                              onChange={(e) => handleUpdateBenefitText(i, e.target.value)}
                              placeholder="e.g. 6-Second Quick Prep"
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Benefit Description
                            </label>
                            <input
                              type="text"
                              value={b.description || ''}
                              onChange={(e) => handleUpdateBenefitDesc(i, e.target.value)}
                              placeholder="e.g. Chops onion, garlic, ginger and boneless chicken effortlessly."
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#F5B800]" />
                    Product Features &amp; Specifications Table
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Every product has its own custom Features Table displayed on the storefront. Add, edit, reorder or delete rows.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        specifications: [
                          { label: 'Material', value: 'Stainless Steel' },
                          { label: 'Display', value: '1.83 inch HD' },
                          { label: 'Battery', value: '7 Days' },
                          { label: 'Bluetooth', value: '5.0' },
                          { label: 'Water Resistant', value: 'IP67' },
                          { label: 'Warranty', value: '7-Day Check Guarantee' }
                        ]
                      }));
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-xs transition"
                  >
                    Load Smart Gadget Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        specifications: [
                          { label: 'Blade Material', value: '4-Leaf 304 Stainless Steel' },
                          { label: 'Motor Power', value: '300W High Speed Copper Motor' },
                          { label: 'Battery', value: '1500mAh USB-C Rechargeable' },
                          { label: 'Cup Capacity', value: '250ml Food-Grade BPA-Free' },
                          { label: 'Operation', value: 'One-Touch Pulse Button' },
                          { label: 'Warranty', value: '7-Day Replacement Guarantee' }
                        ]
                      }));
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold shadow-xs transition"
                  >
                    Load Kitchen Template
                  </button>
                </div>
              </div>

              {/* Interactive Features Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-black uppercase text-[10px] tracking-wider border-b border-gray-200">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-5/12">Feature Name</th>
                      <th className="py-2.5 px-3 w-5/12">Details (Value)</th>
                      <th className="py-2.5 px-3 text-center w-20">Order</th>
                      <th className="py-2.5 px-3 text-right w-14">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.specifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          No features added yet. Click &quot;+ Add Feature Row&quot; below or click a template above.
                        </td>
                      </tr>
                    ) : (
                      formData.specifications.map((spec, i) => (
                        <tr key={i} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-gray-400">
                            {i + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={spec.label}
                              onChange={(e) => {
                                const next = [...formData.specifications];
                                next[i].label = e.target.value;
                                setFormData((prev) => ({ ...prev, specifications: next }));
                              }}
                              placeholder="Feature (e.g. Material)"
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-[#F5B800]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={spec.value}
                              onChange={(e) => {
                                const next = [...formData.specifications];
                                next[i].value = e.target.value;
                                setFormData((prev) => ({ ...prev, specifications: next }));
                              }}
                              placeholder="Details (e.g. Stainless Steel)"
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:ring-1 focus:ring-[#F5B800]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => {
                                  if (i === 0) return;
                                  const next = [...formData.specifications];
                                  const temp = next[i];
                                  next[i] = next[i - 1];
                                  next[i - 1] = temp;
                                  setFormData((prev) => ({ ...prev, specifications: next }));
                                }}
                                title="Move Row Up"
                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={i === formData.specifications.length - 1}
                                onClick={() => {
                                  if (i === formData.specifications.length - 1) return;
                                  const next = [...formData.specifications];
                                  const temp = next[i];
                                  next[i] = next[i + 1];
                                  next[i + 1] = temp;
                                  setFormData((prev) => ({ ...prev, specifications: next }));
                                }}
                                title="Move Row Down"
                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  specifications: prev.specifications.filter((_, idx) => idx !== i)
                                }));
                              }}
                              title="Delete Row"
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Row Controls & Quick Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      specifications: [...prev.specifications, { label: '', value: '' }]
                    }));
                  }}
                  className="px-4 py-2 bg-[#171717] hover:bg-black text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
                  <span>+ Add Feature Row</span>
                </button>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-gray-500">Quick Insert:</span>
                  {['Material', 'Display', 'Battery', 'Bluetooth', 'Water Resistant', 'Warranty', 'Capacity', 'Weight'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          specifications: [...prev.specifications, { label: chip, value: '' }]
                        }));
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 border border-gray-200 rounded-lg text-[11px] font-semibold transition"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'variants' && (
            <div className="space-y-4">
              <span className="text-gray-500 text-xs block">
                Available color or style options customers can pick when placing orders.
              </span>
              <div className="space-y-2">
                {formData.variants.map((v, i) => (
                  <div key={v.id || i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const next = [...formData.variants];
                        next[i].name = e.target.value;
                        setFormData((prev) => ({ ...prev, variants: next }));
                      }}
                      placeholder="Variant Name (e.g. Emerald Green)"
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="color"
                      value={v.colorCode || '#165B33'}
                      onChange={(e) => {
                        const next = [...formData.variants];
                        next[i].colorCode = e.target.value;
                        setFormData((prev) => ({ ...prev, variants: next }));
                      }}
                      className="w-9 h-8 p-0 border rounded cursor-pointer"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                      <input
                        type="checkbox"
                        checked={v.inStock}
                        onChange={(e) => {
                          const next = [...formData.variants];
                          next[i].inStock = e.target.checked;
                          setFormData((prev) => ({ ...prev, variants: next }));
                        }}
                        className="rounded text-[#F5B800] focus:ring-[#F5B800]"
                      />
                      <span>In Stock</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, idx) => idx !== i)
                        }));
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      variants: [
                        ...prev.variants,
                        { id: 'v-' + Date.now(), name: 'New Color', colorCode: '#F5B800', inStock: true }
                      ]
                    }));
                  }}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold"
                >
                  + Add Variant Option
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-product-details"
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl font-bold shadow-md transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Product Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
