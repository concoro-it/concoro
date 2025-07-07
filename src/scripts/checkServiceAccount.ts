import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Load service account
    const serviceAccountPath = path.resolve(process.cwd(), 'concoro-974d9273d7dc.json');
    
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
    
    
    try {
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      
      // Check for required fields
      
      const requiredFields = [
        'type', 
        'project_id', 
        'private_key_id', 
        'private_key', 
        'client_email', 
        'client_id', 
        'auth_uri', 
        'token_uri', 
        'auth_provider_x509_cert_url', 
        'client_x509_cert_url'
      ];
      
      for (const field of requiredFields) {
        const exists = field in serviceAccount;
        const value = exists ? 
          (field === 'private_key' ? '[REDACTED]' : serviceAccount[field]) : 
          'MISSING';
        
      }
      
      // Check if it's a valid service account
      if (serviceAccount.type !== 'service_account') {
        
        
      }
      
      // Check for project_id vs projectId
      
      
      
      
      
      
      // Print first few characters of private key to verify format
      if (serviceAccount.private_key) {
        const keyPreview = serviceAccount.private_key.substring(0, 27);
        
        if (!keyPreview.includes('-----BEGIN PRIVATE KEY-----')) {
          
        }
      }
      
    } catch (error) {
      console.error('Error parsing service account JSON:', error);
    }
    
  } catch (error) {
    console.error('Error in diagnostic script:', error);
  }
}

main(); 