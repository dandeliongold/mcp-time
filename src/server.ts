#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Schema definitions
const GetTimeArgsSchema = z.object({});

export const GetTimeDiffArgsSchema = z.object({
    timestamp: z.string().describe("ISO format timestamp (YYYY-MM-DD HH:mm:ss)"),
    interval: z.enum(['minutes', 'seconds'])
        .default('minutes')
        .describe("Time interval to return (minutes or seconds)")
});

export const server = new Server({
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
            {
                name: "getTimeDifference",
                description: "Calculate time difference between now and a given timestamp",
                inputSchema: zodToJsonSchema(GetTimeDiffArgsSchema),
            },
        ],
    };
});

export async function handleMcpRequest(request: any) {
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

        if (name === "getTimeDifference") {
            const args = GetTimeDiffArgsSchema.parse(request.params.arguments);
            
            // Parse input timestamp and ensure UTC
            const inputDate = new Date(args.timestamp.replace(' ', 'T') + 'Z');
            if (isNaN(inputDate.getTime())) {
                return {
                    content: [{ type: "text", text: JSON.stringify({ error: 'Invalid timestamp format' }) }],
                    isError: true,
                };
            }

            // Get current time in UTC
            const currentDate = new Date();

            // Calculate difference in milliseconds
            const diffMs = inputDate.getTime() - currentDate.getTime();

            // Convert to requested interval
            const difference = args.interval === 'seconds'
                ? Math.floor(diffMs / 1000)
                : Math.floor(diffMs / (1000 * 60));

            const response = {
                difference,
                interval: args.interval,
                inputTimestamp: args.timestamp,
                currentTime: currentDate.toISOString().replace('T', ' ').slice(0, 19)
            };

            return {
                content: [{ 
                    type: "text", 
                    text: JSON.stringify(response, null, 2)
                }],
                isError: false,
            };

        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
            isError: true,
        };
    }
}

server.setRequestHandler(CallToolRequestSchema, handleMcpRequest);

let transport: StdioServerTransport;

// Start server
async function runServer() {
    transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Time server running on stdio");
}

async function closeServer() {
    await server.close();
    transport.close();
    console.error("Time server stopped");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});

export { closeServer };
