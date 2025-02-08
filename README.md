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

2. `getTimeDifference`
   - Calculates the time difference between a given timestamp and the current time
   - Parameters:
     - `timestamp`: ISO format timestamp (YYYY-MM-DD HH:mm:ss)
     - `interval`: 'minutes' (default) or 'seconds'
   - Returns a signed difference value following this convention:
     - Positive values (+) indicate future timestamps ("in X minutes/seconds")
     - Negative values (-) indicate past timestamps ("X minutes/seconds ago")
     - Zero (0) indicates same timestamp
   
   Example JSON-RPC request:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "getTimeDifference",
     "params": {
       "timestamp": "2024-02-08 12:30:00",
       "interval": "minutes"
     }
   }
   ```

   Example JSON-RPC responses:
   ```json
   // For a past timestamp (30 minutes ago)
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "difference": -30,
       "interval": "minutes",
       "inputTimestamp": "2024-02-08 12:30:00",
       "currentTime": "2024-02-08 13:00:00"
     }
   }

   // For a future timestamp (in 45 minutes)
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "difference": 45,
       "interval": "minutes",
       "inputTimestamp": "2024-02-08 13:45:00",
       "currentTime": "2024-02-08 13:00:00"
     }
   }
   ```

## Features

- Get current time in YYYY-MM-DD HH:mm:ss format
- Calculate time differences between timestamps and current time
- Intuitive positive/negative values for future/past times
- Support for both minutes and seconds intervals
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
