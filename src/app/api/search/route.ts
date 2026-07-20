// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const limitParam = Number(searchParams.get('limit'));
  const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 5;

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [posts, products] = await Promise.all([
      prisma.post.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImage: true,
        },
        take,
      }),
      prisma.product.findMany({
        where: {
          published: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
          ],
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

    return NextResponse.json({ results: posts, products });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}