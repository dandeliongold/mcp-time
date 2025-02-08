# mcp-time

A simple MCP server for getting current time in various formats. This server works with Claude desktop app on both Windows and macOS.

## Features

- Get current time in YYYY-MM-DD HH:MM:SS format
- Cross-platform support for Windows and macOS
- Uses native system commands (PowerShell on Windows, date command on macOS)

## Installation

```bash
npm install mcp-time
```

## Usage

Start the server:

```bash
npm start
```

The server will start on port 3200 by default.

## Development

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Start development server
   ```bash
   npm run dev
   ```

## License

MIT License - see [LICENSE](LICENSE.txt) for details
