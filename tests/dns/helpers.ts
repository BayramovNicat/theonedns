import { mock } from 'bun:test';

export type FakeFetch = (url: unknown, init?: RequestInit) => Promise<Response>;

export function setFetch(fn: FakeFetch) {
  globalThis.fetch = fn as unknown as typeof fetch;
}

/** Returns a mock fetch that responds with a JSON body and the given HTTP status. */
export function mockJson(body: unknown, status = 200): FakeFetch {
  const ok = status >= 200 && status < 300;
  return mock(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response),
  );
}

/** Returns a mock fetch that responds with a plain-text body. */
export function mockText(body: string, status = 200): FakeFetch {
  const ok = status >= 200 && status < 300;
  return mock(() =>
    Promise.resolve({
      ok,
      status,
      text: () => Promise.resolve(body),
      json: () => Promise.resolve({}),
    } as Response),
  );
}

/** Returns a mock fetch that responds with a non-OK status and a json() that throws (simulates non-JSON error bodies). */
export function mockJsonThrows(status = 500): FakeFetch {
  return mock(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.reject(new Error('Not JSON')),
      text: () => Promise.resolve(''),
    } as Response),
  );
}

/** Build a sequential fetch mock: each call pops the next response. */
export function mockSequence(responses: FakeFetch[]): FakeFetch {
  let i = 0;
  return mock((url: unknown, init?: RequestInit) => {
    const fn = responses[i++] ?? responses[responses.length - 1];
    return fn(url, init);
  });
}
