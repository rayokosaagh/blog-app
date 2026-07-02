import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
      },
      take: 5,
    });

    return NextResponse.json({ results: posts });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}