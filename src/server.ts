import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
    Tool,
    ToolSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

/* Input schemas for tools implemented in this server */
enum ToolName {
    GET_CURRENT_TIME = "getCurrentTime",
    GET_TIME_DIFFERENCE = "getTimeDifference"
}

const GetTimeArgsSchema = z.object({}).describe(
    `No arguments needed - returns current time in ISO format
    Format: YYYY-MM-DDTHH:mm:ss.sssZ`
);

const GetTimeDiffArgsSchema = z.object({
    timestamp: z.string().describe(
        `Input timestamp in format YYYY-MM-DD HH:mm:ss
        Example: '2025-02-08 20:20:22'`
    ),
    interval: z.enum(['minutes', 'seconds'])
        .default('minutes')
        .describe(
            `Time interval for the difference calculation.
            Returns positive values for future timestamps, negative for past.
            Default: 'minutes'`
        )
});

type ToolResult = {
    content: Array<{
        type: string;
        text: string;
    }>;
};

export const createServer = () => {
    const server = new Server({
        name: "time-server",
        version: "1.2.2",
    }, {
        capabilities: {
            tools: {},
        },
    });

    let cleanupHandlers: Array<() => Promise<void>> = [];
    
    let testTimestamp: string | undefined;
    
    const getCurrentTime = () => {
        if (testTimestamp) {
            return new Date(testTimestamp);
        }
        return new Date();
    };

    // Tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        const tools: Tool[] = [
            {
                name: ToolName.GET_CURRENT_TIME,
                description: `Get current time in UTC ISO format.
            Returns a string in format YYYY-MM-DDTHH:mm:ss.sssZ.

            Example response:
            {
                "type": "text",
                "text": "2025-02-08T19:50:22.000Z"
            }`,
                inputSchema: zodToJsonSchema(GetTimeArgsSchema) as ToolInput,
            },
            {
                name: ToolName.GET_TIME_DIFFERENCE,
                description: `Calculate time difference between a given timestamp and current time.
                Returns positive values for future timestamps and negative for past timestamps.
                Response includes the difference in requested interval (minutes/seconds),
                input timestamp, and current time.

                Example calls:
                {
                    "timestamp": "2025-02-08 20:20:22",
                    "interval": "minutes"
                }
                or
                {
                    "interval": "seconds",
                    "timestamp": "2025-02-08 20:20:22"
                }

                Example response:
                {
                    "difference": 30,
                    "interval": "minutes",
                    "inputTimestamp": "2025-02-08 20:20:22",
                    "currentTime": "2025-02-08 19:50:22"
                }`,
                inputSchema: zodToJsonSchema(GetTimeDiffArgsSchema) as ToolInput,
            },
        ];

        return { tools };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request): Promise<ToolResult> => {
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
                    throw new McpError(
                        ErrorCode.InvalidParams,
                        'Invalid timestamp format'
                    );
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

            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${name}`
            );
        } catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    error.errors[0].message
                );
            }
            throw new McpError(
                ErrorCode.InternalError,
                error instanceof Error ? error.message : String(error)
            );
        }
    });

    const cleanup = async () => {
        await Promise.all(cleanupHandlers.map(handler => handler()));
        cleanupHandlers = [];
    };

    return { server, cleanup };
};
