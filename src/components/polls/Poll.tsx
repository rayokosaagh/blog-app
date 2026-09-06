"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
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

// Pure translate, no opacity crossfade — a directional slide reads as a
// mechanical swap; fading the two slides through each other reads soft.
const variants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? 40 : -40,
  }),
  center: { x: 0 },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? -40 : 40,
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

  if (loading) {
    return (
      <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" />
          <h3 className="h-section h-section--sm text-foreground">Polls</h3>
        </div>
        <div className="border-t-2 border-border mt-4 mb-6" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-12 w-full rounded-none bg-muted border-2 border-border"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (polls.length === 0 || !currentPoll) return null;

  const hasVoted = Boolean(currentPoll.votedOptionId);
  const endsInLabel = formatEndsIn(currentPoll.endsAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-accent" />
          <h3 className="h-section h-section--sm text-foreground">Polls</h3>
        </div>

        {hasMultiple && (
          <span className="tag-pill bg-accent text-on-accent shrink-0 !py-0.5 !px-2 text-[10px]">
            {currentIndex + 1} of {polls.length}
          </span>
        )}
      </div>

      <div className="border-t-2 border-border mt-4 mb-4" />

      <div className="flex justify-end mb-4">
        <div className="flex gap-1">
          <button
            onClick={goToPrev}
            disabled={!hasMultiple}
            className="p-2 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy disabled:opacity-40 transition-colors duration-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNext}
            disabled={!hasMultiple}
            className="p-2 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy disabled:opacity-40 transition-colors duration-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

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
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={hasMultiple ? "cursor-grab active:cursor-grabbing" : ""}
          >
            {endsInLabel && <p className="text-xs text-muted-foreground mb-4">Ends: {endsInLabel}</p>}

            <div className="flex gap-3 mb-5">
              <div className="w-9 h-9 rounded-none bg-accent border-2 border-border-heavy flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M7 20V10M12 20V4M17 20v-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="h-card text-foreground leading-tight">
                {currentPoll.question}
              </h4>
            </div>

            <div className="space-y-3">
              {currentPoll.options.map((option, index) => {
                const pct = currentPoll.totalVotes > 0 ? Math.round((option.votes / currentPoll.totalVotes) * 100) : 0;
                const isSelected = option.id === currentPoll.votedOptionId;

                return (
                  <button
                    key={option.id}
                    disabled={hasVoted || voting}
                    onClick={() => handleVote(option.id)}
                    className={`relative w-full text-left rounded-none border-2 overflow-hidden ${
                      hasVoted
                        ? isSelected
                          ? "border-accent"
                          : "border-border-heavy"
                        : "border-border-heavy shadow-brutal-sm brutal-press hover:bg-accent-tint cursor-pointer"
                    } ${hasVoted ? "cursor-default" : ""}`}
                  >
                    {hasVoted && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-accent-tint"
                      />
                    )}

                    <div className="relative flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-none bg-foreground text-background text-xs font-extrabold flex items-center justify-center">
                          {LETTERS[index] ?? index + 1}
                        </div>
                        <span className="text-sm font-bold text-foreground">{option.label}</span>
                      </div>
                      {hasVoted && <span className="text-base font-extrabold text-accent">{pct}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-red-600 mt-3 text-sm text-center font-bold"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {hasMultiple && (
        <div className="flex justify-center gap-1.5 mt-6">
          {polls.map((_, i) => (
            /* The dot used to BE the button — a 10x10 target, under the 24x24
               WCAG 2.2 minimum and fiddly on a phone. The button is now 24x24
               with the dot as an inner span: identical visually, tappable. */
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              aria-label={`Go to poll ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`block w-2.5 h-2.5 rounded-none border border-border-heavy transition-colors duration-100 ${
                  i === currentIndex ? "bg-accent" : "bg-border hover:bg-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">
        Total votes: {currentPoll.totalVotes.toLocaleString()}
      </p>
    </motion.div>
  );
}