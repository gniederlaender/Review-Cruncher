#!/bin/bash

# ReviewCruncher Analytics Generator
# Generates daily analytics reports using GoAccess

ANALYTICS_DIR="/var/www/html/analytics"
LOG_FILE="/var/log/apache2/reviewcruncher.com_access.log"
OUTPUT_FILE="$ANALYTICS_DIR/reviewcruncher-report.html"
DAILY_FILE="$ANALYTICS_DIR/reviewcruncher-$(date +%Y-%m-%d).html"

# Create analytics directory if it doesn't exist
mkdir -p "$ANALYTICS_DIR"

# Generate main report
goaccess "$LOG_FILE" --log-format=COMBINED --output="$OUTPUT_FILE"

# Generate daily report  
goaccess "$LOG_FILE" --log-format=COMBINED --output="$DAILY_FILE"

# Set proper permissions
chown www-data:www-data "$ANALYTICS_DIR"/*
chmod 644 "$ANALYTICS_DIR"/*

echo "Analytics reports generated:"
echo "- Main: $OUTPUT_FILE"
echo "- Daily: $DAILY_FILE"