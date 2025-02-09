// src/__tests__/server.test.ts
import { jest } from '@jest/globals';
import { createServer } from "../server"; // adjust this path
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Helper to wait for pending promises to flush.
 */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a dummy transport that conforms to the Transport interface.
 */
function createDummyTransport(): Transport {
  const dummy: Transport = {
    onclose: undefined,
    onerror: undefined,
    onmessage: undefined,
    start: jest.fn(() => Promise.resolve()),
    send: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
  };
  return dummy;
}

describe("Time Server Protocol Integration", () => {
  let server: Server;
  let cleanup: () => Promise<void>;
  let transport: Transport;

  beforeEach(async () => {
    // createServer is assumed to return an object { server, cleanup }
    const srv = createServer();
    server = srv.server;
    cleanup = srv.cleanup;
    transport = createDummyTransport();
    await server.connect(transport);
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
    (transport.send as jest.Mock).mockReset();
  });

  describe("ListToolsRequest", () => {
    it("should return the list of available tools", async () => {
      const listRequest = {
        jsonrpc: "2.0" as "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      };

      // Simulate an incoming JSON-RPC message.
      if (transport.onmessage) {
        transport.onmessage(listRequest);
      }
      await flushPromises();

      // Assert that a response was sent.
      const sendMock = transport.send as jest.Mock;
      expect(sendMock.mock.calls.length).toBeGreaterThan(0);

      // Find the call with id === 1.
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 1
      );
      if (!call) {
        throw new Error("No send call found with id === 1");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("result");
      expect(response.result).toHaveProperty("tools");
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools.length).toBe(2);

      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toEqual(expect.arrayContaining(["getCurrentTime", "getTimeDifference"]));
    });
  });

  describe("CallToolRequest handler", () => {
    it('should return the current time in ISO format when calling "getCurrentTime"', async () => {
      const fakeTime = new Date("2025-01-01T12:00:00.000Z");
      jest.useFakeTimers({ now: fakeTime });

      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "getCurrentTime",
          arguments: {},
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 2
      );
      if (!call) {
        throw new Error("No send call found with id === 2");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("result");
      expect(response.result).toHaveProperty("content");

      const content = response.result.content;
      expect(Array.isArray(content)).toBe(true);
      expect(content[0]).toHaveProperty("text", fakeTime.toISOString());
    });

    it('should calculate time difference in minutes when calling "getTimeDifference"', async () => {
      const currentTime = new Date("2025-01-01T12:00:00.000Z");
      jest.useFakeTimers({ now: currentTime });
      const futureTimestamp = "2025-01-01 12:30:00";

      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "getTimeDifference",
          arguments: {
            timestamp: futureTimestamp,
            interval: "minutes",
          },
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 3
      );
      if (!call) {
        throw new Error("No send call found with id === 3");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("result");
      expect(response.result).toHaveProperty("content");
      const content = response.result.content;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toMatchObject({
        difference: 30,
        interval: "minutes",
        inputTimestamp: futureTimestamp,
      });
    });

    it('should calculate time difference in seconds when calling "getTimeDifference"', async () => {
      const currentTime = new Date("2025-01-01T12:00:00.000Z");
      jest.useFakeTimers({ now: currentTime });
      const futureTimestamp = "2025-01-01 12:00:30";

      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "getTimeDifference",
          arguments: {
            timestamp: futureTimestamp,
            interval: "seconds",
          },
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 4
      );
      if (!call) {
        throw new Error("No send call found with id === 4");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("result");
      expect(response.result).toHaveProperty("content");
      const content = response.result.content;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toMatchObject({
        difference: 30,
        interval: "seconds",
        inputTimestamp: futureTimestamp,
      });
    });

    it('should return an error for an unknown tool', async () => {
      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "unknownTool",
          arguments: {},
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 5
      );
      if (!call) {
        throw new Error("No send call found with id === 5");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("code", ErrorCode.MethodNotFound);
    });

    it('should return an error for an invalid timestamp', async () => {
      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "getTimeDifference",
          arguments: {
            timestamp: "invalid-timestamp",
            interval: "minutes",
          },
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 6
      );
      if (!call) {
        throw new Error("No send call found with id === 6");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("code", ErrorCode.InvalidParams);
    });

    it('should return an error when required fields are missing', async () => {
      const request = {
        jsonrpc: "2.0" as "2.0",
        id: 7,
        method: "tools/call",
        params: {
          name: "getTimeDifference",
          arguments: {
            // Missing required "timestamp" field.
            interval: "minutes",
          },
        },
      };

      if (transport.onmessage) {
        transport.onmessage(request);
      }
      await flushPromises();

      const sendMock = transport.send as jest.Mock;
      const call = sendMock.mock.calls.find(
        (call: unknown[]) => (call[0] as { id: number }).id === 7
      );
      if (!call) {
        throw new Error("No send call found with id === 7");
      }
      const response = call[0] as any;

      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("code", ErrorCode.InvalidParams);
    });
  });
});
