#!/bin/bash

# Sitemap Test Script
# Bu script sitemap'leri test eder ve sonuçları gösterir

echo "🧪 Sitemap Test Başlıyor..."
echo ""

BASE_URL="http://localhost:3000"

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📄 Testing: ${name}${NC}"
    echo -e "${BLUE}🔗 URL: ${url}${NC}"
    echo ""
    
    # Check if URL is accessible
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Status: ${http_code} OK${NC}"
        
        # Fetch content
        content=$(curl -s "$url")
        
        # Count URLs
        url_count=$(echo "$content" | grep -o "<loc>" | wc -l | tr -d ' ')
        echo -e "${GREEN}📊 Total URLs: ${url_count}${NC}"
        
        # Check for www.concoro.it consistency
        has_www=$(echo "$content" | grep -c "https://www.concoro.it" || true)
        no_www=$(echo "$content" | grep -c "https://concoro.it" | grep -v "www" || true)
        
        if [ "$has_www" -gt 0 ]; then
            echo -e "${GREEN}✅ Using www.concoro.it: ${has_www} URLs${NC}"
        fi
        
        if [ "$no_www" -gt 0 ]; then
            echo -e "${RED}⚠️  WARNING: Found non-www URLs: ${no_www}${NC}"
        fi
        
        # Show first 3 URLs as sample
        echo -e "${BLUE}📋 Sample URLs:${NC}"
        echo "$content" | grep "<loc>" | head -3 | sed 's/.*<loc>\(.*\)<\/loc>.*/  → \1/'
        
        # Special checks for blog sitemap
        if [[ "$url" == *"/api/sitemap"* ]] && [[ "$url" != *"/concorsi"* ]] && [[ "$url" != *"/tags"* ]]; then
            echo ""
            echo -e "${BLUE}🔍 Blog-specific checks:${NC}"
            
            # Check for expired concorso handling
            yearly_count=$(echo "$content" | grep -c "yearly" || true)
            priority_03=$(echo "$content" | grep -c "0.3" || true)
            
            if [ "$yearly_count" -gt 0 ]; then
                echo -e "${GREEN}✅ Expired concorsi detected: ${yearly_count} with 'yearly' changefreq${NC}"
            fi
            
            if [ "$priority_03" -gt 0 ]; then
                echo -e "${GREEN}✅ Low priority content: ${priority_03} with priority 0.3${NC}"
            fi
            
            # Check for article paths
            articolo_count=$(echo "$content" | grep -c "/articolo/" || true)
            echo -e "${GREEN}✅ Article URLs: ${articolo_count}${NC}"
        fi
        
    else
        echo -e "${RED}❌ Status: ${http_code} - Failed${NC}"
    fi
    
    echo ""
}

# Wait for dev server to be ready
echo "⏳ Waiting for dev server to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200"; then
        echo -e "${GREEN}✅ Dev server is ready!${NC}"
        echo ""
        break
    fi
    attempt=$((attempt + 1))
    sleep 1
    echo -n "."
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Dev server not ready after 30 seconds${NC}"
    echo -e "${YELLOW}💡 Make sure 'npm run dev' is running${NC}"
    exit 1
fi

# Test all sitemaps
test_url "${BASE_URL}/sitemap.xml" "Sitemap Index"
test_url "${BASE_URL}/api/sitemap" "Main & Blog Sitemap"
test_url "${BASE_URL}/api/sitemap/concorsi" "Concorsi Sitemap"
test_url "${BASE_URL}/api/sitemap/tags" "Blog Tags Sitemap"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Test completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Manual checks to do:${NC}"
echo "  1. Open URLs in browser to see full XML"
echo "  2. Check expired concorsi have priority=0.3 and changefreq=yearly"
echo "  3. Check recent articles have priority=0.8 and changefreq=weekly"
echo "  4. Verify all URLs use https://www.concoro.it"
echo ""
echo -e "${BLUE}🔗 Quick links:${NC}"
echo "  • Sitemap Index: ${BASE_URL}/sitemap.xml"
echo "  • Blog Sitemap: ${BASE_URL}/api/sitemap"
echo "  • Concorsi: ${BASE_URL}/api/sitemap/concorsi"
echo "  • Tags: ${BASE_URL}/api/sitemap/tags"
echo ""

