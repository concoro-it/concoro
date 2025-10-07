import { 
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  where,
  Timestamp,
  setDoc,
  updateDoc,
  or,
  and,
} from 'firebase/firestore';
import { db, getFirebaseFirestore } from '@/lib/firebase/config';
import { Articolo, ArticoloWithConcorso } from '@/types';
import { isDocumentId, isSlug, generateSlug } from '@/lib/utils/slug-utils';

/**
 * Fetches all articles ordered by publication date
 */
export const getAllArticoli = async (limitCount?: number): Promise<Articolo[]> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    const articoliQuery = limitCount 
      ? query(articoliRef, orderBy('publication_date', 'desc'), limit(limitCount))
      : query(articoliRef, orderBy('publication_date', 'desc'));
    const snapshot = await getDocs(articoliQuery);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
  } catch (error) {
    console.error('Error fetching articoli:', error);
    throw error;
  }
};

/**
 * Fetches an article by its ID
 */
export const getArticoloById = async (articoloId: string): Promise<Articolo | null> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoloRef = doc(firestore, 'articoli', articoloId);
    const articoloSnap = await getDoc(articoloRef);
    
    if (!articoloSnap.exists()) {
      return null;
    }
    
    return {
      id: articoloSnap.id,
      ...articoloSnap.data(),
    } as Articolo;
  } catch (error) {
    console.error('Error fetching articolo by ID:', error);
    throw error;
  }
};

/**
 * Fetches an article by concorso_id
 */
export const getArticoloByConcorsoId = async (concorsoId: string): Promise<Articolo | null> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoloRef = doc(firestore, 'articoli', concorsoId);
    const articoloSnap = await getDoc(articoloRef);
    
    if (!articoloSnap.exists()) {
      return null;
    }
    
    // Return the article with its ID
    return {
      id: articoloSnap.id,
      ...articoloSnap.data(),
    } as Articolo;
  } catch (error) {
    console.error('Error fetching articolo by concorso_id:', error);
    throw error;
  }
};

/**
 * Fetches an article by concorso_id and includes concorso details
 */
export const getArticoloWithConcorso = async (concorsoId: string): Promise<ArticoloWithConcorso | null> => {
  try {
    const articolo = await getArticoloByConcorsoId(concorsoId);
    
    if (!articolo) {
      return null;
    }
    
    // Fetch the associated concorso
    const firestore = db || getFirebaseFirestore();
    const concorsoRef = doc(firestore, 'concorsi', concorsoId);
    const concorsoSnap = await getDoc(concorsoRef);
    
    if (!concorsoSnap.exists()) {
      return {
        ...articolo,
        concorso: undefined,
      };
    }
    
    return {
      ...articolo,
      concorso: {
        id: concorsoSnap.id,
        ...concorsoSnap.data(),
      },
    } as ArticoloWithConcorso;
  } catch (error) {
    console.error('Error fetching articolo with concorso:', error);
    throw error;
  }
};

/**
 * Fetches articles by tag
 */
export const getArticoliByTag = async (tag: string, limitCount = 50): Promise<Articolo[]> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    const articoliQuery = query(
      articoliRef,
      where('articolo_tags', 'array-contains', tag),
      orderBy('publication_date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(articoliQuery);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articolo));
  } catch (error) {
    console.error('Error fetching articoli by tag:', error);
    throw error;
  }
};

/**
 * Fetches an article by its slug
 */
export const getArticoloBySlug = async (slug: string): Promise<Articolo | null> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    const articoliQuery = query(
      articoliRef,
      where('slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(articoliQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Articolo;
  } catch (error) {
    console.error('Error fetching articolo by slug:', error);
    throw error;
  }
};

/**
 * Fetches an article by slug or ID with fallback logic
 * First tries to fetch by slug, then by ID
 */
export const getArticoloBySlugOrId = async (slugOrId: string): Promise<Articolo | null> => {
  try {
    // First try to fetch by slug if it looks like a slug
    if (isSlug(slugOrId)) {
      const articleBySlug = await getArticoloBySlug(slugOrId);
      if (articleBySlug) {
        return articleBySlug;
      }
    }
    
    // If slug lookup failed or it looks like an ID, try by ID
    if (isDocumentId(slugOrId)) {
      const articleById = await getArticoloById(slugOrId);
      if (articleById) {
        return articleById;
      }
    }
    
    // Final fallback: try both methods regardless of format
    if (!isSlug(slugOrId)) {
      const articleBySlug = await getArticoloBySlug(slugOrId);
      if (articleBySlug) {
        return articleBySlug;
      }
    }
    
    if (!isDocumentId(slugOrId)) {
      const articleById = await getArticoloById(slugOrId);
      if (articleById) {
        return articleById;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching articolo by slug or ID:', error);
    throw error;
  }
};

/**
 * Fetches an article by slug or ID and includes concorso details
 */
export const getArticoloWithConcorsoBySlugOrId = async (slugOrId: string): Promise<ArticoloWithConcorso | null> => {
  try {
    const articolo = await getArticoloBySlugOrId(slugOrId);
    
    if (!articolo) {
      return null;
    }
    
    // Fetch the associated concorso
    const firestore = db || getFirebaseFirestore();
    const concorsoRef = doc(firestore, 'concorsi', articolo.concorso_id);
    const concorsoSnap = await getDoc(concorsoRef);
    
    if (!concorsoSnap.exists()) {
      return {
        ...articolo,
        concorso: undefined,
      };
    }
    
    return {
      ...articolo,
      concorso: {
        id: concorsoSnap.id,
        ...concorsoSnap.data(),
      },
    } as ArticoloWithConcorso;
  } catch (error) {
    console.error('Error fetching articolo with concorso by slug or ID:', error);
    throw error;
  }
};

/**
 * Creates a new article with automatic slug generation
 */
export const createArticleWithSlug = async (articleData: Omit<Articolo, 'id' | 'slug'>): Promise<string> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    
    // Generate slug if article has the required fields
    let slug: string | undefined;
    if (articleData.articolo_tags && articleData.publication_date) {
      slug = generateSlug({
        articolo_tags: articleData.articolo_tags,
        publication_date: articleData.publication_date,
        articolo_title: articleData.articolo_title,
      });
      
      // Ensure slug uniqueness
      let uniqueSlug = slug;
      let counter = 1;
      
      while (true) {
        const existingQuery = query(articoliRef, where('slug', '==', uniqueSlug), limit(1));
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          slug = uniqueSlug;
          break;
        }
        
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
    }
    
    // Create article with slug
    const newArticleDoc = doc(articoliRef);
    const articleWithSlug: Articolo = {
      id: newArticleDoc.id,
      ...articleData,
      slug,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(newArticleDoc, articleWithSlug);
    
    return newArticleDoc.id;
  } catch (error) {
    console.error('Error creating article with slug:', error);
    throw error;
  }
};

/**
 * Updates an existing article and regenerates slug if needed
 */
export const updateArticleWithSlug = async (articleId: string, updates: Partial<Articolo>): Promise<void> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articleRef = doc(firestore, 'articoli', articleId);
    
    // Get current article
    const currentArticle = await getDoc(articleRef);
    if (!currentArticle.exists()) {
      throw new Error('Article not found');
    }
    
    const currentData = currentArticle.data() as Articolo;
    
    // Check if we need to regenerate slug (if tags or title changed)
    const needsSlugUpdate = 
      updates.articolo_tags || 
      updates.articolo_title || 
      (!currentData.slug && currentData.articolo_tags && currentData.publication_date);
    
    let slug = currentData.slug;
    
    if (needsSlugUpdate) {
      const tagsToUse = updates.articolo_tags || currentData.articolo_tags;
      const titleToUse = updates.articolo_title || currentData.articolo_title;
      const dateToUse = updates.publication_date || currentData.publication_date;
      
      if (tagsToUse && dateToUse) {
        slug = generateSlug({
          articolo_tags: tagsToUse,
          publication_date: dateToUse,
          articolo_title: titleToUse,
        });
        
        // Ensure slug uniqueness (exclude current article)
        let uniqueSlug = slug;
        let counter = 1;
        
        while (true) {
          const existingQuery = query(
            collection(firestore, 'articoli'), 
            where('slug', '==', uniqueSlug), 
            limit(1)
          );
          const existingSnapshot = await getDocs(existingQuery);
          
          if (existingSnapshot.empty || existingSnapshot.docs[0].id === articleId) {
            slug = uniqueSlug;
            break;
          }
          
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
      }
    }
    
    // Update article
    await updateDoc(articleRef, {
      ...updates,
      slug,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating article with slug:', error);
    throw error;
  }
};

/**
 * Gets all unique tags across all articles
 */
export const getAllArticoloTags = async (): Promise<string[]> => {
  try {
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    const snapshot = await getDocs(articoliRef);
    
    if (snapshot.empty) {
      return [];
    }
    
    const allTags = new Set<string>();
    snapshot.docs.forEach(doc => {
      const articolo = doc.data() as Articolo;
      if (articolo.articolo_tags && Array.isArray(articolo.articolo_tags)) {
        articolo.articolo_tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags);
  } catch (error) {
    console.error('Error fetching all articolo tags:', error);
    throw error;
  }
};

/**
 * Updates article metadata with concorso categorization data
 */
export const updateArticleMetadata = async (articleId: string, concorsoId: string): Promise<void> => {
  try {
    const firestore = db || getFirebaseFirestore();
    
    // Fetch concorso data
    const concorsoRef = doc(firestore, 'concorsi', concorsoId);
    const concorsoSnap = await getDoc(concorsoRef);
    
    if (!concorsoSnap.exists()) {
      console.warn(`Concorso ${concorsoId} not found for article ${articleId}`);
      return;
    }
    
    const concorsoData = concorsoSnap.data();
    
    // Prepare update data - only include fields that have values
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (concorsoData.categoria && concorsoData.categoria !== 'undefined') {
      updateData.categoria = concorsoData.categoria;
    }
    
    if (concorsoData.settore_professionale && concorsoData.settore_professionale !== 'undefined') {
      updateData.settore_professionale = concorsoData.settore_professionale;
    }
    
    if (concorsoData.AreaGeografica && concorsoData.AreaGeografica !== 'undefined') {
      updateData.AreaGeografica = concorsoData.AreaGeografica;
    }
    
    // Update article with metadata
    const articleRef = doc(firestore, 'articoli', articleId);
    await updateDoc(articleRef, updateData);
  } catch (error) {
    console.error('Error updating article metadata:', error);
    throw error;
  }
};

/**
 * Fetches related articles based on categoria, settore_professionale, or AreaGeografica
 */
export const getRelatedArticoli = async (
  currentArticleId: string,
  categoria?: string,
  settore_professionale?: string,
  AreaGeografica?: string,
  limitCount = 3
): Promise<Articolo[]> => {
  try {
    // Sanitize input parameters - convert string 'undefined' to actual undefined
    const sanitizedCategoria = categoria === 'undefined' || !categoria ? undefined : categoria;
    const sanitizedSettore = settore_professionale === 'undefined' || !settore_professionale ? undefined : settore_professionale;
    const sanitizedArea = AreaGeografica === 'undefined' || !AreaGeografica ? undefined : AreaGeografica;
    
    
    
    const firestore = db || getFirebaseFirestore();
    const articoliRef = collection(firestore, 'articoli');
    
    // Build query conditions for matching metadata
    const conditions = [];
    
    if (sanitizedCategoria) {
      conditions.push(where('categoria', '==', sanitizedCategoria));
    }
    if (sanitizedSettore) {
      conditions.push(where('settore_professionale', '==', sanitizedSettore));
    }
    if (sanitizedArea) {
      conditions.push(where('AreaGeografica', '==', sanitizedArea));
    }
    
    
    
    if (conditions.length === 0) {
      
      return [];
    }
    
    // Create query with OR conditions to find articles with matching metadata
    let relatedArticles: Articolo[] = [];
    
    // Try each condition separately since Firestore has limitations on OR queries
    for (const condition of conditions) {
      try {
        const articoliQuery = query(
          articoliRef,
          condition,
          orderBy('publication_date', 'desc'),
          limit(limitCount * 2) // Get more than needed to filter duplicates
        );
        
        const snapshot = await getDocs(articoliQuery);
        const articles = snapshot.docs
          .filter(doc => doc.id !== currentArticleId) // Filter out current article
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Articolo));
        
        
        relatedArticles = [...relatedArticles, ...articles];
      } catch (error) {
        console.warn('Error in related articles query condition:', error);
        continue;
      }
    }
    
    // Remove duplicates and limit results
    const uniqueArticles = relatedArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.id === article.id) && article.id !== currentArticleId
    );
    
    
    
    // Sort by publication date and limit
    const result = uniqueArticles
      .sort((a, b) => {
        const dateA = a.publication_date?.toDate?.() || new Date(a.publication_date as any);
        const dateB = b.publication_date?.toDate?.() || new Date(b.publication_date as any);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limitCount);
      
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching related articoli:', error);
    return [];
  }
}; 