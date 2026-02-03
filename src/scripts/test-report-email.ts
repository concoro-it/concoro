
import dotenv from 'dotenv';
import { brevoService } from '../lib/services/brevo';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testReportEmail() {
    console.log('🧪 Testing Report Email (Segnalazione)...');

    if (!process.env.BREVO_API_KEY) {
        console.error('❌ BREVO_API_KEY is not set in environment variables');
        process.exit(1);
    }

    const testData = {
        name: 'Antigravity Tester',
        email: 'test.reporter@example.com', // Reply-to will be this
        issueType: 'link-non-funzionante',
        description: 'This is an automated test for the Segnalazione feature migration to Brevo.',
        details: 'Testing if this email arrives at info@concoro.it via Brevo transactional API.',
        concorsoId: 'TEST-12345',
        concorsoTitle: 'Concorso di Prova Automatica',
        concorsoEnte: 'Ente di Test',
        timestamp: new Date().toISOString(),
        issueInfo: {
            label: 'Link non funzionante',
            tag: 'BROKEN_LINK',
            priority: 'MEDIUM'
        }
    };

    try {
        console.log('📤 Sending report email...');
        const result = await brevoService.sendReportEmail(testData);
        console.log('✅ Email sent successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));

        console.log('\nℹ️  Check info@concoro.it inbox to verify receipt.');

    } catch (error: any) {
        console.error('\n❌ Sending Failed:', error);
    }
}

testReportEmail();
