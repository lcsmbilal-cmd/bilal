import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  Search,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { ProductCategory, Product } from '../../types';
import { adminFetch } from '../../utils/adminApi';

interface CategoryManagerProps {
  products?: Product[];
  onRefreshAll?: () => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  products = [],
  onRefreshAll
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<ProductCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [visible, setVisible] = useState<boolean>(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setOrder(categories.length + 1);
    setVisible(true);
    setEditingCategory(null);
    setIsCreating(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setOrder(cat.order || 1);
    setVisible(cat.visible !== false);
    setEditingCategory(cat);
    setIsCreating(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await adminFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: base64Data,
            filename: file.name.replace(/\.[^/.]+$/, ''),
            category: 'categories'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload category image');

        setImage(data.url);
        showToast('success', 'Category image uploaded!');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Category name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        image: image.trim(),
        order: Number(order) || 1,
        visible
      };

      if (editingCategory) {
        // PUT update
        const res = await adminFetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update category');
        showToast('success', `Category "${name}" updated successfully!`);
      } else {
        // POST create
        const res = await adminFetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create category');
        showToast('success', `New category "${name}" created successfully!`);
      }

      setIsCreating(false);
      setEditingCategory(null);
      await fetchCategories();
      if (onRefreshAll) await onRefreshAll();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirmCat) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/categories/${deleteConfirmCat.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      showToast('success', `Category "${deleteConfirmCat.name}" deleted.`);
      setDeleteConfirmCat(null);
      await fetchCategories();
      if (onRefreshAll) await onRefreshAll();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
  });

  const getProductCountForCat = (catId: string, catSlug: string) => {
    return products.filter((p) => p.categoryId === catId || p.category === catSlug || p.category === catId).length;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all ${
            message.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
              : 'bg-red-900 text-red-100 border border-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F5B800]">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Store Organization</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight mt-1">Product Categories</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, and organize product categories. Categories help organize your catalog and showcase groups of products.
          </p>
        </div>

        <button
          id="btn-add-new-category"
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] font-bold text-xs rounded-xl shadow transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
            Total: {categories.length}
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
            Active: {categories.filter((c) => c.visible !== false).length}
          </span>
        </div>
      </div>

      {/* Categories Grid / Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <div className="w-8 h-8 border-2 border-[#F5B800] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs font-bold text-gray-500">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
          <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">No categories found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try matching a different keyword.' : 'Get started by creating your first product category.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5B800] text-[#171717] font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = getProductCountForCat(cat.id, cat.slug);
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-xs"
                          onError={(e) => {
                            (e.target as any).src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 font-black text-sm">
                          {cat.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-black text-gray-900 group-hover:text-[#F5B800] transition">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] font-mono text-gray-400">/{cat.slug}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        cat.visible !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {cat.visible !== false ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span>{count} {count === 1 ? 'Product' : 'Products'}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] text-gray-400">Order #{cat.order}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      title="Edit Category"
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCat(cat)}
                      title="Delete Category"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Kitchen Appliances"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500 font-mono">
                    /category/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="kitchen-appliances"
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-r-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description for this category..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B800]"
                />
              </div>

              {/* Category Image */}
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                  Category Thumbnail / Icon Image
                </label>
                <div className="flex items-center gap-3">
                  {image ? (
                    <img
                      src={image}
                      alt="Category preview"
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                      {image && (
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste image URL https://..."
                      className="w-full px-3 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                    Visibility
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => setVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-[#F5B800] focus:ring-[#F5B800]"
                    />
                    <span className="font-bold text-gray-800">Show on Store</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-5 py-2 text-xs font-bold bg-[#F5B800] hover:bg-[#e0a800] text-[#171717] rounded-xl shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Delete Category?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-gray-800">"{deleteConfirmCat.name}"</span>? Products belonging to this category will not be deleted.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
