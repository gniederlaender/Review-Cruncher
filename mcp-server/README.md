# ReviewCruncher MCP Server

<p align="center">
  <img src="https://img.shields.io/badge/MCP-Compatible-blue" alt="MCP Compatible">
  <img src="https://img.shields.io/npm/v/@reviewcruncher/mcp-server" alt="npm version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

**Multi-source product review analysis for AI assistants** via the [Model Context Protocol](https://modelcontextprotocol.io/).

Ask Claude, Cursor, or any MCP-compatible AI assistant to analyze products using ReviewCruncher's aggregated review data from YouTube, Reddit, X/Twitter, Google, and more.

## 🚀 Quick Start

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reviewcruncher": {
      "command": "npx",
      "args": ["@reviewcruncher/mcp-server"]
    }
  }
}
```

### For Cursor / Windsurf / Other MCP Clients

```bash
npx @reviewcruncher/mcp-server
```

## 🛠️ Available Tools

### `analyze_product`

Perform a comprehensive multi-source product analysis.

**Example prompt:** "Analyze the Sony WH-1000XM5 headphones for me"

**Returns:**
- 📊 Source sentiment scorecard (-5 to +5 scale)
- 🔑 Key takeaways per source (YouTube, Reddit, X, etc.)
- ✅ Consensus points (where sources agree)
- ⚡ Divergence points (where sources disagree)
- 📝 Final synthesis with recommendation
- 💰 Price range and alternatives

### `quick_summary`

Get a fast product recommendation without full analysis.

**Example prompt:** "Give me a quick summary of the MacBook Air M3"

**Returns:**
- Feature comparison with best alternative
- Pros and cons
- Price comparison
- Buy/don't buy recommendation

### `compare_products`

Compare two products side-by-side.

**Example prompt:** "Compare the iPhone 15 Pro vs Samsung Galaxy S24 Ultra for camera quality"

**Returns:**
- Full analysis of both products
- Side-by-side comparison
- Recommendation based on your priorities

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REVIEWCRUNCHER_API_URL` | API endpoint | `https://www.reviewcruncher.com/api` |
| `REVIEWCRUNCHER_EMAIL` | Email for API tracking | `mcp-user@reviewcruncher.com` |

### Self-Hosted API

If you're running your own ReviewCruncher instance:

```json
{
  "mcpServers": {
    "reviewcruncher": {
      "command": "npx",
      "args": ["@reviewcruncher/mcp-server"],
      "env": {
        "REVIEWCRUNCHER_API_URL": "http://localhost:5000/api"
      }
    }
  }
}
```

## 📦 Installation

### Global Install

```bash
npm install -g @reviewcruncher/mcp-server
reviewcruncher-mcp
```

### npx (No Install)

```bash
npx @reviewcruncher/mcp-server
```

### From Source

```bash
git clone https://github.com/gniederlaender/Review-Cruncher
cd Review-Cruncher/mcp-server
npm install
npm run build
npm start
```

## 🔌 Data Sources

ReviewCruncher aggregates opinions from:

| Source | Data Type | Sentiment Scoring |
|--------|-----------|-------------------|
| 🎥 YouTube | Video reviews, comments | Like/view ratio |
| 🗨️ Reddit | Discussions, threads | Upvotes, sentiment |
| 𝕏 X/Twitter | Tweets, opinions | Engagement-weighted |
| ⭐ Best Buy | Customer reviews | Star ratings |
| 📰 Google | Expert articles | Availability only |

## 💡 Example Usage

Once configured, you can ask your AI assistant:

- "What do people think about the Tesla Model Y?"
- "Should I buy the Dyson V15 or the Shark?"
- "Analyze the iPad Pro 2024 - I care most about battery life"
- "Compare running shoes: Nike Pegasus vs Hoka Clifton"

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md).

## 📄 License

MIT - see [LICENSE](../LICENSE)

---

**Built with ❤️ by [ReviewCruncher](https://www.reviewcruncher.com)**
