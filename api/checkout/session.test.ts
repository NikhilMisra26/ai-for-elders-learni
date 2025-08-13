import { describe, it, expect, vi, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeCreateMock = vi.fn();
const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: stripeCreateMock,
        },
      },
    })),
  };
});

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: { getUser: getUserMock },
      from: fromMock,
    }),
  };
});

function createMockReq(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
} = {}): VercelRequest {
  return {
    method: options.method ?? 'POST',
    headers: options.headers ?? {},
    body: options.body,
  } as unknown as VercelRequest;
}

function createMockRes(): VercelResponse & {
  body?: unknown;
  headers: Record<string, string>;
  statusCode: number;
} {
  const res: any = {};
  res.headers = {};
  res.statusCode = 200;
  res.setHeader = (key: string, value: string) => {
    res.headers[key] = value;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
interface MockVercelResponse {
  body?: unknown;
  headers: Record<string, string>;
  statusCode: number;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => MockVercelResponse;
  json: (payload: unknown) => MockVercelResponse;
}

function createMockRes(): VercelResponse & {
  body?: unknown;
  headers: Record<string, string>;
  statusCode: number;
} {
  const res: MockVercelResponse = {
    headers: {},
    statusCode: 200,
    setHeader: (key: string, value: string) => {
      res.headers[key] = value;
    },
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
    json: (payload: unknown) => {
      res.body = payload;
      return res;
    },
  };
  return res as VercelResponse & {
    body?: unknown;
    headers: Record<string, string>;
    statusCode: number;
  };
}

async function loadHandler() {
  vi.resetModules();
  stripeCreateMock.mockReset();
  getUserMock.mockReset();
  fromMock.mockReset();
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  process.env.PRICE_ID_ADVANCED = 'price_advanced';
  process.env.PRICE_ID_EXPERT = 'price_expert';
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.VITE_APP_URL = 'https://example.com';
  const mod = await import('./session');
  return mod.default;
}
function resetMocks() {
  vi.resetModules();
  stripeCreateMock.mockReset();
  getUserMock.mockReset();
  fromMock.mockReset();
}

function setupEnv() {
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  process.env.PRICE_ID_ADVANCED = 'price_advanced';
  process.env.PRICE_ID_EXPERT = 'price_expert';
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.VITE_APP_URL = 'https://example.com';
}

async function importHandler() {
  const mod = await import('./session');
  return mod.default;
}

async function loadHandler() {
  resetMocks();
  setupEnv();
  return await importHandler();
}
describe('/api/checkout/session', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-POST methods', async () => {
    const handler = await loadHandler();
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toHaveProperty('error');
    expect(res.headers['X-Frame-Options']).toBe('DENY');
  });

  it('rejects requests without auth token', async () => {
    const handler = await loadHandler();
    const req = createMockReq({ body: { plan: 'advanced' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('creates session for valid request', async () => {
    const handler = await loadHandler();

    getUserMock.mockResolvedValue({ data: { user: { id: '123', email: 'a@example.com' } }, error: null });
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    stripeCreateMock.mockResolvedValue({ id: 'sess_1', url: 'https://stripe.session' });

    const req = createMockReq({
      headers: { authorization: 'Bearer token', origin: 'https://example.com' },
      body: { plan: 'advanced' },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      url: 'https://stripe.session',
      session_id: 'sess_1',
    });
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
  });
});

