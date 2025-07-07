/**
 * Brevo Contact Attributes Setup Script
 * 
 * This script helps you understand what attributes need to be created
 * in your Brevo dashboard for the Concoro integration.
 * 
 * Run this script to see the complete list of attributes and their types.
 */

interface BrevoAttribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  description: string;
  required?: boolean;
}

const BREVO_ATTRIBUTES: BrevoAttribute[] = [
  // Basic Information
  {
    name: 'FIRSTNAME',
    type: 'text',
    description: 'User\'s first name',
    required: true
  },
  {
    name: 'LASTNAME',
    type: 'text',
    description: 'User\'s last name',
    required: true
  },
  
  // Location & Demographics
  {
    name: 'REGION',
    type: 'text',
    description: 'User\'s region in Italy'
  },
  {
    name: 'CITY',
    type: 'text',
    description: 'User\'s city'
  },
  {
    name: 'LOCATION',
    type: 'text',
    description: 'Combined location string (City, Region)'
  },
  {
    name: 'IS_STUDENT',
    type: 'boolean',
    description: 'Whether the user is a student'
  },
  
  // Professional Information
  {
    name: 'HEADLINE',
    type: 'text',
    description: 'User\'s professional headline'
  },
  {
    name: 'CURRENT_POSITION',
    type: 'text',
    description: 'Current job title'
  },
  {
    name: 'CURRENT_COMPANY',
    type: 'text',
    description: 'Current employer'
  },
  {
    name: 'YEARS_OF_EXPERIENCE',
    type: 'number',
    description: 'Calculated years of professional experience'
  },
  {
    name: 'LATEST_POSITION',
    type: 'text',
    description: 'Most recent position title and company'
  },
  {
    name: 'LATEST_EDUCATION',
    type: 'text',
    description: 'Most recent education details'
  },
  
  // Contact Information
  {
    name: 'PHONE',
    type: 'text',
    description: 'User\'s phone number'
  },
  {
    name: 'WEBSITE',
    type: 'text',
    description: 'User\'s website URL'
  },
  {
    name: 'ABOUT',
    type: 'text',
    description: 'User\'s bio/about section'
  },
  
  // Skills & Qualifications
  {
    name: 'SKILLS',
    type: 'text',
    description: 'Comma-separated list of skills'
  },
  {
    name: 'LANGUAGES',
    type: 'text',
    description: 'Comma-separated list of languages with proficiency levels'
  },
  {
    name: 'EDUCATION_COUNT',
    type: 'number',
    description: 'Number of education entries'
  },
  {
    name: 'EXPERIENCE_COUNT',
    type: 'number',
    description: 'Number of experience entries'
  },
  {
    name: 'CERTIFICATIONS_COUNT',
    type: 'number',
    description: 'Number of certifications'
  },
  
  // Preferences & Interests
  {
    name: 'PREFERRED_REGIONS',
    type: 'text',
    description: 'Comma-separated list of preferred regions for job opportunities'
  },
  {
    name: 'SECTOR_INTERESTS',
    type: 'text',
    description: 'Comma-separated list of sector interests'
  },
  
  // System Information
  {
    name: 'CREATED_AT',
    type: 'date',
    description: 'Profile creation timestamp'
  },
  {
    name: 'UPDATED_AT',
    type: 'date',
    description: 'Last profile update timestamp'
  },
  {
    name: 'PROFILE_COMPLETE',
    type: 'boolean',
    description: 'Whether the profile is complete for job matching'
  }
];

/**
 * Display the attributes in a formatted way
 */
function displayAttributes() {
  console.log('📋 Brevo Contact Attributes for Concoro Integration\n');
  console.log('You need to create these custom attributes in your Brevo dashboard:\n');
  
  const groupedAttributes = {
    'Basic Information': BREVO_ATTRIBUTES.filter(attr => 
      ['FIRSTNAME', 'LASTNAME'].includes(attr.name)
    ),
    'Location & Demographics': BREVO_ATTRIBUTES.filter(attr => 
      ['REGION', 'CITY', 'LOCATION', 'IS_STUDENT'].includes(attr.name)
    ),
    'Professional Information': BREVO_ATTRIBUTES.filter(attr => 
      ['HEADLINE', 'CURRENT_POSITION', 'CURRENT_COMPANY', 'YEARS_OF_EXPERIENCE', 'LATEST_POSITION', 'LATEST_EDUCATION'].includes(attr.name)
    ),
    'Contact Information': BREVO_ATTRIBUTES.filter(attr => 
      ['PHONE', 'WEBSITE', 'ABOUT'].includes(attr.name)
    ),
    'Skills & Qualifications': BREVO_ATTRIBUTES.filter(attr => 
      ['SKILLS', 'LANGUAGES', 'EDUCATION_COUNT', 'EXPERIENCE_COUNT', 'CERTIFICATIONS_COUNT'].includes(attr.name)
    ),
    'Preferences & Interests': BREVO_ATTRIBUTES.filter(attr => 
      ['PREFERRED_REGIONS', 'SECTOR_INTERESTS'].includes(attr.name)
    ),
    'System Information': BREVO_ATTRIBUTES.filter(attr => 
      ['CREATED_AT', 'UPDATED_AT', 'PROFILE_COMPLETE'].includes(attr.name)
    )
  };

  Object.entries(groupedAttributes).forEach(([groupName, attributes]) => {
    console.log(`\n🏷️  ${groupName}:`);
    console.log('─'.repeat(50));
    
    attributes.forEach(attr => {
      const required = attr.required ? ' (REQUIRED)' : '';
      console.log(`• ${attr.name} [${attr.type.toUpperCase()}]${required}`);
      console.log(`  ${attr.description}`);
    });
  });

  console.log('\n📝 Setup Instructions:');
  console.log('1. Log in to your Brevo dashboard');
  console.log('2. Go to Contacts > Settings > Contact attributes');
  console.log('3. Create each attribute with the specified name and type');
  console.log('4. Make sure attribute names match exactly (case-sensitive)');
  console.log('\n✅ Once created, your Concoro integration will automatically');
  console.log('   populate these attributes when users complete their profiles.');
}

/**
 * Generate a CSV for easy import (if Brevo supports it)
 */
function generateCSV() {
  console.log('\n📄 CSV Format for Attributes:');
  console.log('Name,Type,Description,Required');
  
  BREVO_ATTRIBUTES.forEach(attr => {
    const required = attr.required ? 'Yes' : 'No';
    console.log(`"${attr.name}","${attr.type}","${attr.description}","${required}"`);
  });
}

/**
 * Validate environment setup
 */
function validateSetup() {
  console.log('\n🔧 Environment Validation:');
  
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log('❌ BREVO_API_KEY not found in environment variables');
    console.log('   Add BREVO_API_KEY=your_api_key to your .env.local file');
  } else {
    console.log('✅ BREVO_API_KEY found in environment');
    console.log(`   Key starts with: ${apiKey.substring(0, 8)}...`);
  }
}

// Main execution
if (require.main === module) {
  displayAttributes();
  generateCSV();
  validateSetup();
  
  console.log('\n🚀 For more information, see: src/lib/services/BREVO_INTEGRATION.md');
}

export { BREVO_ATTRIBUTES, displayAttributes, generateCSV, validateSetup }; 