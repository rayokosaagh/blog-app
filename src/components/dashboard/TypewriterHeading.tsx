"use client";

import { useEffect, useState } from "react";

interface TypewriterHeadingProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  style?: React.CSSProperties;
}

export default function TypewriterHeading({
  text,
  speed = 45,
  className,
  style,
}: TypewriterHeadingProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
    // Re-run only if the underlying text changes (e.g. name loads late)
  }, [text, speed]);

  return (
    <h1 className={className} style={style}>
      {displayed}
      <span
        aria-hidden="true"
        className={`inline-block w-[2px] -mb-1 ml-0.5 h-[1em] bg-current align-middle ${
          done ? "animate-pulse" : "opacity-100"
        }`}
      />
    </h1>
  );
}