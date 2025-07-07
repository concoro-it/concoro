import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export function SimpleFaviconTest() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [isLoading, setIsLoading] = useState(false);

  const testFaviconUpload = async () => {
    setIsLoading(true);
    setStatus('Testing favicon upload...');

    try {
      // Test uploading a simple test image
      setStatus('Creating test image blob...');
      
      // Create a simple 16x16 red square as a test favicon
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 16, 16);
      }
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      setStatus('Uploading to Firebase Storage...');
      
      // Check if storage is available
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `images/favicons/test-favicon-${Date.now()}.png`);
      const uploadResult = await uploadBytes(storageRef, blob);
      
      setStatus('Getting download URL...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      setStatus(`✅ SUCCESS! Favicon uploaded successfully!`);
      console.log('Download URL:', downloadURL);
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`❌ ERROR: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-semibold mb-3">🧪 Simple Favicon Upload Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        This test creates a simple red square favicon and uploads it to Firebase Storage to verify the storage rules are working.
      </p>
      
      <Button 
        onClick={testFaviconUpload} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Upload'}
      </Button>
      
      <div className="mt-4 p-3 bg-white rounded border">
        <strong>Status:</strong> {status}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <strong>After successful upload:</strong>
        <ul className="list-disc list-inside mt-2">
          <li>Check Firebase Console → Storage → images/favicons/</li>
          <li>You should see a test-favicon-[timestamp].png file</li>
          <li>The download URL will be logged to browser console</li>
        </ul>
      </div>
    </div>
  );
} 