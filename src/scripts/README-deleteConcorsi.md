# Concorsi Bulk Deletion Script

This script allows you to safely bulk delete concorsi from your Firebase database within a specific date range.

## Current Configuration

- **Date Range**: June 13, 2025 to today
- **Target Collection**: `concorsi`
- **Date Fields Used** (in priority order):
  1. `publication_date`
  2. `createdAt` 
  3. `DataApertura`

## Safety Features

### 1. Dry Run Mode (RECOMMENDED FIRST STEP)
Always run a dry run first to see what would be deleted:

```bash
npm run delete-concorsi-dry-run
```

This will:
- ✅ Analyze all concorsi in the database
- ✅ Show how many would be deleted vs skipped
- ✅ Display sample records that would be deleted
- ✅ **NOT delete anything**

### 2. Interactive Confirmation
When running the actual deletion, the script requires:
- Manual confirmation by typing "YES"
- Clear warnings about data loss

## Usage

### Step 1: Dry Run (Required)
```bash
npm run delete-concorsi-dry-run
```

Review the output carefully. Check:
- Number of concorsi that would be deleted
- Sample records to verify they're the correct ones
- Date sources being used for filtering

### Step 2: Actual Deletion (Only if dry run looks correct)
```bash
npm run delete-concorsi
```

Follow the prompts and type "YES" when asked for confirmation.

## How It Works

1. **Date Parsing**: The script handles multiple date formats:
   - Firebase Timestamps (`{seconds: number, nanoseconds: number}`)
   - String dates
   - Date objects

2. **Filtering Logic**: 
   - Uses the first available date field in this order: `publication_date` → `createdAt` → `DataApertura`
   - Only deletes concorsi where the date falls between June 13, 2024 (00:00:00) and today (23:59:59)

3. **Batch Processing**: 
   - Processes deletions in batches of 500 for efficiency
   - Provides progress updates during execution

## Important Notes

⚠️ **BACKUP YOUR DATA**: This operation is irreversible. Consider creating a backup before running.

⚠️ **TEST ENVIRONMENT**: If possible, test on a development database first.

⚠️ **Review Dry Run**: Always check the dry run results carefully before proceeding.

## Customizing Date Range

To change the date range, edit the following lines in `src/scripts/deleteConcorsiByDateRange.ts`:

```typescript
// Set the date range: June 13th, 2025 to today
const startDate = new Date('2025-06-13');  // Change this date
startDate.setHours(0, 0, 0, 0);

const endDate = new Date();  // Change to specific end date if needed
endDate.setHours(23, 59, 59, 999);
```

## Troubleshooting

### Common Issues:

1. **Firebase Connection Error**: Ensure your service account JSON file exists at the project root
2. **No Concorsi Found**: Check that the collection name is correct and contains data
3. **Date Parsing Errors**: The script will skip documents with invalid dates and report them

### Support:
If you encounter issues, check the console output for detailed error messages. The script provides comprehensive logging for debugging. 