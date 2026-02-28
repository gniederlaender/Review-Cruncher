#!/usr/bin/env node

/**
 * ReviewCruncher MCP Server
 * 
 * Exposes ReviewCruncher's multi-source product analysis to AI assistants
 * via the Model Context Protocol (MCP).
 * 
 * Tools:
 * - analyze_product: Full multi-source product analysis
 * - quick_summary: Fast product overview
 * - compare_products: Compare two products side-by-side
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";

// Configuration
const API_BASE_URL = process.env.REVIEWCRUNCHER_API_URL || "https://www.reviewcruncher.com/api";
const DEFAULT_EMAIL = process.env.REVIEWCRUNCHER_EMAIL || "mcp-user@reviewcruncher.com";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "analyze_product",
    description: `Perform a comprehensive multi-source product analysis using ReviewCruncher.
    
This tool aggregates opinions from:
- YouTube reviews and comments
- X/Twitter discussions
- Reddit threads
- Google Search results
- Best Buy customer reviews

Returns:
- Source sentiment scorecard (-5 to +5 scale)
- Key takeaways per source
- Consensus points (where sources agree)
- Divergence points (where sources disagree)
- Final synthesis with recommendation
- Price range and alternatives`,
    inputSchema: {
      type: "object" as const,
      properties: {
        product: {
          type: "string",
          description: "The product name to analyze (e.g., 'iPhone 15 Pro', 'Sony WH-1000XM5', 'Tesla Model Y')"
        },
        expectations: {
          type: "string",
          description: "Optional: User's specific expectations or requirements for the product"
        }
      },
      required: ["product"]
    }
  },
  {
    name: "quick_summary",
    description: `Get a quick product recommendation without the full multi-source analysis.
    
Faster than analyze_product but less comprehensive. Uses AI to provide:
- Key features comparison with best alternative
- Pros and cons
- Price comparison
- Clear buy/don't buy recommendation`,
    inputSchema: {
      type: "object" as const,
      properties: {
        product: {
          type: "string",
          description: "The product name to get a quick summary for"
        }
      },
      required: ["product"]
    }
  },
  {
    name: "compare_products",
    description: `Compare two products side-by-side with multi-source analysis.
    
Analyzes both products and provides:
- Feature comparison
- Sentiment comparison across sources
- Price comparison
- Clear recommendation on which to buy`,
    inputSchema: {
      type: "object" as const,
      properties: {
        product1: {
          type: "string",
          description: "First product to compare"
        },
        product2: {
          type: "string",
          description: "Second product to compare"
        },
        priorities: {
          type: "string",
          description: "Optional: What matters most to the user (e.g., 'battery life', 'camera quality', 'value for money')"
        }
      },
      required: ["product1", "product2"]
    }
  }
];

// Zod schemas for validation
const AnalyzeProductSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  expectations: z.string().optional()
});

const QuickSummarySchema = z.object({
  product: z.string().min(1, "Product name is required")
});

const CompareProductsSchema = z.object({
  product1: z.string().min(1, "First product is required"),
  product2: z.string().min(1, "Second product is required"),
  priorities: z.string().optional()
});

// API helper functions
async function analyzeProduct(product: string, expectations?: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/combined`, {
      product,
      email: DEFAULT_EMAIL,
      expectations: expectations || ""
    }, {
      timeout: 120000 // 2 minute timeout for full analysis
    });

    const { recommendation, sources } = response.data;
    
    // Format the response nicely
    let result = `# Product Analysis: ${product}\n\n`;
    
    // Scorecard
    if (recommendation.scorecard && recommendation.scorecard.length > 0) {
      result += `## 📊 Source Sentiment Scorecard\n\n`;
      result += `| Source | Score | Sample Size |\n`;
      result += `|--------|-------|-------------|\n`;
      
      for (const item of recommendation.scorecard) {
        const scoreDisplay = item.available && item.score !== null 
          ? `${item.score > 0 ? '+' : ''}${item.score.toFixed(1)}` 
          : 'N/A';
        const sampleDisplay = item.available 
          ? `${item.sampleSize} ${item.unit}` 
          : 'unavailable';
        result += `| ${item.name} | ${scoreDisplay} | ${sampleDisplay} |\n`;
      }
      result += `\n`;
    }
    
    // Sources used
    if (recommendation.sourcesUsed && recommendation.sourcesUsed.length > 0) {
      result += `**Sources analyzed:** ${recommendation.sourcesUsed.join(', ')}\n\n`;
    }
    
    // Key takeaways
    if (recommendation.keyTakeaways && Object.keys(recommendation.keyTakeaways).length > 0) {
      result += `## 🔑 Key Takeaways by Source\n\n`;
      for (const [source, takeaways] of Object.entries(recommendation.keyTakeaways)) {
        if (Array.isArray(takeaways) && takeaways.length > 0) {
          result += `**${source}:**\n`;
          for (const point of takeaways) {
            result += `- ${point}\n`;
          }
          result += `\n`;
        }
      }
    }
    
    // Consensus
    if (recommendation.consensus && recommendation.consensus.length > 0) {
      result += `## ✅ Consensus (Sources Agree)\n\n`;
      for (const point of recommendation.consensus) {
        result += `- ${point}\n`;
      }
      result += `\n`;
    }
    
    // Divergence
    if (recommendation.divergence && recommendation.divergence.length > 0) {
      result += `## ⚡ Divergence (Sources Disagree)\n\n`;
      for (const point of recommendation.divergence) {
        result += `- ${point}\n`;
      }
      result += `\n`;
    }
    
    // Final synthesis
    result += `## 📝 Final Synthesis\n\n`;
    result += recommendation.responseMessage || "No synthesis available.";
    
    return result;
    
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API error: ${error.response.data?.error || error.response.statusText}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Analysis timed out. The product analysis takes 1-2 minutes. Please try again.");
    } else {
      throw new Error(`Failed to analyze product: ${error.message}`);
    }
  }
}

async function quickSummary(product: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/recommend`, {
      product,
      email: DEFAULT_EMAIL
    }, {
      timeout: 60000
    });

    const { response: recommendation } = response.data;
    
    return `# Quick Summary: ${product}\n\n${recommendation.responseMessage}`;
    
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API error: ${error.response.data?.error || error.response.statusText}`);
    } else {
      throw new Error(`Failed to get summary: ${error.message}`);
    }
  }
}

async function compareProducts(product1: string, product2: string, priorities?: string): Promise<string> {
  try {
    // Analyze both products in parallel
    const [analysis1, analysis2] = await Promise.all([
      analyzeProduct(product1, priorities),
      analyzeProduct(product2, priorities)
    ]);
    
    let result = `# Product Comparison\n\n`;
    result += `## Product 1: ${product1}\n\n`;
    result += analysis1;
    result += `\n\n---\n\n`;
    result += `## Product 2: ${product2}\n\n`;
    result += analysis2;
    
    if (priorities) {
      result += `\n\n---\n\n`;
      result += `## Your Priorities: ${priorities}\n\n`;
      result += `Based on your stated priorities, review the scorecard and synthesis sections above to make your decision.`;
    }
    
    return result;
    
  } catch (error: any) {
    throw new Error(`Failed to compare products: ${error.message}`);
  }
}

// Create and configure the MCP server
const server = new Server(
  {
    name: "reviewcruncher",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "analyze_product": {
        const validated = AnalyzeProductSchema.parse(args);
        const result = await analyzeProduct(validated.product, validated.expectations);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "quick_summary": {
        const validated = QuickSummarySchema.parse(args);
        const result = await quickSummary(validated.product);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "compare_products": {
        const validated = CompareProductsSchema.parse(args);
        const result = await compareProducts(
          validated.product1,
          validated.product2,
          validated.priorities
        );
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: "text",
            text: `Invalid parameters: ${error.errors.map(e => e.message).join(", ")}`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ReviewCruncher MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
