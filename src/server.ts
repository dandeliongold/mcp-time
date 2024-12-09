import { execSync } from 'child_process';
import { createMcpServer } from '@anthropic-ai/mcp';

const server = createMcpServer({
  name: 'mcp-time',
  functions: {
    getCurrentTime: {
      description: 'Get current time in JST (Japan Standard Time)',
      parameters: {},
      handler: () => {
        try {
          const time = execSync('date "+%Y%m%d%H%M%S"').toString().trim();
          return { time, success: true };
        } catch (error) {
          console.error('Error getting time:', error);
          return {
            time: null,
            success: false,
            error: 'Failed to get current time'
          };
        }
      }
    }
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3200;

server.listen(PORT, () => {
  console.log(`MCP Time server listening on port ${PORT}`);
});
