#!/bin/bash
# ReviewCruncher Analytics Generator
# Run this daily to generate traffic analytics

LOG_FILE="/var/log/apache2/reviewcruncher.com_access.log"
OUTPUT_DIR="/opt/Review-Cruncher/analytics"
DATE=$(date +%Y-%m-%d)

# Create analytics directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate GoAccess report
echo "Generating ReviewCruncher analytics for $DATE..."
goaccess "$LOG_FILE" \
    --log-format=COMBINED \
    --output="$OUTPUT_DIR/analytics-$DATE.html" \
    --real-time-html \
    --ws-url=wss://reviewcruncher.com:7890

# Generate summary stats
echo "=== ReviewCruncher Traffic Summary - $DATE ===" > "$OUTPUT_DIR/summary-$DATE.txt"
echo "Total requests today: $(grep "$(date +%d/%b/%Y)" "$LOG_FILE" | wc -l)" >> "$OUTPUT_DIR/summary-$DATE.txt"
echo "Unique IPs today: $(grep "$(date +%d/%b/%Y)" "$LOG_FILE" | awk '{print $1}' | sort | uniq | wc -l)" >> "$OUTPUT_DIR/summary-$DATE.txt"
echo "Top 5 IPs:" >> "$OUTPUT_DIR/summary-$DATE.txt"
grep "$(date +%d/%b/%Y)" "$LOG_FILE" | awk '{print $1}' | sort | uniq -c | sort -nr | head -5 >> "$OUTPUT_DIR/summary-$DATE.txt"

echo "Analytics generated in $OUTPUT_DIR/"