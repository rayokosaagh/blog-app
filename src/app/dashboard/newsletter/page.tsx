"use client";

import { useState, useEffect, useMemo, useRef } from "react";

type Status = "CONFIRMED" | "PENDING";

interface Subscriber {
  id: string;
  email: string;
  confirmed: boolean;
  createdAt: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Success
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchSubscribers() {
    try {
      const res = await fetch("/api/newsletter");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "Failed to load subscribers");
        return;
      }
      setSubscribers(data);
      setFetchError("");
    } catch {
      setFetchError("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesSearch = s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "CONFIRMED" && s.confirmed) ||
        (statusFilter === "PENDING" && !s.confirmed);
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, statusFilter]);

  const confirmedCount = subscribers.filter((s) => s.confirmed).length;

  function openDeleteModal(subscriber: Subscriber) {
    setSubscriberToDelete({ id: subscriber.id, email: subscriber.email });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!subscriberToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/newsletter/${subscriberToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove subscriber");
        return;
      }
      setSuccessMessage(subscriberToDelete.email);
      await fetchSubscribers();
      setTimeout(() => setSuccessMessage(""), 1800);
    } catch {
      setError("Failed to remove subscriber");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSubscriberToDelete(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading subscribers...</p></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-500 mt-1">
            {filteredSubscribers.length} of {subscribers.length} subscribers · {confirmedCount} confirmed
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        </div>

        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900"
          >
            <span>
              {statusFilter === "ALL" && "All Statuses"}
              {statusFilter === "CONFIRMED" && "Confirmed Only"}
              {statusFilter === "PENDING" && "Pending Only"}
            </span>
            <span className={`transition-transform duration-300 ${showStatusDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showStatusDropdown && (
            <div className="absolute mt-3 w-full bg-white rounded-3xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {[
                { value: "ALL", label: "All Statuses" },
                { value: "CONFIRMED", label: "Confirmed Only" },
                { value: "PENDING", label: "Pending Only" }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value as "ALL" | Status);
                    setShowStatusDropdown(false);
                  }}
                  className={`px-6 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors ${
                    statusFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fetch Error */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl">{fetchError}</div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="text-xl">✅</span>
          <span>
            <strong>"{successMessage}"</strong> has been removed successfully.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Email</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Subscribed</th>
              <th className="text-left p-5 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400">No subscribers found</td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber, index) => (
                <tr
                  key={subscriber.id}
                  className="group hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm transition-transform group-hover:scale-110">
                        {subscriber.email.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{subscriber.email}</p>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      subscriber.confirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {subscriber.confirmed ? "CONFIRMED" : "PENDING"}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-600">
                    {new Date(subscriber.createdAt).toDateString()}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4 opacity-80 group-hover:opacity-100 transition-all">
                      <button onClick={() => openDeleteModal(subscriber)} className="text-red-600 hover:text-red-700 font-medium transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && subscriberToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Remove Subscriber?</h2>
              <p className="text-gray-600 text-center mt-3">
                Are you sure you want to remove <strong>"{subscriberToDelete.email}"</strong>?
              </p>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mt-4 text-sm">{error}</div>}
            </div>
            <div className="border-t flex">
              <button
                onClick={() => { setShowDeleteModal(false); setSubscriberToDelete(null); setError(""); }}
                className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 active:scale-95 transition-all rounded-bl-3xl"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all rounded-br-3xl disabled:opacity-70"
              >
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}