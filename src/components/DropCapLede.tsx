import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export function parseDropCapLedeBlock(html: string): string {
  const $ = cheerio.load(html, null, false);

  const $p = $("p")
    .filter((_, el) => $(el).text().replace(/&nbsp;/g, " ").trim().length > 0)
    .first();

  if ($p.length === 0) return $.html();

  const firstTextNode = findFirstTextNode($p.get(0)!);
  if (!firstTextNode) return $.html();

  const rawText = (firstTextNode as any).data as string;
  const leadingMatch = rawText.match(/^(\s*)/);
  const leadingWhitespace = leadingMatch ? leadingMatch[1] : "";
  const text = rawText.slice(leadingWhitespace.length);

  if (!text) return $.html();

  const wordMatch = text.match(/^\S+/);
  const ledeText = wordMatch ? wordMatch[0] : text;
  const tailText = text.slice(ledeText.length);

  if (!ledeText) return $.html();

  const firstLetter = ledeText.charAt(0);
  const ledeRemainder = ledeText.slice(1);

  const replacementHtml =
    escapeHtml(leadingWhitespace) +
    `<span class="drop-cap">${escapeHtml(firstLetter)}</span>` +
    `<span class="lede-bold">${escapeHtml(ledeRemainder)}</span>` +
    escapeHtml(tailText);

  $(firstTextNode).replaceWith(replacementHtml);

  return $.html();
}

function findFirstTextNode(node: AnyNode): AnyNode | null {
  if (node.type === "text") {
    const data = (node as any).data as string;
    if (data.trim().length > 0) return node;
    return null;
  }
  const children = (node as any).children as AnyNode[] | undefined;
  if (!children) return null;
  for (const child of children) {
    const found = findFirstTextNode(child);
    if (found) return found;
  }
  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}