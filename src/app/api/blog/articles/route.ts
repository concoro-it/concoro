import { NextRequest, NextResponse } from 'next/server';
import { getAllArticoliServer } from '@/lib/blog/services-server';
import { serializeArticles } from '@/lib/utils/firestore-serialization';

/**
 * GET /api/blog/articles
 * Returns paginated blog articles with Load More approach
 * Query params:
 *   - offset: number of articles to skip (default: 0)
 *   - limit: articles per page (default: 9)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    
    // Validate inputs
    if (offset < 0 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid offset or limit parameter' },
        { status: 400 }
      );
    }
    
    // Fetch articles with offset + limit + 1 to check if there are more
    // We fetch from the beginning and slice because Firestore doesn't have native offset
    const articles = await getAllArticoliServer(offset + limit + 1);
    
    // Filter out placeholder articles
    const validArticles = articles.filter(article => 
      !(article.articolo_title === "Non specificato" && article.articolo_subtitle === "Non specificato")
    );
    
    // Apply offset and limit
    const paginatedArticles = validArticles.slice(offset, offset + limit);
    const hasMore = validArticles.length > offset + limit;
    
    // Serialize for JSON transfer
    const serializedArticles = serializeArticles(paginatedArticles);
    
    return NextResponse.json({
      articles: serializedArticles,
      offset,
      limit,
      hasMore,
      total: paginatedArticles.length,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

