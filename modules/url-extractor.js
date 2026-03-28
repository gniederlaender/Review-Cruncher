// modules/url-extractor.js
const axios = require('axios');

class URLExtractor {
    constructor() {
        this.timeout = 5000; // 5 seconds as per spec
    }

    /**
     * Checks if a string is a valid URL
     * @param {string} input - The input string to check
     * @returns {boolean} - True if input is a valid URL
     */
    isURL(input) {
        try {
            const url = new URL(input);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    /**
     * Extracts product name from Schema.org JSON-LD
     * @param {string} html - The HTML content to parse
     * @returns {string|null} - Extracted product name or null
     */
    extractFromJSONLD(html) {
        try {
            // Match all script tags with type="application/ld+json"
            const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
            let match;

            while ((match = jsonLdRegex.exec(html)) !== null) {
                try {
                    const jsonData = JSON.parse(match[1]);

                    // Handle single object or array of objects
                    const items = Array.isArray(jsonData) ? jsonData : [jsonData];

                    for (const item of items) {
                        // Check for Product type
                        if (item['@type'] === 'Product' && item.name) {
                            return item.name.trim();
                        }

                        // Check for nested Product in @graph
                        if (item['@graph']) {
                            for (const graphItem of item['@graph']) {
                                if (graphItem['@type'] === 'Product' && graphItem.name) {
                                    return graphItem.name.trim();
                                }
                            }
                        }
                    }
                } catch (parseError) {
                    // Skip invalid JSON blocks
                    continue;
                }
            }
        } catch (error) {
            console.error('Error extracting from JSON-LD:', error.message);
        }
        return null;
    }

    /**
     * Extracts product name from OpenGraph meta tags
     * @param {string} html - The HTML content to parse
     * @returns {string|null} - Extracted product name or null
     */
    extractFromOpenGraph(html) {
        try {
            // Match og:title meta tag
            const ogTitleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i;
            const match = html.match(ogTitleRegex);

            if (match && match[1]) {
                return match[1].trim();
            }

            // Alternative: content before property
            const ogTitleRegex2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i;
            const match2 = html.match(ogTitleRegex2);

            if (match2 && match2[1]) {
                return match2[1].trim();
            }
        } catch (error) {
            console.error('Error extracting from OpenGraph:', error.message);
        }
        return null;
    }

    /**
     * Extracts product name from URL path
     * @param {string} urlString - The URL to parse
     * @returns {string|null} - Extracted product name or null
     */
    extractFromURLPath(urlString) {
        try {
            const url = new URL(urlString);
            const pathname = url.pathname;

            // Split path into segments
            const segments = pathname.split('/').filter(seg => seg.length > 0);

            if (segments.length === 0) {
                return null;
            }

            // Look for product-like segments (usually longer and with dashes/underscores)
            let productSegment = null;

            for (const segment of segments) {
                // Skip common non-product segments
                if (['dp', 'product', 'item', 'p', 'products', 'items'].includes(segment.toLowerCase())) {
                    continue;
                }

                // Look for segments with dashes or underscores (common in product URLs)
                if ((segment.includes('-') || segment.includes('_')) && segment.length > 5) {
                    productSegment = segment;
                    break;
                }
            }

            // If no dashed segment found, take the longest segment
            if (!productSegment && segments.length > 0) {
                productSegment = segments.reduce((longest, current) =>
                    current.length > longest.length ? current : longest
                , segments[0]);
            }

            if (!productSegment) {
                return null;
            }

            // Clean up the segment
            // Replace dashes and underscores with spaces
            let cleaned = productSegment.replace(/[-_]/g, ' ');

            // Remove common URL artifacts
            cleaned = cleaned.replace(/\+/g, ' ');

            // Capitalize first letter of each word
            cleaned = cleaned.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            return cleaned.trim();
        } catch (error) {
            console.error('Error extracting from URL path:', error.message);
        }
        return null;
    }

    /**
     * Fetches URL and extracts product name using multiple strategies
     * @param {string} urlString - The URL to fetch and extract from
     * @returns {Promise<{success: boolean, productName?: string, error?: string}>}
     */
    async extractProductName(urlString) {
        // Validate URL
        if (!this.isURL(urlString)) {
            return {
                success: false,
                error: 'Invalid URL format'
            };
        }

        try {
            // Fetch the URL with timeout
            const response = await axios.get(urlString, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                maxRedirects: 5,
                validateStatus: (status) => status >= 200 && status < 400
            });

            const html = response.data;

            // Strategy 1: Try Schema.org JSON-LD
            let productName = this.extractFromJSONLD(html);
            if (productName) {
                console.log('Product name extracted from JSON-LD:', productName);
                return { success: true, productName };
            }

            // Strategy 2: Try OpenGraph
            productName = this.extractFromOpenGraph(html);
            if (productName) {
                console.log('Product name extracted from OpenGraph:', productName);
                return { success: true, productName };
            }

            // Strategy 3: Try URL path analysis
            productName = this.extractFromURLPath(urlString);
            if (productName) {
                console.log('Product name extracted from URL path:', productName);
                return { success: true, productName };
            }

            // All strategies failed
            return {
                success: false,
                error: 'Could not extract product name from URL. Please enter the product name manually.'
            };

        } catch (error) {
            console.error('Error fetching URL:', error.message);

            // Handle specific error types
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                return {
                    success: false,
                    error: 'URL request timed out. Please enter the product name manually.'
                };
            }

            if (error.response) {
                // Server responded with error status
                return {
                    success: false,
                    error: `Could not access URL (status ${error.response.status}). Please enter the product name manually.`
                };
            }

            // Network or other errors
            return {
                success: false,
                error: 'Could not access URL. Please enter the product name manually.'
            };
        }
    }
}

module.exports = URLExtractor;
