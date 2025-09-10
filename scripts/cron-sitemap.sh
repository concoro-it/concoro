#!/bin/bash

# Automated Sitemap Generation Cron Script
# Add to crontab with: 0 */6 * * * /path/to/your/project/scripts/cron-sitemap.sh

# Configuration
PROJECT_DIR="/path/to/your/concoro/project"
LOG_FILE="$PROJECT_DIR/logs/sitemap-cron.log"
SITEMAP_URL="https://www.concoro.it/api/sitemap"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting automated sitemap generation..."

# Change to project directory
cd "$PROJECT_DIR" || {
    log "ERROR: Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

# Generate static sitemap
log "Generating static sitemap..."
if npm run generate-sitemap >> "$LOG_FILE" 2>&1; then
    log "Static sitemap generated successfully"
else
    log "ERROR: Failed to generate static sitemap"
    exit 1
fi

# Check if sitemap exists and is valid
if [ -f "public/sitemap-static.xml" ]; then
    # Get file size to ensure it's not empty
    FILESIZE=$(stat -f%z "public/sitemap-static.xml" 2>/dev/null || stat -c%s "public/sitemap-static.xml" 2>/dev/null)
    if [ "$FILESIZE" -gt 100 ]; then
        log "Sitemap file is valid (size: $FILESIZE bytes)"
    else
        log "WARNING: Sitemap file is too small (size: $FILESIZE bytes)"
    fi
else
    log "ERROR: Sitemap file was not created"
    exit 1
fi

# Ping search engines about the dynamic sitemap
log "Pinging search engines..."

# Google
if curl -s "https://www.google.com/ping?sitemap=$SITEMAP_URL" >> "$LOG_FILE" 2>&1; then
    log "Successfully pinged Google"
else
    log "WARNING: Failed to ping Google"
fi

# Bing
if curl -s "https://www.bing.com/ping?sitemap=$SITEMAP_URL" >> "$LOG_FILE" 2>&1; then
    log "Successfully pinged Bing"
else
    log "WARNING: Failed to ping Bing"
fi

# Cleanup old log files (keep last 7 days)
find "$(dirname "$LOG_FILE")" -name "sitemap-cron.log*" -mtime +7 -delete 2>/dev/null || true

log "Automated sitemap generation completed successfully"

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"Sitemap updated successfully on concoro.it"}' \
#     YOUR_SLACK_WEBHOOK_URL

echo "Sitemap generation completed. Check $LOG_FILE for details."

