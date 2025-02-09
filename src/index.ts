#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

let transport: StdioServerTransport;

async function runServer() {
    const { server } = createServer();
    transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Time server running on stdio");
}

async function closeServer() {
    if (transport) {
        await transport.close();
        console.error("Time server stopped");
    }
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
    await closeServer();
    process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
    console.error("Uncaught exception:", error);
    await closeServer();
    process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
    console.error("Unhandled rejection:", reason);
    await closeServer();
    process.exit(1);
});

// Start server
runServer().catch(async (error) => {
    console.error("Fatal error running server:", error);
    await closeServer();
    process.exit(1);
});
