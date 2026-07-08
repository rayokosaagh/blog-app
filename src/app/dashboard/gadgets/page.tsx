"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  published: boolean;
  image?: string | null;
  category: { name: string; slug: string };
}

type ActionType = "deleted" | null;

export default function GadgetsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [deletedName, setDeletedName] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadProducts() {
    try {
      const res = await fetch("/api/gadgets/products");
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, string>(); // slug -> name
    products.forEach((p) => map.set(p.category.slug, p.category.name));
    return Array.from(map.entries());
  }, [products]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === "all") return "All Categories";
    return categories.find(([slug]) => slug === selectedCategory)?.[1] ?? "All Categories";
  }, [selectedCategory, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || p.category.slug === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  function openDeleteModal(id: string, name: string) {
    setProductToDelete({ id, name });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gadgets/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let message = "Failed to delete product";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          message = `${message} (${res.status} ${res.statusText})`;
        }
        setShowDeleteModal(false);
        setErrorMessage(message);
        setShowErrorModal(true);
        return;
      }

      setDeletedName(productToDelete.name);
      setShowDeleteModal(false);
      setSuccessAction("deleted");
      await loadProducts();

      setTimeout(() => {
        setSuccessAction(null);
        setDeletedName("");
      }, 1800);
    } catch {
      setShowDeleteModal(false);
      setErrorMessage("Something went wrong. Please try again.");
      setShowErrorModal(true);
    } finally {
      setDeleting(false);
      setProductToDelete(null);
    }
  }

  // Success screen (matches banners page pattern)
  if (successAction) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-12 text-center max-w-md scale-95 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-50 mb-3">
            Product Deleted!
          </h2>
          <p className="text-gray-600 dark:text-zinc-400 text-lg">
            "{deletedName}" has been removed successfully.
          </p>
        </div>
      </div>
    );
  }

  // Delete confirmation modal
  if (showDeleteModal && productToDelete) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🗑️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 text-center">
              Delete Product?
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 text-center mt-3">
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>?
            </p>
            <p className="text-sm text-red-600 text-center mt-2">This action cannot be undone.</p>
          </div>
          <div className="border-t dark:border-zinc-800 flex">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
              }}
              disabled={deleting}
              className="flex-1 py-5 text-gray-600 dark:text-zinc-300 font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors rounded-bl-3xl active:scale-95 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors rounded-br-3xl active:scale-95 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error modal (replaces alert())
  if (showErrorModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 text-center">
              Couldn't Delete Product
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 text-center mt-3">{errorMessage}</p>
          </div>
          <div className="border-t dark:border-zinc-800">
            <button
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage("");
              }}
              className="w-full py-5 text-gray-900 dark:text-zinc-50 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors rounded-b-3xl active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Gadgets</h1>
          <p className="text-zinc-500 mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/gadgets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Product
          </Link>
          <Link
            href="/dashboard/gadgets/comparisons"
            className="border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Manage Comparisons
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-zinc-50 placeholder-gray-400"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</div>
        </div>

        {/* Custom Category Dropdown */}
        <div className="sm:w-64 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full border border-gray-300 dark:border-zinc-700 rounded-2xl px-5 py-3.5 bg-white dark:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900 dark:text-zinc-50"
          >
            <span>{selectedCategoryLabel}</span>
            <span className={`transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showCategoryDropdown && (
            <div className="absolute mt-2 w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 py-2 z-50 max-h-72 overflow-y-auto">
              <div
                onClick={() => {
                  setSelectedCategory("all");
                  setShowCategoryDropdown(false);
                }}
                className={`px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                  selectedCategory === "all" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium" : "text-gray-900 dark:text-zinc-200"
                }`}
              >
                All Categories
              </div>
              {categories.map(([slug, name]) => (
                <div
                  key={slug}
                  onClick={() => {
                    setSelectedCategory(slug);
                    setShowCategoryDropdown(false);
                  }}
                  className={`px-5 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                    selectedCategory === slug ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium" : "text-gray-900 dark:text-zinc-200"
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products List (card rows, same compact size as original table rows) */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-zinc-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:border dark:border-zinc-800 p-16 text-center text-zinc-500">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium">No products found</p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:border dark:border-zinc-800 flex items-center gap-4 p-4"
            >
              {/* Thumbnail - same 64x64 size as original */}
              <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="text-zinc-400" size={22} />
                )}
              </div>

              {/* Name + Brand */}
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-base text-zinc-900 dark:text-zinc-50 truncate">
                  {p.name}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">{p.brand}</p>
              </div>

              {/* Category badge */}
              <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex-shrink-0">
                {p.category.name}
              </span>

              {/* Published badge */}
              <span
                className={`hidden sm:inline-block text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  p.published
                    ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {p.published ? "Published" : "Draft"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <Link
                  href={`/dashboard/gadgets/${p.id}/edit`}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={() => openDeleteModal(p.id, p.name)}
                  className="text-sm text-red-600 hover:underline font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}