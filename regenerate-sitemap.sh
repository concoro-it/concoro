#!/bin/bash

# Script to regenerate and validate the sitemap after canonical fixes

echo "🔄 Regenerating and validating sitemap..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Force regenerate sitemap
echo "1️⃣ Forcing sitemap regeneration..."
curl -s "https://www.concoro.it/api/sitemap" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Sitemap regenerated successfully"
else
    echo "❌ Failed to regenerate sitemap"
    exit 1
fi

# Step 2: Validate sitemap
echo ""
echo "2️⃣ Validating sitemap..."
if command -v node &> /dev/null; then
    npx ts-node src/scripts/validate-sitemap.ts
else
    echo "⚠️ Node.js not found, skipping validation script"
fi

# Step 3: Check sample URLs
echo ""
echo "3️⃣ Sample article URLs from sitemap:"
curl -s "https://www.concoro.it/api/sitemap" | grep -o 'https://www.concoro.it/articolo/[^<]*' | head -5

echo ""
echo "4️⃣ Checking for ID-based URLs (should be 0):"
ID_COUNT=$(curl -s "https://www.concoro.it/api/sitemap" | grep -c '/articolo/[a-zA-Z0-9]\{20,\}')
echo "Found $ID_COUNT ID-based URLs"

if [ $ID_COUNT -eq 0 ]; then
    echo "✅ Perfect! No ID-based URLs found in sitemap"
else
    echo "❌ Warning: Found $ID_COUNT ID-based URLs - these should be slug-based"
    echo "Sample ID-based URLs:"
    curl -s "https://www.concoro.it/api/sitemap" | grep -o '/articolo/[a-zA-Z0-9]\{20,\}' | head -3
fi

echo ""
echo "🏁 Sitemap regeneration and validation complete!"

