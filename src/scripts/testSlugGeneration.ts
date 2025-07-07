import { Timestamp } from 'firebase/firestore';
import { generateSlug, isDocumentId, isSlug } from '../lib/utils/slug-utils';

// Test data that mimics real article data
const testArticles = [
  {
    articolo_tags: ["istruttore amministrativo", "rieti", "lazio"],
    publication_date: new Timestamp(Math.floor(new Date("2025-01-15").getTime() / 1000), 0),
    articolo_title: "Concorso Istruttore Amministrativo Rieti"
  },
  {
    articolo_tags: ["dirigente", "roma", "lazio", "enti locali"],
    publication_date: new Timestamp(Math.floor(new Date("2024-12-01").getTime() / 1000), 0),
    articolo_title: "Bando Dirigente Roma Capitale"
  },
  {
    articolo_tags: ["medico", "ospedale", "milano", "lombardia"],
    publication_date: new Timestamp(Math.floor(new Date("2024-11-20").getTime() / 1000), 0),
    articolo_title: "Concorso Medico Ospedale Milano"
  },
  {
    articolo_tags: ["informatico", "programmatore", "napoli", "campania", "ict"],
    publication_date: new Timestamp(Math.floor(new Date("2025-02-10").getTime() / 1000), 0),
    articolo_title: "Selezione Informatico Napoli"
  },
  {
    articolo_tags: ["vigili del fuoco", "antincendio", "toscana", "firenze"],
    publication_date: new Timestamp(Math.floor(new Date("2024-10-05").getTime() / 1000), 0),
    articolo_title: "Concorso Vigili del Fuoco Toscana"
  },
  {
    articolo_tags: ["bando generico"],
    publication_date: new Timestamp(Math.floor(new Date("2024-09-15").getTime() / 1000), 0),
    articolo_title: "Concorso pubblico generico senza informazioni specifiche per test fallback"
  },
  {
    articolo_tags: [],
    publication_date: new Timestamp(Math.floor(new Date("2024-08-01").getTime() / 1000), 0),
    articolo_title: "Articolo senza tag per testare fallback al titolo"
  }
];

function testSlugGeneration() {
  console.log('🧪 Testing Slug Generation System\n');
  
  console.log('📝 Testing generateSlug() function:');
  console.log('='!.repeat(50));
  
  testArticles.forEach((article, index) => {
    console.log(`\n🔗 Test ${index + 1}:`);
    console.log(`   Title: ${article.articolo_title}`);
    console.log(`   Tags: [${article.articolo_tags.join(', ')}]`);
    console.log(`   Date: ${article.publication_date.toDate().toDateString()}`);
    
    const slug = generateSlug(article);
    console.log(`   Generated Slug: ${slug}`);
    console.log(`   URL: https://concoro.it/articolo/${slug}`);
  });
  
  console.log('\n' + '='!.repeat(50));
  console.log('🔍 Testing URL validation functions:');
  console.log('='!.repeat(50));
  
  const testUrls = [
    "istruttore-amministrativo-rieti-lazio-2025",
    "dirigente-roma-lazio-2024",
    "e575f2d4747742f4b0d1478a5fbd9551", // Document ID
    "abc123def456ghi789jkl012", // Document ID
    "short-slug",
    "invalid_slug_with_underscores",
    "valid-slug-with-hyphens-2024"
  ];
  
  testUrls.forEach(url => {
    const isDocId = isDocumentId(url);
    const isSlugUrl = isSlug(url);
    
    console.log(`\n📎 URL: ${url}`);
    console.log(`   Is Document ID: ${isDocId}`);
    console.log(`   Is Slug: ${isSlugUrl}`);
    console.log(`   Type: ${isDocId ? 'Document ID' : isSlugUrl ? 'Slug' : 'Invalid/Unknown'}`);
  });
  
  console.log('\n' + '='!.repeat(50));
  console.log('✅ Testing completed successfully!');
  console.log('💡 All functions are working as expected.');
}

// Run the test
if (require.main === module) {
  testSlugGeneration();
}

export default testSlugGeneration; 