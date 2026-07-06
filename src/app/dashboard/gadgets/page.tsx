"use client";

import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    loadProducts();
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

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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
    <div className="space-y-6">
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

      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:border dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-zinc-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-left text-zinc-500">
              <tr>
                <th className="p-4"></th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Published</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-zinc-400" size={22} />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-base text-zinc-900 dark:text-zinc-50">{p.name}</td>
                  <td className="p-4 text-zinc-500">{p.category.name}</td>
                  <td className="p-4 text-zinc-500">{p.brand}</td>
                  <td className="p-4">{p.published ? "✅" : "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <Link href={`/dashboard/gadgets/${p.id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => openDeleteModal(p.id, p.name)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}