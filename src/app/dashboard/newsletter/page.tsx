"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Mail, Search, ChevronDown, CheckCircle2, X } from "lucide-react";
import { EmptyStateRow } from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
  const pendingCount = subscribers.length - confirmedCount;

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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading subscribers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Newsletter
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {filteredSubscribers.length} of {subscribers.length} subscribers · {confirmedCount} confirmed
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-5">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{subscribers.length}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Total subscribers</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-5">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{confirmedCount}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Confirmed</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-5 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pending</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative sm:w-52" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span>
              {statusFilter === "ALL" && "All statuses"}
              {statusFilter === "CONFIRMED" && "Confirmed only"}
              {statusFilter === "PENDING" && "Pending only"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50">
              {[
                { value: "ALL", label: "All statuses" },
                { value: "CONFIRMED", label: "Confirmed only" },
                { value: "PENDING", label: "Pending only" },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value as "ALL" | Status);
                    setShowStatusDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    statusFilter === option.value
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
          {fetchError}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>
            <strong>{successMessage}</strong> has been removed.
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Subscribed</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredSubscribers.length === 0 ? (
                <EmptyStateRow
                  colSpan={4}
                  icon={Mail}
                  title={subscribers.length === 0 ? "No subscribers yet" : "No subscribers match your filters"}
                  description={
                    subscribers.length === 0
                      ? "Readers who sign up to the newsletter will be listed here."
                      : "Try a different status filter or search term."
                  }
                />
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm shrink-0">
                          {subscriber.email.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {subscriber.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${
                          subscriber.confirmed
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {subscriber.confirmed ? "Confirmed" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(subscriber.createdAt).toDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openDeleteModal(subscriber)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteModal && !!subscriberToDelete}
        title="Remove subscriber?"
        message={
          error ? (
            <span className="text-rose-600 dark:text-rose-400">{error}</span>
          ) : (
            <>
              Are you sure you want to remove{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {subscriberToDelete?.email}
              </strong>
              ?
            </>
          )
        }
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setSubscriberToDelete(null);
          setError("");
        }}
      />
    </div>
  );
}