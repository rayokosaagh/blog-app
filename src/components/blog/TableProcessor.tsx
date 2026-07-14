"use client";

import { useMemo } from "react";
import EnhancedTable from "./EnhancedTable";

interface ContentPart {
  type: "html" | "table";
  content: string;
}

export default function TableProcessor({ html }: { html: string }) {
  const parts = useMemo((): ContentPart[] => {
    const tableRegex = /<!--TABLE_PLACEHOLDER_([A-Za-z0-9+/=]+)-->/g;
    const result: ContentPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(html)) !== null) {
      // Add HTML before this table
      if (match.index > lastIndex) {
        result.push({
          type: "html",
          content: html.slice(lastIndex, match.index),
        });
      }

      // Decode the table HTML
      try {
        const tableHtml = atob(match[1]);
        result.push({ type: "table", content: tableHtml });
      } catch {
        result.push({ type: "html", content: match[0] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining HTML
    if (lastIndex < html.length) {
      result.push({ type: "html", content: html.slice(lastIndex) });
    }

    return result;
  }, [html]);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "table") {
          return <EnhancedTable key={`table-${index}`} html={part.content} />;
        }
        return (
          <div
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        );
      })}
    </>
  );
}
