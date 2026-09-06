"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import { useFileDrop } from "@/components/dashboard/useFileDrop";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Youtube from "@tiptap/extension-youtube";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { DOMSerializer } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import { useEffect, useRef, useState } from "react";
import {
  Blocks,
  BookOpen,
  ChevronDown,
  Cpu,
  ListChecks,
  ThumbsDown,
  ThumbsUp,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table as TableIcon,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Images,
  PlayCircle as YoutubeIcon,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

/**
 * --- Content blocks ---
 * These are NOT TipTap nodes. Each one is a plain heading + <ul> that a
 * server-side cheerio parser recognises on the published post and swaps for an
 * animated card (see src/components/feeds/, wired up in blog/[slug]/page.tsx):
 *
 *   "Key Highlights" + <ul>      -> parseKeyHighlightsBlock
 *   "Specifications" + <ul>      -> parseSpecificationsBlock  (needs "Label: value")
 *   "Pros" / "Cons" + <ul>       -> parseProsConsBlock        (adjacent pair = one card)
 *   "Also Read" + <ul> of links  -> parseAlsoReadBlock        (needs real <a> tags)
 *
 * Every parser matches on the heading TEXT and on the list being the very next
 * sibling, and it fails by silently not matching — the post just renders as a
 * plain heading and bullets. So the `heading` strings below must stay exactly as
 * the parsers spell them, and the <ul> must stay glued to the heading.
 */
type BlockKind = "highlights" | "specs" | "pros" | "cons" | "alsoRead";

const BLOCKS: Record<
  BlockKind,
  {
    heading: string;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    /** Used when nothing is selected, so the shape the parser wants is obvious. */
    sample: string[];
  }
> = {
  highlights: {
    heading: "Key Highlights",
    label: "Key Highlights",
    hint: "Bulleted summary card",
    icon: ListChecks,
    sample: ["First highlight", "Second highlight", "Third highlight"],
  },
  specs: {
    heading: "Specifications",
    label: "Specifications",
    hint: "Spec table — each line needs Label: value",
    icon: Cpu,
    sample: ['Display: 6.7" AMOLED, 120Hz', "Chipset: Snapdragon 8 Gen 3", "Battery: 5000 mAh"],
  },
  pros: {
    heading: "Pros",
    label: "Pros",
    hint: "Green panel — pair with Cons for one card",
    icon: ThumbsUp,
    sample: ["What's good about it"],
  },
  cons: {
    heading: "Cons",
    label: "Cons",
    hint: "Red panel — place directly after Pros",
    icon: ThumbsDown,
    sample: ["What's not"],
  },
  alsoRead: {
    heading: "Also Read",
    label: "Also Read",
    hint: "Related-links card — items must be links",
    icon: BookOpen,
    sample: ["Link a related article here"],
  },
};

const BLOCK_MENU: BlockKind[] = ["highlights", "specs", "pros", "cons", "alsoRead"];

// Module scope, not inside the component — react-hooks/static-components flags
// components declared during render.
const Divider = () => <span className="mx-1 h-6 w-px shrink-0 bg-gray-200" aria-hidden="true" />;

/** Text of an inline-HTML fragment, via the DOM rather than a fourth hand-rolled tag stripper. */
function textOf(html: string): string {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  return holder.textContent ?? "";
}

export default function Editor({ content, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [bodyUploading, setBodyUploading] = useState(false);
  // Where the pointer was when the files were released, so a dropped image is
  // inserted there instead of at the caret. Captured before the await.
  const dropPosRef = useRef<number | null>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);

  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const blockMenuRef = useRef<HTMLDivElement>(null);

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
        // Renamed from `resizable: true` in TipTap v3 — the old key was
        // silently ignored, so resizing was inert until this was updated.
        resize: { enabled: true },
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 dark:text-blue-400 underline cursor-pointer" },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse table-auto w-full" },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: "bg-gray-100 dark:bg-zinc-800 font-medium border border-gray-300 dark:border-zinc-700 px-4 py-3 text-left" },
      }),
      TableCell.configure({
        HTMLAttributes: { class: "border border-gray-300 dark:border-zinc-700 px-4 py-3 align-top" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          // dark:prose-invert + explicit ink: the surface goes zinc-900 in
          // dark mode and text-gray-900 alone rendered black-on-black.
          "min-h-[400px] px-8 py-6 focus:outline-none prose prose-lg max-w-none text-gray-900 dark:prose-invert dark:text-zinc-100 " +
          "[&_ul]:list-disc [&_ol]:list-decimal " +
          "[&_li]:ml-6 [&_li]:pl-2 [&_li_p]:my-0 " +
          "[&_ul_ul]:ml-6 [&_ol_ol]:ml-6 " +
          "[&_ul]:mt-4 [&_ol]:mt-4 [&_li]:mt-1 " +
          "prose-ul:ml-0 prose-ol:ml-0 " +
          "prose-table:w-full prose-table:border-collapse " +
          "prose-th:border prose-th:border-gray-300 prose-td:border prose-td:border-gray-300 dark:prose-th:border-zinc-700 dark:prose-td:border-zinc-700 " +
          "prose-th:bg-gray-100 dark:prose-th:bg-zinc-800 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3",
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

  // Toolbar state. Tiptap v3's useEditor does NOT re-render the component on
  // every transaction (shouldRerenderOnTransaction defaults to false), so
  // reading editor.isActive(...) straight in JSX only refreshed when something
  // else happened to re-render — move the caret into a heading and the H1
  // button stayed unlit. useEditorState subscribes to transactions and
  // re-renders exactly when one of these flags changes.
  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: !!e?.isActive("bold"),
      italic: !!e?.isActive("italic"),
      underline: !!e?.isActive("underline"),
      strike: !!e?.isActive("strike"),
      h1: !!e?.isActive("heading", { level: 1 }),
      h2: !!e?.isActive("heading", { level: 2 }),
      h3: !!e?.isActive("heading", { level: 3 }),
      alignLeft: !!e?.isActive({ textAlign: "left" }),
      alignCenter: !!e?.isActive({ textAlign: "center" }),
      alignRight: !!e?.isActive({ textAlign: "right" }),
      bulletList: !!e?.isActive("bulletList"),
      orderedList: !!e?.isActive("orderedList"),
      blockquote: !!e?.isActive("blockquote"),
      codeBlock: !!e?.isActive("codeBlock"),
      link: !!e?.isActive("link"),
      selectionEmpty: e ? e.state.selection.empty : true,
      canUndo: !!e?.can().undo(),
      canRedo: !!e?.can().redo(),
    }),
  });

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

  // Close the block menu on an outside click or Escape. mousedown (not click) so
  // it closes before the editor handles the press, but the menu's own buttons
  // still get their click — they're inside the ref.
  useEffect(() => {
    if (!showBlockMenu) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!blockMenuRef.current?.contains(e.target as Node)) setShowBlockMenu(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBlockMenu(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBlockMenu]);

  // Declared above the bail-out below: hooks must run on every render. The
  // handlers it references are function declarations, so they are hoisted.
  const bodyDrop = useFileDrop({
    onFiles: handleBodyDrop,
    disabled: bodyUploading,
    multiple: true,
    onReject: (msg) => alert(msg),
  });

  // Record where the pointer was before the shared handler consumes the event,
  // so the image lands at the drop point rather than at the caret.
  const bodyDropProps = {
    ...bodyDrop.dropProps,
    onDrop: (e: React.DragEvent) => {
      const hit = editor?.view.posAtCoords({ left: e.clientX, top: e.clientY });
      dropPosRef.current = hit?.pos ?? null;
      bodyDrop.dropProps.onDrop(e);
    },
  };

  if (!editor) return null;

  /**
   * The selection as one string of inline HTML per line — paragraphs and list
   * items alike, so wrapping an existing bullet list behaves the same as
   * wrapping loose paragraphs. Inline markup (<a>, <strong>) survives, which
   * Also Read depends on: parseAlsoReadBlock drops any <li> with no <a>.
   */
  function selectedLines(): string[] {
    const { state } = editor;
    const { from, to, empty } = state.selection;
    if (empty) return [];

    const serializer = DOMSerializer.fromSchema(state.schema);
    const lines: string[] = [];

    const push = (node: ProseMirrorNode) => {
      // Dig past wrapper blocks (listItem > paragraph) to the inline content.
      let target = node;
      while (target.childCount === 1 && target.firstChild?.isBlock) {
        target = target.firstChild;
      }
      const holder = document.createElement("div");
      holder.appendChild(serializer.serializeFragment(target.content));
      const html = holder.innerHTML.trim();
      if (html) lines.push(html);
    };

    state.doc.slice(from, to).content.forEach((node) => {
      if (node.type.name === "bulletList" || node.type.name === "orderedList") {
        node.forEach(push);
      } else {
        push(node);
      }
    });

    return lines;
  }

  // Replace the selection with heading + <ul>, in the exact shape the matching
  // cheerio parser looks for. Nothing selected inserts the sample rows instead.
  function insertBlock(kind: BlockKind) {
    setShowBlockMenu(false);

    const { heading, sample } = BLOCKS[kind];
    const lines = selectedLines();
    const items = lines.length > 0 ? lines : sample;

    // Both parsers below bail silently on malformed input, and the author only
    // finds out after publishing — so flag it here instead.
    if (kind === "specs") {
      const missing = items.filter((item) => !textOf(item).includes(":")).length;
      if (
        missing > 0 &&
        !window.confirm(
          `${missing} of ${items.length} line(s) have no "Label: value" colon, so they'll be ` +
            `dropped from the specifications card. Insert anyway and fix them after?`
        )
      ) {
        return;
      }
    }
    if (kind === "alsoRead" && !items.some((item) => /<a[\s>]/i.test(item))) {
      alert(
        'The "Also Read" card only shows linked items. Add a link to each bullet after inserting, ' +
          "or it will render as a plain list."
      );
    }

    const html = `<h3>${heading}</h3><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

    // insertContentAt with the selection range replaces it outright — a
    // deleteSelection + insert leaves an empty <p> wedged before the heading,
    // and Specifications requires the <ul> to be the heading's next sibling.
    const { from, to } = editor.state.selection;
    editor.chain().focus().insertContentAt({ from, to }, html).run();
  }

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

  function removeLink() {
    editor?.chain().focus().unsetLink().run();
  }

  /**
   * Files dropped onto the document body. One image is inserted inline; several
   * become a [gallery] block, matching what the two toolbar buttons produce.
   */
  async function handleBodyDrop(files: File[]) {
    const at = dropPosRef.current;
    dropPosRef.current = null;
    setBodyUploading(true);
    try {
      if (files.length === 1) await uploadInlineImage(files[0], at ?? undefined);
      else await insertGallery(files);
    } finally {
      setBodyUploading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadInlineImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /**
   * Uploads one image and drops it into the document. `at` is a ProseMirror
   * position — set when the image arrived by drag, so it lands where it was
   * dropped rather than wherever the caret happened to be.
   */
  async function uploadInlineImage(file: File, at?: number) {
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

      const chain = editor?.chain().focus();
      if (at != null) chain?.setTextSelection(at);
      chain?.setImage({ src: data.url }).run();
    } catch (error) {
      alert("Image upload failed");
    }
  }

  // Upload multiple images and insert a [gallery] shortcode block. The block is
  // rendered as a real carousel on the published post by parseGalleryBlock +
  // <GalleryMount />. Inserted as plain text so URLs aren't auto-linked.
  async function handleGalleryInsert(e: React.ChangeEvent<HTMLInputElement>) {
    await insertGallery(Array.from(e.target.files ?? []));
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  async function insertGallery(files: File[]) {
    if (files.length === 0) return;

    setGalleryUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          alert(data?.error || "Upload failed");
          break;
        }
        urls.push(data.url);
      }
      if (urls.length > 0) {
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: "paragraph",
            content: [{ type: "text", text: `[gallery]${urls.join(" | ")}[/gallery]` }],
          })
          .run();
      }
    } catch {
      alert("Gallery upload failed");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

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
    disabled,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );

  const iconClass = "h-[18px] w-[18px]";

  return (
    <>
      <div className="border border-gray-200 rounded-xl shadow-sm">
        {/* Toolbar — pinned to the top of the viewport while scrolling through
            long content. NOTE: no `overflow-hidden` on this wrapper — an
            overflow ancestor silently breaks `position: sticky`. */}
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50/95 backdrop-blur-sm sticky top-0 z-30 rounded-t-xl">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={ui.bold} title="Bold">
            <Bold className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={ui.italic} title="Italic">
            <Italic className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={ui.underline} title="Underline">
            <UnderlineIcon className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={ui.strike} title="Strikethrough">
            <Strikethrough className={iconClass} />
          </ToolbarButton>

          <Divider />

          {/* Headings, as the article renders them (see .rich-text-render in
              blog/[slug]/page.tsx):
                H1  numbered section kicker: "[01] OVERVIEW ────". A short
                    label. Never a real <h1> on the page: the post title owns
                    that, so it ships as h2[data-was-h1] — the attribute is
                    what selects the kicker style (parseContentAndGenerateToc
                    does the demotion).
                H2  big display title, usually right under a kicker.
                H3  sub-heading with a "1.2" sub-number.
              No H4 button: h4 is a quiet small-caps label, not a level. */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={ui.h1} title="Section kicker (numbered label)">
            <Heading1 className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={ui.h2} title="Title (big display heading)">
            <Heading2 className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={ui.h3} title="Sub-heading">
            <Heading3 className={iconClass} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={ui.alignLeft} title="Align left">
            <AlignLeft className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={ui.alignCenter} title="Align center">
            <AlignCenter className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={ui.alignRight} title="Align right">
            <AlignRight className={iconClass} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={ui.bulletList} title="Bullet list">
            <List className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={ui.orderedList} title="Numbered list">
            <ListOrdered className={iconClass} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={ui.blockquote} title="Quote">
            <Quote className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={ui.codeBlock} title="Code block">
            <Code className={iconClass} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert table"
          >
            <TableIcon className={iconClass} />
          </ToolbarButton>

          <Divider />

          {/* Content blocks — wraps the selection in the heading + list shape the
              server-side card parsers recognise. See BLOCKS above. */}
          <div className="relative" ref={blockMenuRef}>
            <button
              type="button"
              onClick={() => setShowBlockMenu((open) => !open)}
              title="Insert content block"
              aria-label="Insert content block"
              aria-haspopup="menu"
              aria-expanded={showBlockMenu}
              className={`inline-flex h-9 items-center justify-center gap-0.5 rounded-md px-1.5 transition-colors ${
                showBlockMenu
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <Blocks className={iconClass} />
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showBlockMenu && (
              <div
                role="menu"
                className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {ui.selectionEmpty ? "Insert block" : "Wrap selection as"}
                </p>
                {BLOCK_MENU.map((kind) => {
                  const { label, hint, icon: Icon } = BLOCKS[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      role="menuitem"
                      onClick={() => insertBlock(kind)}
                      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-100"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900">{label}</span>
                        <span className="block text-xs text-gray-500">{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Divider />

          <ToolbarButton onClick={addLink} active={ui.link} title="Add link">
            <LinkIcon className={iconClass} />
          </ToolbarButton>
          {ui.link && (
            <ToolbarButton onClick={removeLink} title="Remove link">
              <Unlink className={iconClass} />
            </ToolbarButton>
          )}

          <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Upload image">
            <ImageIcon className={iconClass} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => galleryInputRef.current?.click()}
            title="Insert image gallery"
            disabled={galleryUploading}
          >
            {galleryUploading ? <Loader2 className={`${iconClass} animate-spin`} /> : <Images className={iconClass} />}
          </ToolbarButton>
          <ToolbarButton onClick={openYoutubeModal} title="Embed YouTube video">
            <YoutubeIcon className={iconClass} />
          </ToolbarButton>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryInsert}
            className="hidden"
          />

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!ui.canUndo}>
            <Undo2 className={iconClass} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!ui.canRedo}>
            <Redo2 className={iconClass} />
          </ToolbarButton>
        </div>

        <div
          {...bodyDropProps}
          className={`relative rounded-b-lg overflow-hidden transition-colors ${
            bodyDrop.isDragging ? "ring-2 ring-inset ring-blue-500/50 bg-blue-50/40 dark:bg-blue-500/5" : ""
          }`}
        >
          <EditorContent editor={editor} />
          {bodyDrop.isDragging && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-blue-500 px-3 py-1.5 text-center text-xs font-semibold text-white">
              {bodyUploading
                ? "Uploading…"
                : "Drop to insert — several at once become a gallery"}
            </div>
          )}
        </div>
      </div>

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