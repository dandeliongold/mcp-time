import { handleMcpRequest, closeServer } from '../server';
import { jest } from '@jest/globals';

describe('Time Server Tools', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTimeDifference', () => {
    afterAll(async () => {
      await closeServer();
    });

    const makeRequest = (timestamp: string, interval?: 'minutes' | 'seconds') => ({
      params: {
        name: 'getTimeDifference',
        arguments: {
          timestamp,
          ...(interval && { interval }),
        },
      },
    });

    it('should calculate minute difference correctly', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:00.000Z'));
      const request = makeRequest('2025-02-08 17:30:00');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: -60,
        interval: 'minutes',
        inputTimestamp: '2025-02-08 17:30:00',
        currentTime: '2025-02-08 18:30:00',
      });
    });

    it('should calculate seconds difference correctly', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:30.000Z'));
      const request = makeRequest('2025-02-08 18:29:00', 'seconds');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: -90,
        interval: 'seconds',
        inputTimestamp: '2025-02-08 18:29:00',
        currentTime: '2025-02-08 18:30:30',
      });
    });

    it('should handle future timestamps (negative difference)', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:00.000Z'));
      const request = makeRequest('2025-02-08 19:30:00');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: 60,
        interval: 'minutes',
        inputTimestamp: '2025-02-08 19:30:00',
        currentTime: '2025-02-08 18:30:00',
      });
    });

    it('should handle same timestamp (zero difference)', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:00.000Z'));
      const request = makeRequest('2025-02-08 18:30:00');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: 0,
        interval: 'minutes',
        inputTimestamp: '2025-02-08 18:30:00',
        currentTime: '2025-02-08 18:30:00',
      });
    });

    it.each([
      ['2025-02-08 18:30:00', '2025-02-08T19:30:00.000Z', -60],
      ['2025-02-08 17:30:00', '2025-02-08T19:30:00.000Z', -120],
      ['2025-02-08 20:30:00', '2025-02-08T19:30:00.000Z', 60],
    ])('should handle time difference: %s to %s = %i minutes', async (input, current, expected) => {
      jest.setSystemTime(new Date(current));
      const request = makeRequest(input);

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result.difference).toBe(expected);
    });

    it('should handle invalid timestamp format', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:00.000Z'));
      const request = makeRequest('invalid-date');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);
      expect(response.isError).toBe(true);
      expect(result.error).toBe('Invalid timestamp format');
    });

    it('should handle invalid interval value', async () => {
      jest.setSystemTime(new Date('2025-02-08T18:30:00.000Z'));
      const request = {
        params: {
          name: 'getTimeDifference',
          arguments: {
            timestamp: '2025-02-08 17:30:00',
            interval: 'invalid',
          },
        },
      };

      const response = await handleMcpRequest(request);
      expect(response.isError).toBe(true);
      const result = JSON.parse(response.content[0].text);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should handle month boundary correctly', async () => {
      jest.setSystemTime(new Date('2025-03-01T00:30:00.000Z'));
      const request = makeRequest('2025-02-28 23:30:00');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: -60,
        interval: 'minutes',
        inputTimestamp: '2025-02-28 23:30:00',
        currentTime: '2025-03-01 00:30:00',
      });
    });

    it('should handle year boundary correctly', async () => {
      jest.setSystemTime(new Date('2025-01-01T00:30:00.000Z'));
      const request = makeRequest('2024-12-31 23:30:00');

      const response = await handleMcpRequest(request);
      const result = JSON.parse(response.content[0].text);

      expect(result).toEqual({
        difference: -60,
        interval: 'minutes',
        inputTimestamp: '2024-12-31 23:30:00',
        currentTime: '2025-01-01 00:30:00',
      });
    });
  });
});
