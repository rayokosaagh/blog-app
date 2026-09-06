// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const limitParam = Number(searchParams.get('limit'));
  const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], products: [] });
  }

  const like = { contains: query, mode: 'insensitive' as const };

  const postSelect = {
    id: true,
    title: true,
    slug: true,
    featuredImage: true,
  } satisfies Prisma.PostSelect;

  try {
    // Two passes so headline matches always outrank body/tag matches — the
    // dropdown only shows a handful of rows, and a post whose *title* contains
    // the query is nearly always the one being looked for.
    const titleMatches = await prisma.post.findMany({
      where: { published: true, title: like },
      select: postSelect,
      orderBy: { views: 'desc' },
      take,
    });

    const [relatedMatches, products] = await Promise.all([
      titleMatches.length >= take
        ? Promise.resolve([])
        : // Tag and author only - deliberately NOT `content`. Post bodies are
          // stored as HTML, so a substring match there also hits href
          // attributes and embedded related-article links: "samsung" pulled in
          // the Xiaomi and iPhone reviews purely because each linked to a
          // samsung-* URL, and "nothing" matched any post using the word in
          // prose. The /search results page still matches bodies - a five-row
          // type-ahead cannot afford that noise.
          prisma.post.findMany({
            where: {
              published: true,
              id: { notIn: titleMatches.map((p) => p.id) },
              OR: [
                { tags: { some: { name: like } } },
                { author: { name: like } },
              ],
            },
            select: postSelect,
            orderBy: { views: 'desc' },
            take: take - titleMatches.length,
          }),
      prisma.product.findMany({
        where: {
          published: true,
          OR: [{ name: like }, { brand: like }, { tags: { some: { name: like } } }],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          image: true,
        },
        take,
      }),
    ]);

    return NextResponse.json({ results: [...titleMatches, ...relatedMatches], products });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
