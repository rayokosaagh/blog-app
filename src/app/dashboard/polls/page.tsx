"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar } from "lucide-react";

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

  // Form states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this poll?")) return;

    try {
      const res = await fetch(`/api/polls/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPolls();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete poll");
    }
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Polls</h1>
        {view === "list" && (
          <button
            onClick={() => setView("add")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            <Plus size={20} />
            New Poll
          </button>
        )}
      </div>

      {view === "list" ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center">Loading polls...</p>
          ) : !Array.isArray(polls) || polls.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No polls yet. Create your first one!
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {polls.map((poll) => (
                <div key={poll.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{poll.question}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>{poll.options?.length || 0} options</span>
                      <span>•</span>
                      <span>{poll.totalVotes || 0} votes</span>
                      {poll.endsAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> Ends {new Date(poll.endsAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        poll.isActive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600"
                      }`}>
                        {poll.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(poll)}
                      className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="p-3 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-semibold mb-6">
            {view === "add" ? "Create New Poll" : "Edit Poll"}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-indigo-500"
                placeholder="What is your favorite...?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Options</label>
              {options.map((opt, index) => (
                <div key={index} className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700"
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                + Add another option
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date (optional)</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActive" className="font-medium">Keep poll active</label>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => {
                setView("list");
                resetForm();
              }}
              className="flex-1 py-3.5 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
            >
              {view === "add" ? "Create Poll" : "Update Poll"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}