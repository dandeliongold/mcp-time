# @dandeliongold/mcp-time

An MCP server for getting current time in ISO format (YYYY-MM-DD HH:mm:ss) using JavaScript Date. This server works with the Claude desktop app on both Windows and macOS.

## Components

### Tools

1. `getCurrentTime`
   - Returns the current time in ISO format
   - No input parameters required
   - Returns: 
     ```json
     {
       "time": "2024-02-08 11:04:33",
       "success": true
     }
     ```
   
   Example JSON-RPC request:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "getCurrentTime"
   }
   ```

   Example JSON-RPC response:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "time": "2024-02-08 11:04:33",
       "success": true
     }
   }
   ```

## Features

- Get current time in YYYY-MM-DD HH:mm:ss format
- Cross-platform support for Windows and macOS
- Simple JSON-RPC interface
- Consistent ISO-style date formatting
- Error handling with detailed error messages

## Installation

```bash
npm install @dandeliongold/mcp-time
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "time": {
      "command": "npx",
      "args": [
        "@dandeliongold/mcp-time"
      ]
    }
  }
}
```

## Development

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Run tests
   ```bash
   npm test
   ```
4. Start development server
   ```bash
   npm run dev
   ```

## License

MIT License - see [LICENSE](LICENSE.txt) for details
