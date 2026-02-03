
import dotenv from 'dotenv';
import { brevoService } from '../lib/services/brevo';
import { UserProfile } from '../types';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testBrevoIntegration() {
    console.log('🧪 Testing Brevo Integration...');

    if (!process.env.BREVO_API_KEY) {
        console.error('❌ BREVO_API_KEY is not set in environment variables');
        process.exit(1);
    }

    const testEmail = `test.antigravity.${Date.now()}@example.com`;
    console.log(`📧 Using test email: ${testEmail}`);

    const testProfile: UserProfile = {
        id: `test-user-${Date.now()}`,
        email: testEmail,
        firstName: 'Antigravity',
        lastName: 'TestUser',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add required fields to satisfy type if needed, though partial user might work depending on implementation
        role: 'user',
        isStudent: false,
        headline: 'AI Assistant',
        about: 'Testing Brevo integration',
        currentPosition: 'Tester',
        currentCompany: 'DeepMind',
        skills: ['Testing', 'Brevo', 'Integration'],
        languages: [{ language: 'Italian', proficiency: 'Native' }],
        experience: [],
        education: [],
        savedConcorsi: [],
        followedEnti: [],
        notifications: []
    } as unknown as UserProfile; // Cast to avoid complex mocking of all fields

    try {
        // 1. Create Contact
        console.log('\n1️⃣ Creating contact in Brevo...');
        const createResult = await brevoService.createOrUpdateContact(testProfile);
        console.log('✅ Create result:', JSON.stringify(createResult, null, 2));

        // 2. Get Contact
        console.log('\n2️⃣ Retrieving contact from Brevo...');
        // Add a small delay for propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const getResult = await brevoService.getContact(testEmail);
            console.log('✅ Get result:', JSON.stringify(getResult, null, 2));
        } catch (e) {
            console.warn('⚠️ Could not retrieve contact immediately (might be eventual consistency):', onmessage);
        }

        // 3. Delete Contact (Cleanup)
        console.log('\n3️⃣ Deleting test contact...');
        const deleteResult = await brevoService.deleteContact(testEmail);
        console.log('✅ Delete result:', JSON.stringify(deleteResult, null, 2));

        console.log('\n🎉 Brevo Integration Test Completed Successfully!');

    } catch (error: any) {
        console.error('\n❌ Test Failed:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testBrevoIntegration();
