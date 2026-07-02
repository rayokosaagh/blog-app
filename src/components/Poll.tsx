"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface PollData {
  id: string;
  question: string;
  endsAt: string | null;
  totalVotes: number;
  votedOptionId: string | null;
  options: PollOption[];
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function formatEndsIn(endsAt: string | null) {
  if (!endsAt) return null;
  return new Date(endsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const variants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function Poll() {
  const { data: session } = useSession();
  const [polls, setPolls] = useState<PollData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/polls/active", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          console.error("Failed to fetch polls, status:", res.status);
          setPolls([]);
          return;
        }

        const data = await res.json();
        const pollList = Array.isArray(data)
          ? data.filter((p) => p && Array.isArray(p.options))
          : [];

        setPolls(pollList);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
        setPolls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [session?.user?.id]);

  // Auto-cycle — paused while hovering or dragging
  useEffect(() => {
    if (polls.length <= 1 || isHovering || isDragging) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % polls.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [polls.length, isHovering, isDragging]);

  const currentPoll = polls[currentIndex];
  const hasMultiple = polls.length > 1;

  const goToNext = () => {
    if (polls.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % polls.length);
  };

  const goToPrev = () => {
    if (polls.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + polls.length) % polls.length);
  };

  const goToIndex = (i: number) => {
    if (i === currentIndex) return;
    setDirection(i > currentIndex ? 1 : -1);
    setCurrentIndex(i);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const swipeDistance = 60;
    const swipeVelocity = 400;

    if (info.offset.x < -swipeDistance || info.velocity.x < -swipeVelocity) {
      goToNext();
    } else if (info.offset.x > swipeDistance || info.velocity.x > swipeVelocity) {
      goToPrev();
    }
  };

  async function handleVote(optionId: string) {
    if (!currentPoll || currentPoll.votedOptionId || voting) return;
    setVoting(true);
    setError("");

    try {
      const res = await fetch(`/api/polls/${currentPoll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vote failed");

      setPolls((prev) =>
        prev.map((p) =>
          p.id === currentPoll.id
            ? {
                ...p,
                votedOptionId: data.votedOptionId,
                totalVotes: data.totalVotes ?? p.totalVotes,
                options: data.options ?? p.options,
              }
            : p
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  }

  if (loading) return <div className="text-center py-10 text-sm text-muted-foreground">Loading polls...</div>;
  if (polls.length === 0 || !currentPoll) return null;

  const hasVoted = Boolean(currentPoll.votedOptionId);
  const endsInLabel = formatEndsIn(currentPoll.endsAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className="bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border border-border p-6"
    >
      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {hasMultiple ? `Poll ${currentIndex + 1} of ${polls.length}` : "Active Poll"}
        </span>

        <div className="flex gap-1">
          <button
            onClick={goToPrev}
            disabled={!hasMultiple}
            className="p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNext}
            disabled={!hasMultiple}
            className="p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {hasMultiple && (
        <div className="flex justify-center gap-1.5 mb-6">
          {polls.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-blue-600 dark:bg-blue-400 scale-125"
                  : "bg-border hover:bg-foreground/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Clipped viewport so sliding content never escapes the card */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentPoll.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            whileDrag={{ scale: 0.98 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={hasMultiple ? "cursor-grab active:cursor-grabbing" : ""}
          >
            {endsInLabel && <p className="text-xs text-muted-foreground mb-4">Ends: {endsInLabel}</p>}

            <div className="flex gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M7 20V10M12 20V4M17 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {currentPoll.question}
              </h3>
            </div>

            <div className="space-y-3">
              {currentPoll.options.map((option, index) => {
                const pct = currentPoll.totalVotes > 0 ? Math.round((option.votes / currentPoll.totalVotes) * 100) : 0;
                const isSelected = option.id === currentPoll.votedOptionId;

                return (
                  <motion.button
                    key={option.id}
                    whileHover={!hasVoted ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!hasVoted ? { scale: 0.98 } : {}}
                    disabled={hasVoted || voting}
                    onClick={() => handleVote(option.id)}
                    className={`relative w-full text-left rounded-xl border overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "border-blue-500 dark:border-blue-400 shadow-sm"
                        : "border-border hover:border-foreground/20"
                    } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {hasVoted && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="absolute inset-y-0 left-0 bg-blue-100 dark:bg-blue-900/30"
                      />
                    )}

                    <div className="relative flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">
                          {LETTERS[index] ?? index + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                      </div>
                      {hasVoted && <span className="text-base font-semibold text-blue-600 dark:text-blue-400">{pct}%</span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="text-red-600 mt-3 text-sm text-center">{error}</p>}

      <p className="text-center text-xs text-muted-foreground mt-6">
        Total votes: {currentPoll.totalVotes.toLocaleString()}
      </p>
    </motion.div>
  );
}