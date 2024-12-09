import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface JsonRpcRequest {
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

async function handleJsonRpcMessage(message: JsonRpcRequest): Promise<JsonRpcResponse> {
  if (message.method === 'getCurrentTime') {
    try {
      const { stdout } = await execAsync('date "+%Y-%m-%d %H:%M:%S"');
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          time: stdout.trim(),
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

// メインのサーバー処理
process.stdin.setEncoding('utf-8');
let buffer = '';

process.stdin.on('data', async (chunk: string) => {
  buffer += chunk;
  
  const messages = buffer.split('\n');
  buffer = messages.pop() || '';

  for (const message of messages) {
    try {
      const request: JsonRpcRequest = JSON.parse(message);
      const response = await handleJsonRpcMessage(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
