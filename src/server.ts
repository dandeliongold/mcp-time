#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Schema definition for getCurrentTime
const GetTimeArgsSchema = z.object({});

const server = new Server({
    name: "time-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "getCurrentTime",
                description: "Get current time in UTC",
                inputSchema: zodToJsonSchema(GetTimeArgsSchema),
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name } = request.params;
        
        if (name === "getCurrentTime") {
            const time = new Date().toISOString();
            return {
                content: [{ 
                    type: "text", 
                    text: time
                }],
                isError: false,
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});

// Start server
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Time server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});