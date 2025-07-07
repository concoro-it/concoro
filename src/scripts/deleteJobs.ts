// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.resolve(process.cwd(), 'concoro-fc095-firebase-adminsdk-fbsvc-a817929655.json');
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
) as ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get Firestore instance
const db = admin.firestore();

// Function to read and parse the CSV file
async function readCSV(filePath: string) {
  try {
    const csvData = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

// Function to delete jobs from Firestore
async function deleteJobs(data: any[]) {
  try {
    
    
    const batchSize = 500;
    let operationsCount = 0;
    let successCount = 0;
    let batch = db.batch();
    
    const concorsiCollection = db.collection('concorsi');
    
    for (const job of data) {
      if (!job.job_id) continue;
      
      const docRef = concorsiCollection.doc(job.job_id);
      batch.delete(docRef);
      
      operationsCount++;
      
      if (operationsCount >= batchSize) {
        await batch.commit();
        
        successCount += operationsCount;
        operationsCount = 0;
        batch = db.batch();
      }
    }
    
    if (operationsCount > 0) {
      await batch.commit();
      
      successCount += operationsCount;
    }
    
    
    return successCount;
  } catch (error) {
    console.error('Error deleting from Firestore:', error);
    throw error;
  }
}

// Main function to execute the script
async function main() {
  try {
    const csvFilePath = path.resolve(process.cwd(), 'polished_job_data-gemma3.csv');
    
    
    const jobData = await readCSV(csvFilePath);
    
    
    const deletedCount = await deleteJobs(jobData);
    
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 