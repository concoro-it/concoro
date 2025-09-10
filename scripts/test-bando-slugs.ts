#!/usr/bin/env ts-node

/**
 * Test script for bando slug generation
 * This script tests the new SEO-friendly URL generation for bando pages
 */

import { 
  generateBandoSlug, 
  getBandoUrl, 
  parseBandoSlug, 
  isValidBandoSlug,
  isFirestoreDocumentId,
  toUrlSafeSlug,
  extractProvincia,
  createTitoloBeve,
  formatPublicationDate
} from '../src/lib/utils/bando-slug-utils'
import { Concorso } from '../src/types/concorso'
import { Timestamp } from 'firebase/firestore'

// Test data
const testConcorso: Concorso = {
  id: '2d157e931ed9421aaac05a59f2ad9f7b',
  Ente: 'Comune di Vigasio',
  AreaGeografica: 'Verona, Veneto',
  Titolo: 'Concorso pubblico per la copertura di n. 1 posto di Istruttore Tecnico, categoria C, posizione economica C1',
  DataApertura: '2025-05-01',
  DataChiusura: Timestamp.fromDate(new Date('2025-06-30')),
  Descrizione: 'Test description for the concorso',
  Valutazione: 'Test evaluation',
  publication_date: '2025-05-22',
  Stato: 'open',
  Link: 'https://example.com/concorso',
  apply_link: 'https://example.com/apply',
  numero_di_posti: 1,
  sommario: 'Test summary',
  titolo_originale: 'Original title',
  concorso_id: 'test-123',
  pdf_links: [],
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
  updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
}

function runTests() {
  console.log('🧪 Testing Bando Slug Generation\n')

  // Test 1: Basic slug generation
  console.log('1. Testing basic slug generation:')
  try {
    const slug = generateBandoSlug(testConcorso)
    console.log('✅ Generated slug:', slug)
    console.log('Expected format: [ente]/[provincia]/[titolo_breve]/[data_pubblicazione]')
    
    const expectedParts = [
      'vigasio', // Ente: "Comune di Vigasio" -> "vigasio"
      'verona',  // AreaGeografica: "Verona, Veneto" -> "verona"
      'istruttore-tecnico', // Short title
      '2025-05-22' // Publication date
    ]
    
    const actualParts = slug.split('/')
    console.log('Expected parts:', expectedParts)
    console.log('Actual parts:', actualParts)
    console.log('')
  } catch (error) {
    console.log('❌ Error generating slug:', error)
  }

  // Test 2: URL generation
  console.log('2. Testing URL generation:')
  try {
    const url = getBandoUrl(testConcorso)
    console.log('✅ Generated URL:', url)
    console.log('Expected: /bandi/vigasio/verona/istruttore-tecnico/2025-05-22')
    console.log('')
  } catch (error) {
    console.log('❌ Error generating URL:', error)
  }

  // Test 3: Slug validation
  console.log('3. Testing slug validation:')
  const validSlug = 'vigasio/verona/istruttore-tecnico/2025-05-22'
  const invalidSlug = 'invalid-slug'
  const documentId = '2d157e931ed9421aaac05a59f2ad9f7b'
  
  console.log(`✅ Valid slug "${validSlug}":`, isValidBandoSlug(validSlug))
  console.log(`❌ Invalid slug "${invalidSlug}":`, isValidBandoSlug(invalidSlug))
  console.log(`🆔 Document ID "${documentId}" is not slug:`, !isValidBandoSlug(documentId))
  console.log('')

  // Test 4: Document ID detection
  console.log('4. Testing document ID detection:')
  console.log(`Document ID "${documentId}":`, isFirestoreDocumentId(documentId))
  console.log(`UUID "550e8400-e29b-41d4-a716-446655440000":`, isFirestoreDocumentId('550e8400-e29b-41d4-a716-446655440000'))
  console.log(`Regular slug "${validSlug}":`, isFirestoreDocumentId(validSlug))
  console.log('')

  // Test 5: Slug parsing
  console.log('5. Testing slug parsing:')
  try {
    const parsed = parseBandoSlug(validSlug)
    console.log('✅ Parsed slug:', parsed)
    console.log('')
  } catch (error) {
    console.log('❌ Error parsing slug:', error)
  }

  // Test 6: Helper functions
  console.log('6. Testing helper functions:')
  console.log('URL safe slug for "Comune di Vigasio":', toUrlSafeSlug('Comune di Vigasio'))
  console.log('Extract provincia from "Verona, Veneto":', extractProvincia('Verona, Veneto'))
  console.log('Extract provincia from "Roma (RM)":', extractProvincia('Roma (RM)'))
  console.log('Create short title from long title:', createTitoloBeve(testConcorso.Titolo || ''))
  console.log('Format publication date:', formatPublicationDate(testConcorso.publication_date))
  console.log('')

  // Test 7: Edge cases
  console.log('7. Testing edge cases:')
  
  const edgeCaseConcorso: Partial<Concorso> = {
    id: 'edge-case-test',
    Ente: 'Azienda Sanitaria Locale ASL Roma 1 - Dipartimento di Prevenzione',
    AreaGeografica: 'Roma - Lazio - Italia',
    Titolo: 'Concorso pubblico per la copertura di n. 5 posti di Dirigente Medico di Igiene degli Alimenti e della Nutrizione, disciplina: Igiene degli Alimenti e della Nutrizione per il Dipartimento di Prevenzione',
    publication_date: undefined,
  }

  try {
    const edgeSlug = generateBandoSlug(edgeCaseConcorso as Concorso)
    console.log('✅ Edge case slug:', edgeSlug)
  } catch (error) {
    console.log('❌ Error with edge case:', error)
  }

  console.log('\n🎉 Tests completed!')
}

if (require.main === module) {
  runTests()
}

export { runTests }
