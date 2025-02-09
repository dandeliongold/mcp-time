export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string | null;
    method: string;
    params?: any;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number | string | null;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

interface TimeResponse {
    time: string;
    success: boolean;
}

export function getFormattedTime(): string {
    const now = new Date();
    return now.toISOString()
        .replace('T', ' ')      // Replace T with space
        .slice(0, 19);          // Get only YYYY-MM-DD HH:mm:ss part
}

export function handleJsonRpcMessage(message: JsonRpcRequest): JsonRpcResponse {
    if (message.method === 'getCurrentTime') {
        try {
            const time = getFormattedTime();
            return {
                jsonrpc: '2.0',
                id: message.id,
                result: {
                    time: time,
                    success: true
                }
            };
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                    code: -32603,
                    message: 'Failed to get current time',
                    data: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }

    return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
            code: -32601,
            message: 'Method not found'
        }
    };
}
