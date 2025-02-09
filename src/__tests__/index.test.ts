import { getFormattedTime, handleJsonRpcMessage, JsonRpcRequest } from '../json-rpc';

function mockDate(isoString: string): void {
  const fixedDate = new Date(isoString);
  global.Date = class extends Date {
    constructor() {
      super();
      return fixedDate;
    }
  } as typeof Date;
}

describe('getFormattedTime', () => {
  let originalDate: typeof Date;

  beforeAll(() => {
    originalDate = global.Date;
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  it('should return time in YYYY-MM-DD HH:mm:ss format', () => {
    mockDate('2024-02-08T17:30:45.123Z');
    const time = getFormattedTime();
    expect(time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should return the correct formatted time', () => {
    mockDate('2024-02-08T17:30:45.123Z');
    const time = getFormattedTime();
    expect(time).toBe('2024-02-08 17:30:45');
  });

  it.each([
    ['2024-12-31T23:59:59.999Z', '2024-12-31 23:59:59'],
    ['2025-01-01T00:00:00.000Z', '2025-01-01 00:00:00'],
    ['2024-02-29T12:34:56.789Z', '2024-02-29 12:34:56'], // Leap year
  ])('should format %s correctly', (input, expected) => {
    mockDate(input);
    const time = getFormattedTime();
    expect(time).toBe(expected);
  });
});

describe('JSON-RPC Message Handling', () => {
  let originalDate: typeof Date;

  beforeAll(() => {
    originalDate = global.Date;
    mockDate('2024-02-08T17:30:45.123Z');
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  afterEach(() => {
    global.Date = originalDate;
    mockDate('2024-02-08T17:30:45.123Z');
  });

  it('should handle getCurrentTime method correctly', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getCurrentTime'
    };

    const response = handleJsonRpcMessage(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {
        time: '2024-02-08 17:30:45',
        success: true
      }
    });
  });

  it('should return error for unknown methods', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'unknownMethod'
    };

    const response = handleJsonRpcMessage(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 2,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    });
  });

  it('should handle null id in request', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: null,
      method: 'getCurrentTime'
    };

    const response = handleJsonRpcMessage(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: null,
      result: {
        time: '2024-02-08 17:30:45',
        success: true
      }
    });
  });

  it('should handle string id in request', () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 'test-id',
      method: 'getCurrentTime'
    };

    const response = handleJsonRpcMessage(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 'test-id',
      result: {
        time: '2024-02-08 17:30:45',
        success: true
      }
    });
  });
});
