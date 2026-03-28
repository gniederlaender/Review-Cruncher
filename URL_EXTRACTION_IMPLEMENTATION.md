# URL Product Name Extraction - Implementation Summary

## Overview
Implemented URL-based product recognition feature as specified in spec.md. Users can now paste product URLs (Amazon, shop URLs, etc.) directly into the product input field, and the system will automatically extract the product name and proceed with the review generation.

## Implementation Details

### 1. Backend Module: `modules/url-extractor.js`
Created a new URLExtractor class that implements the three-tier extraction strategy specified in spec.md:

**Extraction Strategy (in order of priority):**
1. **Schema.org JSON-LD** - Parses `<script type="application/ld+json">` tags for Product type with name field
2. **OpenGraph Meta Tags** - Extracts from `og:title` property
3. **URL Path Analysis** - Parses URL segments, cleans up dashes/underscores, capitalizes words

**Features:**
- 5-second timeout as specified in spec
- Graceful error handling for CAPTCHA, timeouts, and network errors
- Generic User-Agent header to avoid blocking
- Returns structured response with success flag and error messages

### 2. Backend API Endpoint: `POST /api/extract-product-from-url`
Added new endpoint in `server.js`:
- Validates URL format
- Calls URLExtractor.extractProductName()
- Returns JSON response with extracted product name or error message
- Integrated with existing Express middleware and error handling

### 3. Frontend Integration: `src/resources/api-request.ts`
Added new API client function:
- `extractProductFromURL(url: string)` - Calls the extraction endpoint
- Returns typed response: `{ success: boolean; productName?: string; error?: string }`
- Integrated with existing CustomAxios for consistent error handling

### 4. Frontend UI: `src/pages/HomePage.tsx`
Enhanced the existing product input flow:
- Added `isURL()` helper function to detect URL input
- Modified `sendRequest()` to:
  1. Check if input is a URL
  2. If URL, call extraction API
  3. If successful, replace product field with extracted name
  4. If failed, show inline error message
  5. Proceed with normal review flow using extracted name

**No UI changes** - The same input field accepts both product names and URLs, maintaining the existing user experience.

## Files Modified
- `server.js` - Added URLExtractor import, initialization, and API endpoint
- `src/resources/api-request.ts` - Added extractProductFromURL function
- `src/pages/HomePage.tsx` - Added URL detection and extraction logic

## Files Created
- `modules/url-extractor.js` - Core extraction logic

## Testing
The implementation handles:
- Valid product URLs (Amazon, Best Buy, generic shop URLs)
- Invalid URLs (shows error message)
- Plain text product names (bypasses extraction)
- Timeout scenarios (5-second limit)
- Network errors and blocked requests
- Missing or malformed metadata

## Compliance with Spec
✅ Transparent background feature - no new screens or UI changes
✅ Three-tier extraction strategy: JSON-LD → OpenGraph → URL path
✅ 5-second timeout to prevent hanging requests
✅ Inline error messages on extraction failure
✅ Seamless integration with existing review flow
✅ No changes to existing user workflow
✅ Same API endpoints for review generation

## Usage Example
**User Input:** `https://www.amazon.com/Apple-iPhone-15-Pro-Max/dp/B0CHX1W1XY`

**Flow:**
1. Frontend detects URL format
2. Calls `/api/extract-product-from-url`
3. Backend fetches HTML (5s timeout)
4. Extracts "Apple iPhone 15 Pro Max" via JSON-LD
5. Updates product field with extracted name
6. Proceeds with normal `/api/combined` review generation

**User sees:** The product field updates to show the extracted name, then the review loads normally.

## Error Handling
- **Timeout/Network Error:** "URL request timed out. Please enter the product name manually."
- **Access Denied:** "Could not access URL (status 403). Please enter the product name manually."
- **Extraction Failed:** "Could not extract product name from URL. Please enter the product name manually."
- **Invalid Format:** "Invalid URL format"

All errors are displayed inline in the same screen, allowing users to manually enter the product name without disrupting their workflow.
