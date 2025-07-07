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

// Italian month names mapping
const italianMonths: { [key: string]: number } = {
  'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
  'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
  'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
};

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

// Function to parse date string
function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  try {
    // Clean the input string
    dateStr = dateStr.trim();
    
    // Parse Italian format: "DD Mese YYYY HH:MM"
    const italianFormatRegex = /(\d{1,2})\s+([A-Za-zà]{3,})\s+(\d{4})\s+(\d{2}):(\d{2})/i;
    const match = dateStr.match(italianFormatRegex);
    
    if (match) {
      const [_, day, monthStr, year, hours, minutes] = match;
      // Convert first letter to lowercase for matching with italianMonths
      const normalizedMonth = monthStr.toLowerCase();
      const month = italianMonths[normalizedMonth];
      
      if (month !== undefined) {
        const date = new Date(
          parseInt(year),
          month,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        
        // Validate the parsed date
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // If that fails, try parsing as ISO string
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    // If that fails, try parsing DD/MM/YYYY format
    const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
    if (day && month && year) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    console.warn(`Unable to parse date string: ${dateStr}`);
    return null;
  } catch (error) {
    console.warn(`Error parsing date: ${dateStr}`, error);
    return null;
  }
}

// Function to determine if a date is in the past
function isDatePassed(dateStr: string): boolean {
  const date = parseDate(dateStr);
  if (!date) return true; // If no valid date provided, consider it closed
  
  // Get current time in UTC
  const now = new Date();
  
  // Compare the timestamps directly
  return date.getTime() < now.getTime();
}

// Function to process job data before upload
function processJobData(job: any) {
  // Convert string fields that should be numbers
  if (job.numero_posti) {
    job.numero_posti = parseInt(job.numero_posti, 10) || 0;
  }

  // Convert date strings to Firestore timestamps
  const openingDate = parseDate(job.data_apertura);
  const closingDate = parseDate(job.data_scadenza);

  if (openingDate) {
    job.data_apertura = admin.firestore.Timestamp.fromDate(openingDate);
  }
  if (closingDate) {
    job.data_scadenza = admin.firestore.Timestamp.fromDate(closingDate);
  }

  // Keep the original stato if it exists, otherwise compute it
  if (!job.stato) {
    job.stato = isDatePassed(job.data_scadenza) ? 'Chiuso' : 'Aperto';
  }

  // Add timestamps for document tracking
  job.createdAt = admin.firestore.FieldValue.serverTimestamp();
  job.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  return job;
}

// Function to upload jobs to Firestore
async function uploadJobs(data: any[]) {
  try {
    
    
    const batchSize = 500;
    let operationsCount = 0;
    let successCount = 0;
    let batch = db.batch();
    
    const jobsCollection = db.collection('jobs');
    
    for (const job of data) {
      if (!job.job_id) continue;
      
      const docRef = jobsCollection.doc(job.job_id);
      const processedJob = processJobData(job);
      
      batch.set(docRef, processedJob);
      
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
    console.error('Error uploading to Firestore:', error);
    throw error;
  }
}

// Main function to execute the script
async function main() {
  try {
    const csvFilePath = path.resolve(process.cwd(), 'polished_job_data-gemma3.csv');
    
    
    const jobData = await readCSV(csvFilePath);
    
    
    const uploadedCount = await uploadJobs(jobData);
    
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 