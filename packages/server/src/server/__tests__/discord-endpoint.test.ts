/**
 * Discord Token Endpoint Integration Test
 */

import fetch from 'node-fetch';

describe('Discord Token Endpoint', () => {
  const ENDPOINT = 'http://localhost:3001/api/discord/token';

  beforeAll(async () => {
    // Wait for server to be ready (should already be running from npm start)
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should respond with error when Discord credentials not configured', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'test_code' }),
    });

    expect(response.status).toBe(500);
    const data = (await response.json()) as any;
    expect(data.error).toBe('Discord credentials not configured');
    expect(data.message).toContain('DISCORD_CLIENT_ID');
  });

  it('should respond with error when code is missing', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.error).toBe('Authorization code is required');
  });

  it('should accept POST requests with valid JSON structure', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'valid_test_code' }),
    });

    // Should not be a parsing error (4xx or 5xx related to Discord, not JSON parsing)
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600);

    const data = (await response.json()) as any;
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });
});
