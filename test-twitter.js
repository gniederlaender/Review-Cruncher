// Test script for Twitter integration
require('dotenv').config();
const TwitterSource = require('./modules/sources/twitter');

async function testTwitter() {
    console.log('Testing Twitter/X Integration with BIRD CLI\n');
    console.log('='.repeat(60));

    // Check environment variables
    console.log('\n1. Checking Environment Variables:');
    console.log('   TWITTER_AUTH_TOKEN:', process.env.TWITTER_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
    console.log('   TWITTER_CT0:', process.env.TWITTER_CT0 ? '✓ Set' : '✗ Missing');

    // Initialize Twitter source
    const twitter = new TwitterSource(
        process.env.TWITTER_AUTH_TOKEN,
        process.env.TWITTER_CT0
    );

    // Test search
    console.log('\n2. Testing Search for "iPhone 15":');
    console.log('   Searching...');

    try {
        const result = await twitter.search('iPhone 15');

        console.log('\n3. Results:');
        console.log('   Available:', result.available);
        console.log('   Tweets found:', result.tweets?.length || 0);
        console.log('   Sentiment:', result.sentiment);
        console.log('   Summary:', result.summary);

        if (result.metrics) {
            console.log('\n4. Metrics:');
            console.log('   Total Tweets:', result.metrics.totalTweets);
            console.log('   Total Likes:', result.metrics.totalLikes);
            console.log('   Total Retweets:', result.metrics.totalRetweets);
            console.log('   Avg Likes:', result.metrics.avgLikes);
            console.log('   Verified Count:', result.metrics.verifiedCount);
        }

        if (result.tweets && result.tweets.length > 0) {
            console.log('\n5. Sample Tweet:');
            const tweet = result.tweets[0];
            console.log('   @' + tweet.username + ':', tweet.text.substring(0, 100) + '...');
            console.log('   Likes:', tweet.metrics.likes, '| Retweets:', tweet.metrics.retweets);
        }

        if (result.error) {
            console.log('\n⚠ Error:', result.error);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test Complete - Twitter integration is', result.available ? 'WORKING' : 'NOT WORKING');

    } catch (error) {
        console.log('\n❌ Error during search:', error.message);
        console.log('   Stack:', error.stack);
    }
}

testTwitter();
