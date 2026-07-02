"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Youtube from "@tiptap/extension-youtube";

// Table extensions - named imports
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { useEffect, useRef, useState } from "react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);

  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      TextStyle,
      FontFamily,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write your blog post here..." }),
      Image.configure({
        resizable: true,
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse table-auto w-full" },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: "bg-gray-100 font-medium border border-gray-300 px-4 py-3 text-left" },
      }),
      TableCell.configure({
        HTMLAttributes: { class: "border border-gray-300 px-4 py-3 align-top" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] px-8 py-6 focus:outline-none prose prose-lg max-w-none text-gray-900 " +
          // Fixed List Formatting
          "[&_ul]:list-disc [&_ol]:list-decimal " +
          "[&_li]:ml-6 [&_li]:pl-2 [&_li_p]:my-0 " +
          "[&_ul_ul]:ml-6 [&_ol_ol]:ml-6 " +
          "[&_ul]:mt-4 [&_ol]:mt-4 [&_li]:mt-1 " +
          "prose-ul:ml-0 prose-ol:ml-0 " +
          // Table Formatting
          "prose-table:w-full prose-table:border-collapse " +
          "prose-th:border prose-th:border-gray-300 prose-td:border prose-td:border-gray-300 " +
          "prose-th:bg-gray-100 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                editor?.chain().focus().setImage({ src: e.target?.result as string }).run();
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Escape-to-close, focus the input, and lock background scroll while the modal is open
  useEffect(() => {
    if (!showYoutubeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowYoutubeModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => youtubeInputRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
    };
  }, [showYoutubeModal]);

  if (!editor) return null;

  // Add link
  function addLink() {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  // Remove link
  function removeLink() {
    editor?.chain().focus().unsetLink().run();
  }

  // Upload image
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      editor?.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      alert("Image upload failed");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // YouTube embed modal
  function openYoutubeModal() {
    setYoutubeUrl("");
    setYoutubeError("");
    setShowYoutubeModal(true);
  }

  function closeYoutubeModal() {
    setShowYoutubeModal(false);
  }

  function isValidYoutubeUrl(url: string) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/i.test(
      url.trim()
    );
  }

  function handleYoutubeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = youtubeUrl.trim();

    if (!trimmed) {
      setYoutubeError("Paste a YouTube link to continue.");
      return;
    }
    if (!isValidYoutubeUrl(trimmed)) {
      setYoutubeError("That doesn't look like a YouTube link.");
      return;
    }

    editor?.commands.setYoutubeVideo({ src: trimmed });
    setShowYoutubeModal(false);
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setYoutubeUrl(text.trim());
        setYoutubeError("");
      }
    } catch {
      setYoutubeError("Couldn't read clipboard — paste manually.");
    }
  }

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm font-medium ${
        active ? "bg-gray-200 text-blue-600" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="border border-gray-300 rounded-lg">
        {/* Toolbar — pinned while scrolling through long content */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50/95 backdrop-blur-sm sticky top-0 z-20 rounded-t-lg">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <b>B</b>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <i>I</i>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <u>U</u>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            ◀
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            ▬
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            ▶
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            • List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            1. List
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Table */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title="Insert Table"
          >
            ▦ Table
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Blockquote & Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            ❝
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            {"</>"}
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Link */}
          <ToolbarButton
            onClick={addLink}
            active={editor.isActive("link")}
            title="Add Link"
          >
            🔗
          </ToolbarButton>

          {editor.isActive("link") && (
            <ToolbarButton onClick={removeLink} title="Remove Link">
              🔗✕
            </ToolbarButton>
          )}

          {/* Image Upload */}
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
          >
            🖼️
          </ToolbarButton>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* YouTube Embed */}
          <ToolbarButton onClick={openYoutubeModal} title="Embed YouTube Video">
            ▶️ YT
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            ↩
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            ↪
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <div className="rounded-b-lg overflow-hidden">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* YouTube embed modal */}
      {showYoutubeModal && (
        <>
          <style>{`
            @keyframes ytOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes ytPanelIn {
              0% { opacity: 0; transform: scale(0.92) translateY(12px); }
              60% { opacity: 1; transform: scale(1.015) translateY(-2px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes ytLiquidMorph {
              0%, 100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; transform: translate(0,0) scale(1); }
              25% { border-radius: 58% 42% 35% 65% / 55% 60% 40% 45%; transform: translate(6px,-4px) scale(1.06); }
              50% { border-radius: 50% 50% 38% 62% / 62% 42% 58% 38%; transform: translate(-5px,3px) scale(0.96); }
              75% { border-radius: 38% 62% 58% 42% / 40% 55% 45% 60%; transform: translate(4px,5px) scale(1.04); }
            }
            .yt-modal-overlay { animation: ytOverlayIn 0.2s ease-out; }
            .yt-modal-panel { animation: ytPanelIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .yt-liquid-blob { animation: ytLiquidMorph 7s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .yt-modal-overlay, .yt-modal-panel, .yt-liquid-blob { animation: none !important; }
            }
          `}</style>

          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm yt-modal-overlay"
            onClick={closeYoutubeModal}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden yt-modal-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-28 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex items-center justify-center">
                <div className="yt-liquid-blob absolute w-28 h-28 bg-gradient-to-br from-red-500 via-rose-500 to-blue-500 opacity-80 blur-xl" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-xl">
                  ▶️
                </div>
                <button
                  type="button"
                  onClick={closeYoutubeModal}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleYoutubeSubmit} className="p-6 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Embed a YouTube video
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Paste a video link below. It&apos;ll appear inline, sized to fit.
                </p>

                <div className="flex items-stretch gap-2">
                  <input
                    ref={youtubeInputRef}
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setYoutubeError("");
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`flex-1 border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                      youtubeError
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    Paste
                  </button>
                </div>

                {youtubeError && (
                  <p className="text-xs text-red-500 mt-2">{youtubeError}</p>
                )}

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeYoutubeModal}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Embed video
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}