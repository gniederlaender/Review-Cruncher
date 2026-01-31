// modules/sources/bestbuy.js
const axios = require('axios');

/**
 * Best Buy API Integration Module
 * Searches for products and extracts customer reviews
 */

class BestBuySource {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.bestbuy.com/v1';
    }

    /**
     * Search Best Buy for product reviews
     * @param {string} product - Product name to search for
     * @returns {Promise<Object>} Formatted Best Buy data
     */
    async search(product) {
        try {
            // Search for products
            const searchResponse = await axios.get(`${this.baseUrl}/products((search=${encodeURIComponent(product)}))`, {
                params: {
                    apiKey: this.apiKey,
                    format: 'json',
                    show: 'name,sku,customerReviewAverage,customerReviewCount,regularPrice,salePrice,url,image',
                    pageSize: 5
                }
            });

            const products = searchResponse.data.products || [];

            if (products.length === 0) {
                return {
                    source: 'bestbuy',
                    available: true,
                    products: [],
                    summary: 'No matching products found on Best Buy'
                };
            }

            // Get the top product for detailed reviews
            const topProduct = products[0];
            let reviews = [];

            try {
                const reviewsResponse = await axios.get(`${this.baseUrl}/reviews(sku=${topProduct.sku})`, {
                    params: {
                        apiKey: this.apiKey,
                        format: 'json',
                        show: 'title,comment,rating,reviewer.name,submissionTime',
                        sort: 'rating.dsc',
                        pageSize: 10
                    }
                });

                reviews = (reviewsResponse.data.reviews || []).map(review => ({
                    title: review.title,
                    comment: review.comment?.slice(0, 200) || '',
                    rating: review.rating,
                    reviewer: review.reviewer?.name || 'Anonymous',
                    date: review.submissionTime
                }));
            } catch (error) {
                console.log('Could not fetch detailed reviews:', error.message);
            }

            // Format product data
            const productData = products.map(p => ({
                name: p.name,
                sku: p.sku,
                avgRating: p.customerReviewAverage || 0,
                reviewCount: p.customerReviewCount || 0,
                price: p.salePrice || p.regularPrice || 0,
                url: p.url,
                image: p.image
            }));

            // Calculate aggregate metrics
            const avgRating = productData.reduce((sum, p) => sum + p.avgRating, 0) / productData.length;
            const totalReviews = productData.reduce((sum, p) => sum + p.reviewCount, 0);

            // Determine sentiment based on ratings
            let sentiment = 'neutral';
            if (avgRating >= 4.0) sentiment = 'positive';
            else if (avgRating < 3.0) sentiment = 'negative';

            return {
                source: 'bestbuy',
                available: true,
                products: productData,
                reviews: reviews.slice(0, 5),
                metrics: {
                    avgRating: avgRating.toFixed(1),
                    totalReviews,
                    productsFound: productData.length
                },
                sentiment,
                summary: this._generateSummary(productData, avgRating, totalReviews)
            };
        } catch (error) {
            console.error('Best Buy search error:', error.response?.data || error.message);
            return {
                source: 'bestbuy',
                available: false,
                error: 'Failed to fetch Best Buy data',
                products: [],
                summary: 'Best Buy data unavailable'
            };
        }
    }

    /**
     * Generate a summary of Best Buy reviews
     */
    _generateSummary(products, avgRating, totalReviews) {
        if (products.length === 0) {
            return 'No matching products found on Best Buy';
        }

        const topProduct = products[0];
        return `${products.length} matching products found on Best Buy with ${totalReviews} total reviews. ` +
               `Average rating: ${avgRating.toFixed(1)}/5.0 stars. Top match: "${topProduct.name}" ` +
               `(${topProduct.reviewCount} reviews, $${topProduct.price}).`;
    }
}

module.exports = BestBuySource;
