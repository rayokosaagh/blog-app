"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, BarChart3, X } from "lucide-react";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import BackLink from "@/components/dashboard/BackLink";

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  isActive: boolean;
  endsAt: string | null;
  totalVotes: number;
  options: PollOption[];
  createdAt: string;
}

type View = "list" | "add" | "edit";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [view, setView] = useState<View>("list");
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Which poll's active-toggle is mid-flight, and the last toggle failure.
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();

      if (Array.isArray(data)) {
        setPolls(data);
      } else if (data.error) {
        console.error("API Error:", data.error);
        setPolls([]);
      } else {
        setPolls([]);
      }
    } catch (error) {
      console.error("Failed to fetch polls", error);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.filter(Boolean).length < 2) {
      alert("Question and at least 2 options are required");
      return;
    }

    const url = currentPoll ? `/api/polls/${currentPoll.id}` : "/api/polls";
    const method = currentPoll ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options: options.filter(Boolean),
          endsAt: endsAt || null,
          isActive,
        }),
      });

      if (res.ok) {
        await fetchPolls();
        setView("list");
        resetForm();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save poll");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
    setEndsAt("");
    setIsActive(true);
    setCurrentPoll(null);
  };

  const handleEdit = (poll: Poll) => {
    setCurrentPoll(poll);
    setQuestion(poll.question);
    setOptions(poll.options.map((o) => o.label));
    setEndsAt(poll.endsAt ? poll.endsAt.split("T")[0] : "");
    setIsActive(poll.isActive);
    setView("edit");
  };

  /**
   * Flips a poll's isActive straight from the list, without opening the edit
   * form. Deliberately PATCHes ONLY `isActive`: the same endpoint rebuilds the
   * options (delete + recreate) whenever an `options` array is present, which
   * would discard every vote already cast. Sending the single field takes the
   * simple-update branch and leaves votes intact.
   *
   * Updated optimistically and rolled back on failure, so the switch never
   * shows a state the server did not accept.
   */
  const handleToggleActive = async (poll: Poll) => {
    const next = !poll.isActive;
    setTogglingId(poll.id);
    setPolls((prev) =>
      prev.map((p) => (p.id === poll.id ? { ...p, isActive: next } : p))
    );

    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
    } catch (error) {
      console.error("Failed to toggle poll", error);
      setPolls((prev) =>
        prev.map((p) => (p.id === poll.id ? { ...p, isActive: poll.isActive } : p))
      );
      setToggleError(
        `Could not ${next ? "enable" : "disable"} "${poll.question}". Please try again.`
      );
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pollToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/polls/${pollToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setPollToDelete(null);
        await fetchPolls();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleBackToList = () => {
    setView("list");
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Polls
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Create and manage polls shown on the site
              </p>
            </div>
          </div>
          {view === "list" && (
            <button
              onClick={() => setView("add")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New poll</span>
            </button>
          )}
        </div>
      </div>

      {view === "list" && toggleError && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-500/20"
        >
          <span>{toggleError}</span>
          <button
            type="button"
            onClick={() => setToggleError(null)}
            aria-label="Dismiss error"
            className="shrink-0 rounded-lg p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-zinc-400">Loading polls...</p>
          ) : !Array.isArray(polls) || polls.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-400">
              No polls yet. Create your first one.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 truncate">
                      {poll.question}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{poll.options?.length || 0} options</span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span>{poll.totalVotes || 0} votes</span>
                      {poll.endsAt && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} /> Ends {new Date(poll.endsAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                          poll.isActive
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {poll.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Enable/disable without opening the edit form. A poll can
                        be pulled off the site instantly this way, and turned
                        back on without retyping anything — deleting is the only
                        thing that loses the votes. */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={poll.isActive}
                      aria-label={`${poll.isActive ? "Disable" : "Enable"} poll: ${poll.question}`}
                      title={poll.isActive ? "Disable poll" : "Enable poll"}
                      onClick={() => handleToggleActive(poll)}
                      disabled={togglingId === poll.id}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 ${
                        poll.isActive
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          poll.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleEdit(poll)}
                      className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors"
                      aria-label="Edit poll"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      onClick={() => setPollToDelete(poll)}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                      aria-label="Delete poll"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
        >
          <div className="h-1 bg-blue-500" />
          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <BackLink onClick={handleBackToList} label="Polls" />
            </div>

            <h2
              className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "add" ? "Create new poll" : "Edit poll"}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="What is your favorite...?"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Options
                </label>
                <div className="space-y-2.5">
                  {options.map((opt, index) => (
                    <div key={index} className="flex gap-2.5">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);
                        }}
                        className="flex-1 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                          aria-label="Remove option"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold mt-3"
                >
                  + Add another option
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  End date (optional)
                </label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              <label htmlFor="isActive" className="flex items-center gap-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500/40"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Keep poll active
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleBackToList}
                className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {view === "add" ? "Create poll" : "Update poll"}
              </button>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={!!pollToDelete}
        title="Delete poll"
        itemName={pollToDelete?.question}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPollToDelete(null)}
      />
    </div>
  );
}