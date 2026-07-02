import type { Tag } from "@/generated/prisma";

/**
 * Sorts a post's tags according to the order they were selected in the
 * tag picker (stored on `post.tagOrder`). Falls back gracefully:
 * - Tags present in `tagOrder` are sorted by their position in that array.
 * - Any tag missing from `tagOrder` (e.g. added before this feature existed,
 *   or tagOrder is empty/stale) is appended at the end in its original order.
 */
export function sortTagsByOrder<T extends Pick<Tag, "id">>(
  tags: T[],
  tagOrder: string[] | null | undefined
): T[] {
  if (!tagOrder || tagOrder.length === 0) return tags;

  const positionById = new Map(tagOrder.map((id, index) => [id, index]));

  return [...tags].sort((a, b) => {
    const posA = positionById.has(a.id) ? positionById.get(a.id)! : Infinity;
    const posB = positionById.has(b.id) ? positionById.get(b.id)! : Infinity;
    if (posA === posB) return 0;
    return posA - posB;
  });
}