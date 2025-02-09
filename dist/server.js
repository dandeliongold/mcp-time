import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
const ToolInputSchema = ToolSchema.shape.inputSchema;
/* Input schemas for tools implemented in this server */
var ToolName;
(function (ToolName) {
    ToolName["GET_CURRENT_TIME"] = "getCurrentTime";
    ToolName["GET_TIME_DIFFERENCE"] = "getTimeDifference";
})(ToolName || (ToolName = {}));
const GetTimeArgsSchema = z.object({}).describe("No arguments needed");
const GetTimeDiffArgsSchema = z.object({
    timestamp: z.string().describe("ISO format timestamp (YYYY-MM-DD HH:mm:ss)"),
    interval: z.enum(['minutes', 'seconds'])
        .default('minutes')
        .describe("Time interval to return (minutes or seconds)")
});
export const createServer = () => {
    const server = new Server({
        name: "time-server",
        version: "0.1.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    let cleanupHandlers = [];
    let testTimestamp;
    const getCurrentTime = () => {
        if (testTimestamp) {
            return new Date(testTimestamp);
        }
        return new Date();
    };
    // Tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        const tools = [
            {
                name: ToolName.GET_CURRENT_TIME,
                description: "Get current time in UTC",
                inputSchema: zodToJsonSchema(GetTimeArgsSchema),
            },
            {
                name: ToolName.GET_TIME_DIFFERENCE,
                description: "Calculate time difference between now and a given timestamp",
                inputSchema: zodToJsonSchema(GetTimeDiffArgsSchema),
            },
        ];
        return { tools };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            if (name === ToolName.GET_CURRENT_TIME) {
                GetTimeArgsSchema.parse(args);
                const time = getCurrentTime().toISOString();
                return {
                    content: [{
                            type: "text",
                            text: time
                        }]
                };
            }
            if (name === ToolName.GET_TIME_DIFFERENCE) {
                const validatedArgs = GetTimeDiffArgsSchema.parse(args);
                // Parse input timestamp and ensure UTC
                const inputDate = new Date(validatedArgs.timestamp.replace(' ', 'T') + 'Z');
                if (isNaN(inputDate.getTime())) {
                    throw new McpError(ErrorCode.InvalidParams, 'Invalid timestamp format');
                }
                // Get current time in UTC
                const currentDate = getCurrentTime();
                // Calculate difference in milliseconds
                const diffMs = inputDate.getTime() - currentDate.getTime();
                // Convert to requested interval
                const difference = validatedArgs.interval === 'seconds'
                    ? Math.floor(diffMs / 1000)
                    : Math.floor(diffMs / (1000 * 60));
                const response = {
                    difference,
                    interval: validatedArgs.interval,
                    inputTimestamp: validatedArgs.timestamp,
                    currentTime: currentDate.toISOString().replace('T', ' ').slice(0, 19)
                };
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(response, null, 2)
                        }]
                };
            }
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                throw new McpError(ErrorCode.InvalidParams, error.errors[0].message);
            }
            throw new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
        }
    });
    const cleanup = async () => {
        await Promise.all(cleanupHandlers.map(handler => handler()));
        cleanupHandlers = [];
    };
    return { server, cleanup };
};
