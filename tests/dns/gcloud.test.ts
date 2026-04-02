import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { gcloudAdapter } from '../../lib/dns/gcloud';
import { mockJson, mockSequence, setFetch } from './helpers';

const DOMAIN = 'example.com';

// A minimal valid service account JSON with a real RSA-2048 test key
const TEST_SA_JSON = JSON.stringify({
  client_email: 'test@test-project.iam.gserviceaccount.com',
  private_key:
    '-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7o4qne60TB3wopOMGOSPFkW7wS/RJiNsupqRH3LFBFOr7pBCYDRgSoMOy7ZBtxd4qEHSINGU8gJTRPlGh5HHRpvnQrMIp/RLuH5FdH3pL4KgMpASDsqhzPdRQZT0lw3nHCRpKP/vJVSquWuJBnZZ3JDsPjY6FGTUbbCmhRnC8qOuTkIhJEZBfbbHq/hBq3TekZdlhHCE6t2YZGEr0bKcTPpxfSZxLGQnQNhFMqXEyXMvQ9YzTk2nZfO+X7/l1OGvJxFqlXNhWlQq7vz3NbNm3r1GFdAbqPHoOB6g0TQniCKGqvMKxhXqkE5HZjhj9HmGiJT8JuU4YwYwGkEnFZFAgMBAAECggEADulvwN/q5JTbQXLaXxW7UZlHcQRUmgSXZFneMG5K5VqmHMxUuM8GqStZG2mDV7EFh0tE1V0E4x5gOjPqH+QvbRDCf3J4Y3J3YV0u7dQ3FYNLTS0ot9E9wVDw7hAjkJ5hIEPl1eLQSzBKCIMNaE4XB6g9fOKWcS0q4X1Y2ry7ZK7kE5lcHe3WdKF8qg7NaJTIf3vUMVuTa1a/kluAF8tVz8c9nNt39+lLK9+9x7y0G2EkhKPbXuUzfqzCwMdPwYlwgGMCq0AeFZuDZq6r4SQbGp1KIr5OQGW9mOhkk1PrDpU/TGNExNHe4KmVVmqDGsHvETq9MF8FBKeMxKB7N5h6AQKBgQDvZQ0N0rmpFBK0fXK7qAHkKqXG30LFtA3N1SXl9M2E3mH4cxMH+Kz2F3c4xHC2V4K4uDQSmzIhJ5Q6vMhNl8P/nH8VxPBzCBXbNVPwLq6lFnF9sT5yvkEWmPzXI2y+KTmvVHs9qCcGH7D8GHLPJIJ0nN59rfLmb2y1d1tcrwKBgQDJNXrdvpJvQPK9j9K3Q6QW9U8Vb5S5H8lX5m1qIXHEJ0ADhqc4QzIl0PQdC04RB5g9rIUKTqtMiT4bXmUnWMAnG2K5v3bkqmC8rZHN4bN4z4G3p0FYsJPcI5gLQ2kGCJN/JxrZlMz0Q5jPAEd3pSMjzq0+LoMiRymb4QKBgFfAcz5sMTh2rqD5IfD6h8y0wGRNh8RbDvZLv6wBiWS4+qGJaI6pGCcRnEkQ5PsNsPm2Y7N0OP9C1XyFhJISwNJ0+NMpFN0ZYjFfr7M0rH4L3N+qP1jFHFi3C5vHVsASwUiJB/N3zOQm7M7aZ/2S3v0Z5u9FBpvnQrMIJ4eLAoGBAIsEkDHBv6+1TQHS9RMYTiHaKqWiQ0lXBrWvUOLxElKGTrNBF1bSi7L2eYXO7bDAFp65P2oN+YJe3jNHXVfZc7ooW3Nz0B2qVnZ5wYELDSomH9PGlqXvALm/RRkJrU+pXQ4y1LJQ6YEGxRG6a8LO9jIaZ3WGnVOEpAv2KsYBAoGAFDSVpjpHkjhEFePM7d5KHOQ/5VJoNJZrV3G5b4kHiVbMWiVNfGHXcMpJSvqGW+YUzQ5K1q8xE3/oWZQzB+2SJhWvZvLlBpFJzM8R4N9/XqMN+A0pGiKdsFq3L0QNRCf5JW/Kv1NqhF+lA5e3W3nYuRl7AE/dJBY8hxYz5=-----END PRIVATE KEY-----',
});

const CREDS = {
  service_account_json: TEST_SA_JSON,
  project_id: 'my-project',
  managed_zone: 'my-zone',
};

let originalFetch: typeof globalThis.fetch;
let originalCrypto: typeof globalThis.crypto;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalCrypto = globalThis.crypto;

  // Mock the entire crypto object
  const mockedSubtle = {
    importKey: mock(() => Promise.resolve({ type: 'private' })),
    sign: mock(() => Promise.resolve(new Uint8Array(32).buffer)),
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...originalCrypto,
      subtle: mockedSubtle,
    },
    configurable: true,
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.defineProperty(globalThis, 'crypto', {
    value: originalCrypto,
    configurable: true,
  });
});

describe('gcloudAdapter', () => {
  describe('verify', () => {
    it('returns invalid for JSON parse error', async () => {
      const r = await gcloudAdapter.verify(
        { ...CREDS, service_account_json: 'not-json' },
        DOMAIN,
      );
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/invalid service account/i);
    });

    it('returns invalid when required fields are missing', async () => {
      const r = await gcloudAdapter.verify(
        {
          ...CREDS,
          service_account_json: JSON.stringify({ client_email: 'x@y.com' }),
        },
        DOMAIN,
      );
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/missing required fields/i);
    });

    it('returns invalid when JSON is too large', async () => {
      const r = await gcloudAdapter.verify(
        { ...CREDS, service_account_json: 'x'.repeat(65_537) },
        DOMAIN,
      );
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/too large/i);
    });

    it('returns valid:true when zone matches', async () => {
      setFetch(
        mockSequence([
          mockJson({ access_token: 'fake-token' }),
          mockJson({ dnsName: 'example.com.' }),
        ]),
      );
      const r = await gcloudAdapter.verify(CREDS, DOMAIN);
      expect(r.valid).toBe(true);
    });

    it('returns invalid when zone name mismatch', async () => {
      setFetch(
        mockSequence([
          mockJson({ access_token: 'fake-token' }),
          mockJson({ dnsName: 'other.com.' }),
        ]),
      );
      const r = await gcloudAdapter.verify(CREDS, DOMAIN);
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/does not match domain/i);
    });

    it('returns invalid on 401/403', async () => {
      setFetch(
        mockSequence([
          mockJson({ access_token: 'fake-token' }),
          mockJson({ error: 'forbidden' }, 403),
        ]),
      );
      const r = await gcloudAdapter.verify(CREDS, DOMAIN);
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/insufficient permissions/i);
    });

    it('returns invalid on 404', async () => {
      setFetch(
        mockSequence([
          mockJson({ access_token: 'fake-token' }),
          mockJson({ error: 'not found' }, 404),
        ]),
      );
      const r = await gcloudAdapter.verify(CREDS, DOMAIN);
      expect(r.valid).toBe(false);
      expect(r.error).toMatch(/managed zone not found/i);
    });
  });

  describe('createProvider', () => {
    it('returns an object with DnsProvider interface', () => {
      const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
      expect(typeof provider.listRecords).toBe('function');
      expect(typeof provider.createRecord).toBe('function');
      expect(typeof provider.updateRecord).toBe('function');
      expect(typeof provider.deleteRecord).toBe('function');
    });
  });
});

describe('GoogleCloudDnsProvider', () => {
  it('listRecords maps rrsets and handles pagination', async () => {
    setFetch(
      mockSequence([
        mockJson({ access_token: 'fake-token' }),
        mockJson({
          rrsets: [
            {
              name: 'example.com.',
              type: 'A',
              ttl: 300,
              rrdatas: ['1.2.3.4'],
            },
          ],
          nextPageToken: 'page2',
        }),
        mockJson({
          rrsets: [
            {
              name: 'www.example.com.',
              type: 'CNAME',
              ttl: 600,
              rrdatas: ['target.com.'],
            },
          ],
        }),
      ]),
    );

    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      id: 'A:example.com.',
      name: 'example.com',
      type: 'A',
      content: '1.2.3.4',
      ttl: 300,
    });
    expect(records[1].name).toBe('www.example.com');
  });

  it('createRecord sends POST to rrsets endpoint', async () => {
    setFetch(
      mockSequence([
        mockJson({ access_token: 'fake-token' }),
        mockJson({ name: 'sub.example.com.', type: 'A', rrdatas: ['1.1.1.1'] }),
      ]),
    );

    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'sub',
      type: 'A',
      content: '1.1.1.1',
    });
    expect(result.id).toBe('A:sub.example.com.');
  });

  it('updateRecord uses changes API (delete then add)', async () => {
    setFetch(
      mockSequence([
        mockJson({ access_token: 'fake-token' }),
        // GET existing rrset
        mockJson({
          name: 'sub.example.com.',
          type: 'A',
          ttl: 300,
          rrdatas: ['1.1.1.1'],
        }),
        // POST to changes
        mockJson({ status: 'pending' }),
      ]),
    );

    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    await provider.updateRecord('A:sub.example.com.', {
      content: '2.2.2.2',
    });
  });

  it('deleteRecord uses changes API (delete only)', async () => {
    setFetch(
      mockSequence([
        mockJson({ access_token: 'fake-token' }),
        // GET existing rrset
        mockJson({
          name: 'sub.example.com.',
          type: 'A',
          ttl: 300,
          rrdatas: ['1.1.1.1'],
        }),
        // POST to changes
        mockJson({ status: 'pending' }),
      ]),
    );

    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    await provider.deleteRecord('A:sub.example.com.');
  });

  it('deleteRecord is no-op if record not found (404)', async () => {
    setFetch(
      mockSequence([
        mockJson({ access_token: 'fake-token' }),
        // GET existing rrset returns 404
        mockJson({ error: 'not found' }, 404),
      ]),
    );

    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    await provider.deleteRecord('A:missing.example.com.');
  });

  it('handles error in token acquisition', async () => {
    setFetch(mockSequence([mockJson({ error: 'invalid_grant' }, 400)]));
    const provider = gcloudAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.listRecords()).rejects.toThrow(
      /Failed to obtain access token/,
    );
  });
});
